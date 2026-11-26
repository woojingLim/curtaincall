"""지도 앱용 추가 데이터(M) 만들기: 시각표(다음 열차), 노선 순서, 목적지, 좌표, 주변 장소.
사용: python3 -I prep_map.py <현재 index.html> <열차운행시각표 csv> <출력 json>
"""
import csv, json, sys, math

src_html, tt_csv, out = sys.argv[1:4]
h = open(src_html, encoding='utf-8').read()
i = h.find('const D='); j = h.find('\n', i)
D = json.loads(h[i + 8:j].rstrip(';'))

# ---- 1) 시각표: 역·호선 키 → 요일 → 방향 → [[출발분, 행선지번호, 급행]]
KEY = {('올림픽공원', '5'): 'o', ('올림픽공원', '9'): 'p', ('몽촌토성', '8'): 'm',
       ('방이', '5'): 'b', ('한성백제', '9'): 'h', ('둔촌오륜', '9'): 'dd'}
DT = {'DAY': '평일', 'SAT': '토요일', 'END': '휴일'}
dests = []
tt = {}
for r in csv.DictReader(open(tt_csv, encoding='utf-8-sig')):
    k = KEY.get((r['역사명'], r['호선']))
    if not k:
        continue
    t = r['열차출발시간'] or r['열차도착시간']
    if not t:
        continue
    hh, mm, ss = map(int, t.split(':'))
    m = hh * 60 + mm
    if m < 240:          # 00:xx 로 적힌 심야 열차는 24시 이후로
        m += 1440
    d = r['도착역']
    if d not in dests:
        dests.append(d)
    tt.setdefault(k, {}).setdefault(DT[r['주중주말']], {}).setdefault(r['방향'], []).append(
        [m, dests.index(d), int(r['급행여부'] == '1')])
for k in tt:
    for dt in tt[k]:
        for dr in tt[k][dt]:
            tt[k][dt][dr].sort()

# ---- 2) 노선 순서(서울교통공사 노선도 기준). UP/DOWN은 시각표의 행선지로 확인함
LINES = {
    '9': {'order': ['개화', '김포공항', '공항시장', '신방화', '마곡나루', '양천향교', '가양', '증미', '등촌', '염창', '신목동', '선유도',
                    '당산', '국회의사당', '여의도', '샛강', '노량진', '노들', '흑석', '동작', '구반포', '신반포', '고속터미널', '사평',
                    '신논현', '언주', '선정릉', '삼성중앙', '봉은사', '종합운동장', '삼전', '석촌고분', '석촌', '송파나루', '한성백제',
                    '올림픽공원', '둔촌오륜', '중앙보훈병원'],
          'DOWN': -1, 'UP': 1,   # DOWN = 순서가 작아지는 쪽(개화 방면)
          'express': ['김포공항', '마곡나루', '가양', '염창', '당산', '여의도', '노량진', '동작', '고속터미널', '신논현', '선정릉',
                      '봉은사', '종합운동장', '석촌', '올림픽공원', '중앙보훈병원'],
          'color': '#BDB092', 'name': '9호선'},
    '5': {'order': ['방화', '개화산', '김포공항', '송정', '마곡', '발산', '우장산', '화곡', '까치산', '신정', '목동', '오목교', '양평',
                    '영등포구청', '영등포시장', '신길', '여의도', '여의나루', '마포', '공덕', '애오개', '충정로', '서대문', '광화문',
                    '종로3가', '을지로4가', '동대문역사문화공원', '청구', '신금호', '행당', '왕십리', '마장', '답십리', '장한평', '군자',
                    '아차산', '광나루', '천호', '강동', '둔촌동', '올림픽공원', '방이', '오금', '개롱', '거여', '마천'],
          'UP': -1, 'DOWN': 1, 'color': '#996CAC', 'name': '5호선'},
    '8': {'order': ['별내', '다산', '동구릉', '구리', '장자호수공원', '암사역사공원', '암사', '천호', '강동구청', '몽촌토성', '잠실',
                    '석촌', '송파', '가락시장', '문정', '장지', '복정', '남위례', '산성', '남한산성입구', '단대오거리', '신흥', '수진', '모란'],
          'UP': -1, 'DOWN': 1, 'color': '#E6186C', 'name': '8호선'},
}
for ln, L in LINES.items():
    for d in dests:
        pass
