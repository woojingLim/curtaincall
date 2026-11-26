"""V3 그림·결과 표: index.html에 내장된 D로 model.js와 같은 방식으로 다시 계산한다.
사용: python3 -I make_figs_v3.py <index.html> <1번 분석 xlsx> <그림 폴더> <결과 폴더>
"""
import json, re, sys, csv, math, os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
import openpyxl

html, team_xlsx, FIG, RES = sys.argv[1:5]
os.makedirs(FIG, exist_ok=True); os.makedirs(RES, exist_ok=True)
D = json.loads(re.search(r'^const D=(.*);$', open(html, encoding='utf-8').read(), re.M).group(1))
names = {f.name for f in font_manager.fontManager.ttflist}
for c in ['Noto Sans CJK KR', 'NanumGothic', 'Malgun Gothic']:
    if c in names: plt.rcParams['font.family'] = c; break
plt.rcParams['axes.unicode_minus'] = False
OR, BL, GR, GY, TE, PU, LG = '#C55A11', '#2F5597', '#70AD47', '#8C8C8C', '#2E8B8B', '#7F6000', '#D9D9D9'
fmt = lambda v: f'{v:,.0f}'

SB = D['sbase']
def add(a, b): return [None if x is None or y is None else x + y for x, y in zip(a, b)]
SBC = add(SB['o'], SB['p'])
vmax = lambda a: max(v for v in a if v is not None)
UMAX = {'c': vmax(SBC), 'm': vmax(SB['m']), 'b': vmax(SB['b']), 'h': vmax(SB['h']), 'dd': vmax(SB['dd'])}
NB = ['m', 'b', 'h', 'dd']
CAP = {'KSPO DOME': 15000, '티켓링크 라이브 아레나(핸드볼경기장)': 5000, '올림픽홀': 3000, '우리금융아트홀': 1200}
def endH(d): h, m = d['end'].split(':'); return int(h) + int(m) / 60
def win(d): eh = math.floor(endH(d)); return max(6, eh - 2), min(23, eh + 2)
def peak(d):
    C = add(d['sub']['o'], d['sub']['p']); a, b = win(d); ph, mx = -1, -1
    for h in range(a, b + 1):
        if C[h] is not None and C[h] > mx: mx, ph = C[h], h
    return ph, mx, C
def parkpeak(d):
    hrs = d['hrs']
    if not any(v is not None for v in hrs): return None
    eh = math.floor(endH(d)); best = None
    for h in range(max(0, eh - 2), min(22, eh + 2) + 1):
        if hrs[h] is not None and hrs[h + 1] is not None:
            v = hrs[h] - hrs[h + 1]
            if best is None or v > best[1]: best = (h, v)
    return best
def stagger(d, m):
    shows = [s for s in d['shows'] if s['k'] == '공연']
    if len(shows) != 2 or d['gap'] != 0 or any(s['v'] not in CAP for s in shows): return None
    ws = [CAP[s['v']] for s in shows]; w = min(ws) / sum(ws); eh = math.floor(endH(d))
    H = list(range(max(6, eh - 2), min(23, eh + 2) + 1)); obs = add(d['sub']['o'], d['sub']['p']); nw = obs[:]; ex = [0.0] * 24; ov = 0.0
    for h in H:
        if obs[h] is not None and SBC[h] is not None: ex[h] = max(0, obs[h] - SBC[h]) * w; nw[h] -= ex[h]
    for h in H:
        dest = h + m / 60; lo = math.floor(dest); f = dest - lo
        for i, part in ((lo, 1 - f), (lo + 1, f)):
            v = ex[h] * part
            if not v: continue
            if i >= 24 or nw[i] is None: ov += v
            else: nw[i] += v
    lo, hi = H[0], min(23, H[-1] + 2)
    pk = lambda a: max(v for v in a[lo:hi + 1] if v is not None)
    return dict(w=w, overflow=ov, before=pk(obs), after=pk(nw), lo=lo, hi=hi)
