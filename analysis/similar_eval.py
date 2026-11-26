"""새 공연 일정 미리보기(유사 사례 7일) 정확도: 한 날씩 빼고(LOO) 나머지 143일로 맞혀 본다.
웹앱 model.js의 similarCases()·looCheck()와 같은 규칙. 사용: python3 -I similar_eval.py <index.html> <결과 폴더>
"""
import json, re, sys, math, os, statistics as st, csv
html, RES = sys.argv[1:3]
D = json.loads(re.search(r'^const D=(.*);$', open(html, encoding='utf-8').read(), re.M).group(1))
def add(a, b): return [None if x is None or y is None else x + y for x, y in zip(a, b)]
def endH(d): h, m = d['end'].split(':'); return int(h) + int(m) / 60
def peak(d):
    C = add(d['sub']['o'], d['sub']['p']); eh = math.floor(endH(d)); a, b = max(6, eh - 2), min(23, eh + 2)
    ph, mx = -1, -1
    for h in range(a, b + 1):
        if C[h] is not None and C[h] > mx: ph, mx = h, C[h]
    return ph, mx
BIG = ['KSPO DOME', '티켓링크 라이브 아레나(핸드볼경기장)', '올림픽홀']
def feat(d):
    vs = frozenset(s['v'] for s in d['shows'] if s['v'] in BIG)
    g = 'single' if d['n'] == 1 else ('0' if d['gap'] == 0 else ('60+' if (d['gap'] or 0) >= 60 else '1-59'))
    return dict(vs=vs, kspo='KSPO DOME' in vs, eh=math.floor(endH(d)), g=g, wd=d['wd'] if d['wd'] in ('금', '토', '일') else '평일', aud=d['aud'] or None)
def dist(q, f):
    s = 0 if q['vs'] == f['vs'] else (1.5 if q['kspo'] == f['kspo'] else 3)
    s += abs(q['eh'] - f['eh']) * .7 + (0 if q['g'] == f['g'] else 1) + (0 if q['wd'] == f['wd'] else .5)
    if q['aud']: s += abs(math.log(q['aud'] / f['aud'])) * 2 if f['aud'] else 1
    return s
rows = [dict(d=d, f=feat(d), pk=peak(d)) for d in D['days'] if d.get('sub')]
def similar(q, excl, k=7):
    pool = sorted((r for r in rows if r['d']['id'] != excl), key=lambda r: (dist(q, r['f']), r['d']['date']))[:k]
    v = sorted(r['pk'][1] for r in pool); n = len(v); med = v[(n - 1) // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2
    cnt = {}
    for r in pool: o = r['pk'][0] - r['f']['eh']; cnt[o] = cnt.get(o, 0) + 1
    off = sorted(cnt.items(), key=lambda t: (-t[1], abs(t[0]), t[0]))[0][0]
    return dict(med=med, lo=v[0], hi=v[-1], ph=q['eh'] + off, cases=[r['d']['date'] for r in pool])
out, summ = [], {}
for use_aud in (False, True):
    err, cov, h0, h1 = [], 0, 0, 0
    for r in rows:
        q = dict(r['f']); q['aud'] = r['f']['aud'] if use_aud else None
        s = similar(q, r['d']['id']); a = r['pk']
        e = abs(s['med'] - a[1]) / a[1]; err.append(e); ins = s['lo'] <= a[1] <= s['hi']; cov += ins; h0 += s['ph'] == a[0]; h1 += abs(s['ph'] - a[0]) <= 1
        if not use_aud:
            out.append(dict(date=r['d']['date'], actual_peak=a[1], ref_median=s['med'], ref_low=s['lo'], ref_high=s['hi'], within_range=int(ins), abs_pct_error=round(e * 100, 1),
                            actual_peak_hour=a[0], ref_peak_hour=s['ph'], similar_days=' '.join(s['cases'])))
    n = len(rows); err.sort()
    summ['예상 관객 수 입력' if use_aud else '입력 안 함'] = dict(days=n, within_range=round(cov / n * 100, 1), median_abs_pct_error=round((err[(n - 1) // 2] + err[n // 2]) / 2 * 100, 1),
                                                         within_30pct=round(sum(e <= .3 for e in err) / n * 100, 1), peak_hour_exact=round(h0 / n * 100, 1), peak_hour_within_1h=round(h1 / n * 100, 1))
os.makedirs(RES, exist_ok=True)
with open(os.path.join(RES, '새일정미리보기_LOO검증_공연일별.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(out[0])); w.writeheader(); w.writerows(out)
with open(os.path.join(RES, '새일정미리보기_LOO검증_요약.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f); w.writerow(['예상 관객 수'] + list(next(iter(summ.values())).keys()))
    for k, v in summ.items(): w.writerow([k] + list(v.values()))
for k, v in summ.items(): print(k, v)