# 행선지가 노선 순서에 모두 있는지 확인
STN_LINE = {'o': ('5', '올림픽공원'), 'p': ('9', '올림픽공원'), 'm': ('8', '몽촌토성'), 'b': ('5', '방이'),
            'h': ('9', '한성백제'), 'dd': ('9', '둔촌오륜')}
for k, (ln, nm) in STN_LINE.items():
    order = LINES[ln]['order']
    assert nm in order, nm
    for dt in tt[k]:
        for dr, rows in tt[k][dt].items():
            for m, di, e in rows:
                dn = dests[di]
                assert dn in order, (k, dn)
                # 방향 검증: 행선지가 그 방향에 있어야 함
                sgn = LINES[ln][dr]
                assert (order.index(dn) - order.index(nm)) * sgn > 0, (k, dr, dn)

# ---- 3) 목적지(자주 가는 곳). via: 노선, 내릴 역, 메모
DEST = [
    {'id': 'jamsil', 'n': '잠실', 'sub': '2호선 환승', 'via': [['8', '잠실']]},
    {'id': 'seokchon', 'n': '석촌', 'sub': '석촌호수', 'via': [['9', '석촌'], ['8', '석촌']]},
    {'id': 'sports', 'n': '종합운동장', 'sub': '2호선 환승', 'via': [['9', '종합운동장']]},
    {'id': 'gangnam', 'n': '신논현', 'sub': '강남', 'via': [['9', '신논현']]},
    {'id': 'express', 'n': '고속터미널', 'sub': '3·7호선 환승', 'via': [['9', '고속터미널']]},
    {'id': 'yeouido', 'n': '여의도', 'sub': '', 'via': [['9', '여의도'], ['5', '여의도']]},
    {'id': 'gimpo', 'n': '김포공항', 'sub': '', 'via': [['9', '김포공항'], ['5', '김포공항']]},
    {'id': 'gwanghwa', 'n': '광화문', 'sub': '종로3가 지나서', 'via': [['5', '광화문']]},
    {'id': 'wangsimni', 'n': '왕십리', 'sub': '2호선·경의중앙 환승', 'via': [['5', '왕십리']]},
    {'id': 'cheonho', 'n': '천호', 'sub': '', 'via': [['5', '천호'], ['8', '천호']]},
    {'id': 'hanam', 'n': '하남', 'sub': '강동역에서 갈아타기', 'via': [['5', '강동']]},
    {'id': 'macheon', 'n': '오금·마천', 'sub': '3호선 환승(오금)', 'via': [['5', '오금']]},
    {'id': 'garak', 'n': '가락시장', 'sub': '3호선 환승', 'via': [['8', '가락시장']]},
    {'id': 'moran', 'n': '모란', 'sub': '성남·수인분당선', 'via': [['8', '모란']]},
    {'id': 'guri', 'n': '구리·별내', 'sub': '', 'via': [['8', '구리']]},
    {'id': 'vhs', 'n': '중앙보훈병원', 'sub': '', 'via': [['9', '중앙보훈병원']]},
]
for d in DEST:
    for ln, s in d['via']:
        assert s in LINES[ln]['order'], s

# ---- 4) 좌표 → 지도 좌표(m). 위키백과 좌표, 올림픽홀은 카카오맵 도보 거리로 추정(검산: 같은 방법으로 KSPO DOME을 30m 안으로 맞춤)
LAT0, LNG0 = 37.5275, 127.1080
KX, KY = 111320 * math.cos(math.radians(37.517)), 110950
def xy(lat, lng):
    return [round((lng - LNG0) * KX), round((LAT0 - lat) * KY)]