def alt(d, p):
    ph, mx, C = peak(d); S = d['sub']; excess = max(0, C[ph] - SBC[ph]); target = excess * p / 100
    spare = [max(0, UMAX[k] - S[k][ph]) for k in NB]; tot = sum(spare); moved = min(target, tot)
    after = [S[k][ph] + (moved * spare[i] / tot if tot else 0) for i, k in enumerate(NB)]
    nc = C[:]; nc[ph] = C[ph] - moved; a, b = win(d)
    return dict(ph=ph, before=mx, peak=max(v for v in nc[a:b + 1] if v is not None), moved=moved, unalloc=target - moved, after=after)

days = [d for d in D['days'] if d.get('sub')]
mean = lambda a: sum(a) / len(a)
# ---- 관측
obs = []
for d in days:
    ph, mx, C = peak(d); pp = parkpeak(d)
    obs.append(dict(date=d['date'], estimated_end=d['end'], event_count=d['n'], estimated_gap_min=d['gap'], rail_peak_hour=ph, rail_peak=mx,
                    olympic5=d['sub']['o'][ph], olympic9=d['sub']['p'][ph], mongchon=d['sub']['m'][ph], bangi=d['sub']['b'][ph], hanseong=d['sub']['h'][ph], dunchon=d['sub']['dd'][ph],
                    weekday_same_hour=SBC[ph], parking_netdec_peak_hour=pp[0] if pp else None, parking_netdec_peak=pp[1] if pp else None))
g0 = [x for x in obs if x['estimated_gap_min'] == 0]; g60 = [x for x in obs if x['estimated_gap_min'] is not None and x['estimated_gap_min'] >= 60]
P = dict(n=len(obs), peak=mean([x['rail_peak'] for x in obs]), ratio=sum(x['rail_peak'] for x in obs) / sum(x['weekday_same_hour'] for x in obs),
         g0=mean([x['rail_peak'] for x in g0]), g60=mean([x['rail_peak'] for x in g60]),
         p0=mean([x['parking_netdec_peak'] for x in g0 if x['parking_netdec_peak'] is not None]), p60=mean([x['parking_netdec_peak'] for x in g60 if x['parking_netdec_peak'] is not None]),
         p0n=sum(x['parking_netdec_peak'] is not None for x in g0), p60n=sum(x['parking_netdec_peak'] is not None for x in g60))
SH = {}
for m in (30, 60, 90, 120):
    r = [(d['date'], stagger(d, m)) for d in days]; r = [(dt, x) for dt, x in r if x]
    ok = [x for dt, x in r if x['overflow'] <= 1e-9]
    SH[m] = dict(rows=r, n=len(ok), before=mean([x['before'] for x in ok]), after=mean([x['after'] for x in ok]))
AL = {p: [alt(d, p) for d in days] for p in (0, 10, 20, 30, 50)}
print('관측 평균 피크 %.1f, %.2f배, 0분 %d일 %.1f vs 60분+ %d일 %.1f (%.1f%%), 주차 %.1f(%d일) vs %.1f(%d일) (%.1f%%)' % (P['peak'], P['ratio'], len(g0), P['g0'], len(g60), P['g60'], (1 - P['g60'] / P['g0']) * 100, P['p0'], P['p0n'], P['p60'], P['p60n'], (1 - P['p60'] / P['p0']) * 100))
for m in (30, 60, 90): print('종료 %d분: %d일 %.1f → %.1f (%.1f%%)' % (m, SH[m]['n'], SH[m]['before'], SH[m]['after'], (1 - SH[m]['after'] / SH[m]['before']) * 100))
for p in (10, 20, 30): print('대체 역 %d%%: %.1f → %.1f (%.1f%%)' % (p, P['peak'], mean([x['peak'] for x in AL[p]]), (1 - mean([x['peak'] for x in AL[p]]) / P['peak']) * 100))

