"""종료 예정 간격(0분 vs 60분 이상) 관측 차이를 관람객 규모·요일·추정 종료 시간대·공연장 구성으로 보정해 다시 본다(관측 연관, 인과 아님).
사용: python3 -I regress_v3.py <index.html> <결과 폴더>
"""
import json, re, sys, math, os
import numpy as np, pandas as pd
import statsmodels.formula.api as smf

html, RES = sys.argv[1:3]
D = json.loads(re.search(r'^const D=(.*);$', open(html, encoding='utf-8').read(), re.M).group(1))
SB = D['sbase']
def add(a, b): return [None if x is None or y is None else x + y for x, y in zip(a, b)]
def endH(d): h, m = d['end'].split(':'); return int(h) + int(m) / 60
rows = []
for d in D['days']:
    if not d.get('sub') or d['gap'] is None or not (d['gap'] == 0 or d['gap'] >= 60): continue
    CC = add(d["sub"]["o"], d["sub"]["p"]); eh = math.floor(endH(d)); a, b = max(6, eh - 2), min(23, eh + 2)
    ph = max(range(a, b + 1), key=lambda h: (CC[h] if CC[h] is not None else -1))
    hrs = d['hrs']; pk = [hrs[h] - hrs[h + 1] for h in range(max(0, eh - 2), min(22, eh + 2) + 1) if hrs[h] is not None and hrs[h + 1] is not None]
    vs = {s['v'] for s in d['shows']}
    rows.append(dict(date=d['date'], g60=int(d['gap'] >= 60), peak=CC[ph], park=max(pk) if pk else np.nan, aud=d['aud'] if d['aud'] else np.nan,
                     wd=d['wd'], endh=eh, kspo=int('KSPO DOME' in vs), n=d['n']))
df = pd.DataFrame(rows)
df['wk'] = df['wd'].map(lambda w: w if w in ('금', '토', '일') else '평일')
df['aud_k'] = df['aud'] / 1000
out = []
def fit(y, formula, data, label):
    m = smf.ols(formula, data=data).fit(cov_type='HC1')
    base = data.loc[data.g60 == 0, y].mean()
    b, lo, hi, p = m.params['g60'], *m.conf_int().loc['g60'], m.pvalues['g60']
    out.append(dict(target=y, model=label, n=int(m.nobs), coef=round(b, 1), ci_low=round(lo, 1), ci_high=round(hi, 1), p_value=round(p, 3),
                    pct_of_gap0_mean=round(b / base * 100, 1), pct_ci_low=round(lo / base * 100, 1), pct_ci_high=round(hi / base * 100, 1)))
for y in ('peak', 'park'):
    sub = df.dropna(subset=[y])
    fit(y, f'{y} ~ g60', sub, '보정 없음(단순 비교)')
    sub2 = sub.dropna(subset=['aud_k'])
    fit(y, f'{y} ~ g60 + aud_k + C(wk) + C(endh) + kspo + n', sub2, '관람객·요일·종료 시간대·KSPO 포함·공연 수 보정')
res = pd.DataFrame(out)
os.makedirs(RES, exist_ok=True)
res.to_csv(os.path.join(RES, '관측_종료간격_보정회귀.csv'), index=False, encoding='utf-8-sig')
print(res.to_string())
print('days', len(df), 'aud missing', df['aud'].isna().sum(), df.groupby('g60')[['aud', 'peak']].mean().round(1).to_dict())
