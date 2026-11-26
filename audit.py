"""Reproduce observed metrics from embedded 2025 data; check against supplied CSVs.
Run python audit.py from any directory. No network or API key needed.
"""
import csv,json,re,statistics as st,unicodedata as ud
from pathlib import Path
P=Path(__file__).parent
D=json.loads(re.search(r'^const D=(.*);$',(P/'index.html').read_text(),re.M).group(1)); days=D['days']; B=D['sbase']
def rows(pattern):
 f=next(p for p in (P/'data').glob('*.csv') if pattern in ud.normalize('NFC',p.name));return list(csv.DictReader(f.open(encoding='utf-8-sig')))
def check():
 idx={x['일시']:int(x['주차대수']) if x['주차대수'] else None for x in rows('olympicpark_2025_clean')}
 parking=[(d['date'],h) for d in days for h,v in enumerate(d['hrs']) if idx.get(f'{d["date"]} {h:02}:00:00')!=v]
 print('Parking: 3456 slots, mismatches:',len(parking));assert not parking
 configs=[('1-8호선',{'올림픽공원(한국체대)':'o','몽촌토성(평화의문)':'m','방이':'b'},'수송일자','역명','승차','승하차구분',lambda h:f'{h:02}-{h+1:02}시간대'),('9호선_2025',{'올림픽공원':'p','한성백제':'h','둔촌오륜':'dd'},'날짜','역사명','순승차','구분',lambda h:f'{h:02}시-{h+1:02}시')]
 for pat,keys,dc,sc,kind,kcol,fmt in configs:
  idx={(x[dc],keys[x[sc]]):x for x in rows(pat) if x[sc] in keys and x[kcol]==kind};bad=[]
  for d in days:
   for k in keys.values():
    for h in range(6,24):
     if int(idx[d['date'],k][fmt(h)])!=d['sub'][k][h]:bad.append((d['date'],k,h))
  print(pat, '7776 values, mismatches:',len(bad));assert not bad

def window(d):
 e=int(d['end'].split(':')[0]);return range(max(6,e-2),min(23,e+2)+1)
def center(d,h):return d['sub']['o'][h]+d['sub']['p'][h]
def peak(d):return max(window(d),key=lambda h:center(d,h))
def parkpeak(d):
 pairs=[(d['hrs'][h]-d['hrs'][h+1],-h) for h in window(d) if h<23 and d['hrs'][h]!=None and d['hrs'][h+1]!=None];return max(pairs) if pairs else None

def main():
 check();out=[]
 for d in days:
  h=peak(d);p=parkpeak(d);out.append({'date':d['date'],'estimated_end':d['end'],'event_count':d['n'],'estimated_gap_min':d['gap'],'rail_peak_hour':h,'rail_peak_count':center(d,h),'weekday_baseline':B['o'][h]+B['p'][h],'parking_net_decrease_peak':p[0] if p else None,'parking_peak_hour':-p[1] if p else None})
 with (P/'observed_metrics.csv').open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(out[0]));w.writeheader();w.writerows(out)
 print('Rail peak mean',st.mean(x['rail_peak_count'] for x in out),'ratio of means',sum(x['rail_peak_count'] for x in out)/sum(x['weekday_baseline'] for x in out))
 for label,sel in [('zero',lambda x:x['estimated_gap_min']==0),('>=60',lambda x:x['estimated_gap_min']!=None and x['estimated_gap_min']>=60)]:
  group=[x for x in out if sel(x)];p=[x['parking_net_decrease_peak'] for x in group if x['parking_net_decrease_peak']!=None];print(label,len(group),st.mean(x['rail_peak_count'] for x in group),len(p),st.mean(p))
 print('Parking/rail paired days and rail later',sum(x['parking_peak_hour']!=None for x in out),sum(x['parking_peak_hour']!=None and x['rail_peak_hour']>x['parking_peak_hour'] for x in out))
if __name__=='__main__':main()