# ---- 결과 CSV
def wcsv(name, rows):
    with open(os.path.join(RES, name), 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
wcsv('관측_공연일별_피크.csv', obs)
sh_rows = []
for m in (30, 60, 90, 120):
    for dt, x in SH[m]['rows']:
        sh_rows.append(dict(shift_min=m, date=dt, small_show_share=round(x['w'], 4), window=f"{x['lo']}-{x['hi'] + 1}시", peak_before=round(x['before'], 1), peak_after=round(x['after'], 1),
                            overflow_after_midnight=round(x['overflow'], 1), judged='보류' if x['overflow'] > 1e-9 else '계산'))
wcsv('시나리오_종료시각조정_공연일별.csv', sh_rows)
al_rows = []
for p in (10, 20, 30, 50):
    for d, x in zip(days, AL[p]):
        al_rows.append(dict(move_pct=p, date=d['date'], peak_hour=x['ph'], peak_before=x['before'], peak_after=round(x['peak'], 1), moved=round(x['moved'], 1), unallocated=round(x['unalloc'], 1),
                            mongchon_after=round(x['after'][0], 1), bangi_after=round(x['after'][1], 1), hanseong_after=round(x['after'][2], 1), dunchon_after=round(x['after'][3], 1)))
wcsv('시나리오_대체역분산_공연일별.csv', al_rows)

# ---- 그림 1·2 (1번 분석 값, 표현만 바로잡아 다시 그림)
wb = openpyxl.load_workbook(team_xlsx, read_only=True, data_only=True)
a1 = [r for r in wb['분석1_공연일vs비공연일'].iter_rows(values_only=True)][1:13]
a2 = [r for r in wb['분석2_종료전후출차'].iter_rows(values_only=True)][1:8]
fig, ax = plt.subplots(figsize=(8, 3.9), dpi=200)
hrs = [r[0] for r in a1]; ax.plot(hrs, [r[1] for r in a1], '-o', color=OR, ms=4, label='공연 있는 금요일 (39일 평균)'); ax.plot(hrs, [r[2] for r in a1], '-o', color=GY, ms=4, label='공연 없는 금요일 (11일 평균)')
for i in (6, 8):
    ax.annotate(f'+{a1[i][3]}대', (i, a1[i][1]), textcoords='offset points', xytext=(0, 8), ha='center', fontsize=8.5, color=OR)
ax.set_ylabel('그 시각 주차 차량 수 (대)'); ax.grid(axis='y', color='#E6E6E6'); ax.set_axisbelow(True); ax.legend(frameon=False, fontsize=9)
ax.set_title('금요일 시간대별 주차 차량 수 (공연일 vs 비공연일, 2025 연계 데이터)', fontsize=11.5)
fig.tight_layout(); fig.savefig(os.path.join(FIG, 'fig1.png')); plt.close(fig)
fig, ax = plt.subplots(figsize=(8, 3.9), dpi=200)
xs = [r[0] for r in a2]; w = .38
ax.bar([x - w / 2 for x in xs], [r[3] for r in a2], w, color=GY, label='단독 공연일'); ax.bar([x + w / 2 for x in xs], [r[4] for r in a2], w, color=OR, label='복수 공연일')
ax.set_xticks(xs, ['종료\n3시간 전', '2시간 전', '1시간 전', '추정 종료\n시간대', '1시간 뒤', '2시간 뒤', '3시간 뒤'], fontsize=8.5)
ax.set_ylabel('1시간 주차 순감소 (대, 평균)'); ax.grid(axis='y', color='#E6E6E6'); ax.set_axisbelow(True); ax.legend(frameon=False, fontsize=9)
ax.set_title('추정 종료 시각 전후 1시간 주차 순감소 (출차 − 입차, 실제 출차 대수 아님)', fontsize=11.5)
fig.tight_layout(); fig.savefig(os.path.join(FIG, 'fig2.png')); plt.close(fig)

# ---- 그림 3: 피크 시간 역별 승차 vs 같은 시간 평일 평균, 평일 평균 최고치
av = {k: mean([x[k] for x in obs]) for k in ('olympic5', 'olympic9', 'mongchon', 'bangi', 'hanseong', 'dunchon', 'rail_peak')}
bkey = {'mongchon': 'm', 'bangi': 'b', 'hanseong': 'h', 'dunchon': 'dd'}
ab = {'c': mean([x['weekday_same_hour'] for x in obs])}
for k, s in bkey.items(): ab[s] = mean([SB[s][x['rail_peak_hour']] for x in obs])
share = av['rail_peak'] / (av['rail_peak'] + sum(av[k] for k in bkey)); bshare = ab['c'] / (ab['c'] + sum(ab[s] for s in bkey.values()))
fig, ax = plt.subplots(figsize=(8, 4.25), dpi=200)
st = [('c', '올림픽공원역\n(5·9호선)', OR, None), ('m', '몽촌토성역\n(8호선)', BL, 'mongchon'), ('b', '방이역\n(5호선)', GR, 'bangi'), ('h', '한성백제역\n(9호선)', TE, 'hanseong'), ('dd', '둔촌오륜역\n(9호선)', PU, 'dunchon')]
w = .36
for i, (k, lab, col, ok) in enumerate(st):
    ax.bar(i - w / 2, ab[k], w, color=GY, label='비공연 평일 같은 시간 평균' if i == 0 else None); ax.text(i - w / 2, ab[k] + 60, fmt(ab[k]), ha='center', fontsize=8.5)
    if k == 'c':
        ax.bar(i + w / 2, av['olympic5'], w, color='#E8A27A', label='공연일 피크 시간(5호선 승차)'); ax.bar(i + w / 2, av['olympic9'], w, bottom=av['olympic5'], color=OR, label='공연일 피크 시간(9호선 순승차)')
        ax.text(i + w / 2, av['rail_peak'] + 60, fmt(av['rail_peak']), ha='center', fontsize=9, fontweight='bold')
    else:
        ax.bar(i + w / 2, av[ok], w, color=col); ax.text(i + w / 2, av[ok] + 60, fmt(av[ok]), ha='center', fontsize=8.5)
    ax.hlines(UMAX[k], i - .45, i + .45, colors='black', linestyles='dotted', linewidth=1.2)
    ax.text(i - .45, UMAX[k] + 60, f'평일 평균 최고치 {fmt(UMAX[k])}', ha='left', fontsize=7.2, color='#333', bbox=dict(facecolor='white', edgecolor='none', pad=.5, alpha=.85))
ax.set_xticks(range(5), [s[1] for s in st], fontsize=9); ax.set_ylabel('시간당 승차 (명, 144일 평균)'); ax.set_ylim(0, av['rail_peak'] * 1.12)
ax.grid(axis='y', color='#E6E6E6'); ax.set_axisbelow(True); ax.legend(loc='upper right', fontsize=8, frameon=False)
ax.set_title(f'추정 종료 ±2시간 피크 때 주변 5개 역 중 올림픽공원역 비중 {share * 100:.0f}% (평일 같은 시간 {bshare * 100:.0f}%)', fontsize=11)
fig.text(.01, .01, '평일 평균 최고치 = 비공연 월~목 시간대별 평균 중 가장 많은 1시간. 역 수용능력이 아님.', fontsize=7.5, color='#555')
fig.tight_layout(rect=(0, .03, 1, 1)); fig.savefig(os.path.join(FIG, 'fig3.png')); plt.close(fig)

# ---- 그림 4: 관측 비교
fig, axs = plt.subplots(1, 2, figsize=(8, 3.9), dpi=200)
for ax, t, vals, ns, col in [(axs[0], '올림픽공원역(5·9호선) 피크 승차 (명)', [P['g0'], P['g60']], [len(g0), len(g60)], BL), (axs[1], '주차 순감소 피크 (대/시간)', [P['p0'], P['p60']], [P['p0n'], P['p60n']], OR)]:
    b = ax.bar([0, 1], vals, .55, color=[LG, col])
    for x, v, n in zip([0, 1], vals, ns): ax.text(x, v * 1.02, f'{fmt(v)}\n({n}일)', ha='center', fontsize=9)
    ax.set_xticks([0, 1], ['종료 예정 간격\n0분', '60분 이상']); ax.set_title(t, fontsize=10.5); ax.set_ylim(0, max(vals) * 1.22); ax.grid(axis='y', color='#E6E6E6'); ax.set_axisbelow(True)
    ax.text(.5, max(vals) * 1.12, f'{(1 - vals[1] / vals[0]) * 100:.1f}% 낮음', ha='center', fontsize=10, fontweight='bold', color=col)
fig.suptitle('복수 공연일: 종료 예정 간격별 관측 비교 (관람객 규모·요일·공연장 미통제, 인과효과 아님)', fontsize=10)
fig.tight_layout(); fig.savefig(os.path.join(FIG, 'fig4.png')); plt.close(fig)

# ---- 그림 5: 종료 시각 조정 시나리오
fig, ax = plt.subplots(figsize=(8, 3.6), dpi=200)
ms = [30, 60, 90]; reds = [(1 - SH[m]['after'] / SH[m]['before']) * 100 for m in ms]
ax.bar(range(3), reds, .5, color=[GR, GR, '#A9D18E'])
for i, (m, r) in enumerate(zip(ms, reds)): ax.text(i, r + .5, f'-{r:.1f}%\n({SH[m]["n"]}일 평균)', ha='center', fontsize=9.5)
ax.set_xticks(range(3), [f'작은 공연 종료\n{m}분 늦춤' for m in ms]); ax.set_ylabel('비교 구간 피크 감소율 (%)'); ax.set_ylim(0, max(reds) * 1.35)
ax.grid(axis='y', color='#E6E6E6'); ax.set_axisbelow(True)
ax.set_title('시나리오: 종료 예정 간격 0분인 두 공연일(23일)에 종료 시각을 조정했다면', fontsize=11)
fig.text(.01, .01, '인원 보존(옮길 뿐 사라지지 않음) · 자정 이후로 넘어가는 날은 판정 보류(30·60분 3일, 90분 11일) · 표본이 달라 90분과 60분을 바로 비교하지 않음 · 가정 기반 계산', fontsize=7.2, color='#555')
fig.tight_layout(rect=(0, .04, 1, 1)); fig.savefig(os.path.join(FIG, 'fig5.png')); plt.close(fig)

# ---- 그림 6: 대체 역 분산 시나리오
fig, ax = plt.subplots(figsize=(8, 4.1), dpi=200)
ps = [0, 10, 20, 30]; w = .16
keys = [('c', '올림픽공원역(5·9호선) 비교 구간 피크', OR), ('m', '몽촌토성역', BL), ('b', '방이역', GR), ('h', '한성백제역', TE), ('dd', '둔촌오륜역', PU)]
for j, (k, lab, col) in enumerate(keys):
    xs = [i + (j - 2) * w for i in range(4)]
    vs = [mean([x['peak'] for x in AL[p]]) for p in ps] if k == 'c' else [mean([x['after'][NB.index(k)] for x in AL[p]]) for p in ps]
    ax.bar(xs, vs, w, color=col, label=lab)
    if k == 'c':
        for p, x, v in zip(ps, xs, vs): ax.text(x, v + 60, fmt(v) + ('' if p == 0 else f' (-{(1 - v / P["peak"]) * 100:.1f}%)'), ha='left' if p else 'center', fontsize=8)
ax.set_xticks(range(4), ['분산 없음', '초과 승차의\n10% 분산 가정', '20%', '30%'], fontsize=9.5); ax.set_ylabel('시간당 승차 (명, 144일 평균)')
ax.grid(axis='y', color='#E6E6E6'); ax.set_axisbelow(True); ax.legend(fontsize=7.8, frameon=False, ncol=3, loc='upper right'); ax.set_ylim(0, P['peak'] * 1.28)
ax.set_title('시나리오: 원래 피크 시간의 초과 승차 일부를 주변 4개 역으로 분산했다면', fontsize=11)
un30 = sum(x['unalloc'] > .01 for x in AL[30])
fig.text(.01, .01, f'각 역의 평일 평균 최고치까지의 여유에 비례 배분, 넘는 몫은 미배분(30%에서 {un30}일) · 이동 뒤 다른 시간대까지 피크 재계산 · 이동 시차·환승·수용능력 미반영', fontsize=7.2, color='#555')
fig.tight_layout(rect=(0, .03, 1, 1)); fig.savefig(os.path.join(FIG, 'fig6.png')); plt.close(fig)

json.dump(dict(P=P, shift={m: dict(n=SH[m]['n'], before=SH[m]['before'], after=SH[m]['after']) for m in SH},
               alt={p: mean([x['peak'] for x in AL[p]]) for p in AL}, share=share, bshare=bshare, av=av, um=UMAX),
          open(os.path.join(RES, 'summary_v3.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('share %.3f base %.3f' % (share, bshare), 'av', {k: round(v) for k, v in av.items()})