GEO = {
    'stn': {'c': xy(37.516143, 127.130871), 'm': xy(37.5175, 127.11278), 'b': xy(37.50861, 127.12583),
            'h': xy(37.5166694, 127.1162111), 'dd': xy(37.5198, 127.1384)},
    'venue': {'KSPO DOME': xy(37.51916, 127.127514), '티켓링크 라이브 아레나(핸드볼경기장)': xy(37.517345, 127.126313),
              '올림픽홀': xy(37.51407, 127.12707)},
    'size': [round((127.142 - LNG0) * KX), round((LAT0 - 37.506) * KY)],
}
fort = xy(37.52167, 127.12278)
gate = xy(37.5179, 127.1152)

POI = [
    {'id': 'gate', 'n': '평화의 문', 'cat': 'walk', 'xy': gate, 'when': ['before', 'after'],
     'd': '올림픽공원 대표 조형물. 몽촌토성역 1번 출구 앞이라 귀가길에 들르기 좋아요.', 'near': ['m', 'h']},
    {'id': 'flag', 'n': '국기광장·호반무대', 'cat': 'walk', 'xy': [gate[0] + 120, gate[1] - 90], 'when': ['before', 'after'],
     'd': '평화의 문 옆 광장과 호숫가 무대.', 'near': ['m', 'h']},
    {'id': 'fort', 'n': '몽촌토성 산책로', 'cat': 'walk', 'xy': fort, 'when': ['before'],
     'd': '백제 한성 시기 토성을 따라 걷는 언덕길.', 'near': ['h', 'm']},
    {'id': 'museum', 'n': '한성백제박물관', 'cat': 'see', 'xy': [GEO['stn']['h'][0] + 150, GEO['stn']['h'][1] + 120], 'when': ['before'],
     'd': '백제 한성 시기 역사 박물관. 한성백제역 가까이에 있어요.', 'near': ['h']},
    {'id': 'soma', 'n': '소마미술관', 'cat': 'see', 'xy': None, 'when': ['before'], 'd': '올림픽공원 안 미술관.', 'near': []},
    {'id': 'olmu', 'n': '서울올림픽기념관', 'cat': 'see', 'xy': None, 'when': ['before'], 'd': '1988 서울올림픽 기록을 모은 전시관.', 'near': []},
    {'id': 'sculpt', 'n': '올림픽 조각공원', 'cat': 'walk', 'xy': None, 'when': ['before'], 'd': '공원 곳곳의 야외 조각 작품.', 'near': []},
    {'id': 'rose', 'n': '장미광장', 'cat': 'walk', 'xy': None, 'when': ['before'], 'd': '계절마다 꽃이 피는 정원.', 'near': []},
    {'id': 'lake', 'n': '석촌호수', 'cat': 'out', 'xy': None, 'when': ['before', 'after'],
     'd': '호수 둘레 산책로와 롯데월드 매직아일랜드. 잠실·석촌 방면으로 간다면 들렀다 가기 좋아요.', 'via': [['8', '잠실'], ['9', '석촌']]},
    {'id': 'mall', 'n': '롯데월드몰', 'cat': 'food', 'xy': None, 'when': ['before'],
     'd': '식당가·카페가 모인 쇼핑몰. 늦은 시간엔 영업시간을 확인하세요.', 'via': [['8', '잠실']]},
]

M = {'tt': tt, 'dests': dests, 'lines': LINES, 'DEST': DEST, 'geo': GEO, 'poi': POI, 'fort': fort, 'gate': gate}
json.dump(M, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('tt keys', {k: {dt: {dr: len(v) for dr, v in x.items()} for dt, x in tt[k].items()} for k in tt})
print('dests', dests)
print('geo', GEO)
print('size', len(json.dumps(M, ensure_ascii=False, separators=(',', ':'))))
