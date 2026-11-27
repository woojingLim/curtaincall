"""공연 포스터·예매처 정보 받아오기 (KOPIS 공연예술통합전산망 Open API)

사용: python src/fetch_kopis.py <KOPIS 서비스키>
  1) index.html에 들어 있는 2025년 공연 목록을 읽고
  2) KOPIS에서 올림픽공원 공연을 달마다 찾아 이름으로 맞춰 보고
  3) 포스터 그림은 posters/ 폴더에 내려받고 (사이트에서 다른 서버 그림을 직접 쓰면 깨지기 쉬워서)
  4) src/shows_info.json 에 저장해요. 그다음 build_app2.py로 다시 묶으면 앱에 나와요.

서비스키: kopis.or.kr → 오픈API → 이용 신청(무료).
못 찾은 공연은 마지막에 목록으로 보여 줘요. shows_info.json에 직접 적고 "manual": true를 넣으면
다음에 이 스크립트를 다시 돌려도 덮어쓰지 않아요.
"""
import json, os, re, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

BASE = 'http://www.kopis.or.kr/openApi/restful'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'shows_info.json')
PDIR = os.path.join(ROOT, 'posters')


def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': 'curtaincall/1.0'})
    with urllib.request.urlopen(req, timeout=20) as r:
        b = r.read()
    return b if binary else b.decode('utf-8', 'replace')


def norm(t):
    t = re.sub(r'[\[\]()〈〉<>《》「」『』\'"‘’“”:：\-–—~·.,!?\s]', '', t or '').lower()
    return t


def shows_from_index():
    h = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    i = h.find('const D='); j = h.find('\n', i)
    D = json.loads(h[i + 8:j].rstrip(';'))
    seen = {}
    for d in D['days']:
        for s in d['shows']:
            seen.setdefault(s['t'], {'v': s['v'], 'dates': []})['dates'].append(d['date'])
    return seen


def kopis_list(key, y, m):
    """한 달 동안 '올림픽공원' 시설의 공연 목록 (KOPIS는 한 번에 31일까지만 찾을 수 있어요)"""
    import calendar
    last = calendar.monthrange(y, m)[1]
    rows, page = [], 1
    while True:
        q = urllib.parse.urlencode({'service': key, 'stdate': f'{y}{m:02d}01', 'eddate': f'{y}{m:02d}{last}',
                                    'cpage': page, 'rows': 100, 'shprfnmfct': '올림픽공원'})
        root = ET.fromstring(get(f'{BASE}/pblprfr?{q}'))
        got = [{c.tag: (c.text or '').strip() for c in db} for db in root.findall('db')]
        rows += got
        if len(got) < 100:
            return rows
        page += 1


def kopis_detail(key, pid):
    root = ET.fromstring(get(f'{BASE}/pblprfr/{pid}?service={key}'))
    db = root.find('db')
    if db is None:
        return {}
    f = lambda k: (db.findtext(k) or '').strip()
    links = []
    for r in db.findall('./relates/relate'):
        n, u = (r.findtext('relatenm') or '').strip(), (r.findtext('relateurl') or '').strip()
        if u.startswith('http') and u not in [l['u'] for l in links]:
            links.append({'n': n or '예매처', 'u': u})
    return {'poster': f('poster'), 'from': f('prfpdfrom'), 'to': f('prfpdto'), 'genre': f('genrenm'),
            'fac': f('fcltynm'), 'links': links}


def save_poster(url, pid):
    if not url:
        return ''
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower() or '.jpg'
    os.makedirs(PDIR, exist_ok=True)
    fn = f'{pid}{ext}'
    path = os.path.join(PDIR, fn)
    if not os.path.exists(path):
        for u in (url.replace('http://', 'https://', 1), url):
            try:
                open(path, 'wb').write(get(u, binary=True)); break
            except Exception:
                continue
        else:
            return ''
    return f'posters/{fn}'


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    key = sys.argv[1]
    want = shows_from_index()
    old = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    cand = {}
    for m in range(1, 13):
        try:
            for r in kopis_list(key, 2025, m):
                cand.setdefault(r.get('mt20id'), r)
        except Exception as e:
            print(f'{m}월 목록 실패: {e}')
        time.sleep(.2)
    print(f'KOPIS에서 올림픽공원 공연 {len(cand)}건 찾음 · 맞춰 볼 공연 {len(want)}건')
    out, miss = {}, []
    for t, info in want.items():
        if old.get(t, {}).get('manual'):
            out[t] = old[t]; continue
        nt = norm(t)
        best = None
        for r in cand.values():
            nr = norm(r.get('prfnm'))
            if not nr:
                continue
            if nr == nt or (len(nt) >= 4 and (nt in nr or nr in nt)):
                # 기간 안에 우리 날짜가 들어가면 더 확실해요
                inside = any(r.get('prfpdfrom', '') <= d.replace('-', '.') <= r.get('prfpdto', '9') for d in info['dates'])
                score = (nr == nt) * 2 + inside
                if not best or score > best[0]:
                    best = (score, r)
        if not best:
            miss.append(t); continue
        r = best[1]
        try:
            det = kopis_detail(key, r['mt20id'])
        except Exception as e:
            print('상세 실패', t, e); det = {}
        poster = save_poster(det.get('poster') or r.get('poster'), r['mt20id'])
        out[t] = {'id': r['mt20id'], 'poster': poster,
                  'period': f"{det.get('from') or r.get('prfpdfrom','')}~{det.get('to') or r.get('prfpdto','')}".strip('~'),
                  'genre': det.get('genre') or r.get('genrenm', ''), 'links': det.get('links', [])}
        print('✓', t, '←', r.get('prfnm'), '(포스터 있음)' if poster else '(포스터 없음)')
        time.sleep(.15)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n저장: {OUT} · {len(out)}건 맞춤, {len(miss)}건 못 찾음')
    for t in miss:
        print('  못 찾음:', t)
    print('\n이제: python src/build_app2.py index.html src index.html')


if __name__ == '__main__':
    main()
