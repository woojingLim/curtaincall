/* ===== 커튼콜 이후 · 계산 모델(화면과 분리: audit_model.js가 이 부분만 실행해 검증) ===== */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n==null||isNaN(n)?'–':Math.round(n).toLocaleString('ko-KR');
const hm=m=>m==null?'–':`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(Math.round(m)%60).padStart(2,'0')}`;
const vmax=a=>Math.max(...a.filter(v=>v!=null));
const addArr=(a,b)=>a.map((v,h)=>v==null||b[h]==null?null:v+b[h]);
const byId=Object.fromEntries(D.days.map(d=>[d.id,d]));
const SB=D.sbase, SBC=addArr(SB.o,SB.p);
// 역·호선 키: o=올림픽공원(5), p=올림픽공원(9), m=몽촌토성(8), b=방이(5), h=한성백제(9), dd=둔촌오륜(9)
const SK={o:{n:'올림픽공원',ln:'5',g:'c'},p:{n:'올림픽공원',ln:'9',g:'c'},m:{n:'몽촌토성',ln:'8',g:'m'},b:{n:'방이',ln:'5',g:'b'},h:{n:'한성백제',ln:'9',g:'h'},dd:{n:'둔촌오륜',ln:'9',g:'dd'}};
const GRP={c:{n:'올림픽공원',k:['o','p']},m:{n:'몽촌토성',k:['m']},b:{n:'방이',k:['b']},h:{n:'한성백제',k:['h']},dd:{n:'둔촌오륜',k:['dd']}};
const UM={};Object.keys(SK).forEach(k=>UM[k]=vmax(SB[k]));
const UMAX={c:vmax(SBC),m:UM.m,b:UM.b,h:UM.h,dd:UM.dd};
const END_OF={5:{UP:'방화',DOWN:'마천'},8:{UP:'별내',DOWN:'모란'},9:{UP:'중앙보훈병원',DOWN:'개화'}};
const HOL=new Set(D.holidays);
const dayType=d=>{const wd=new Date(d.date+'T00:00:00').getDay();return HOL.has(d.date)||wd===0?'휴일':wd===6?'토요일':'평일'};
const endMin=d=>+d.end.slice(0,2)*60+(+d.end.slice(3));
const endH=d=>endMin(d)/60;
const startH=d=>Math.min(...d.shows.filter(s=>s.s).map(s=>+s.s.slice(0,2)+(+s.s.slice(3))/60));
const title=d=>d.shows.filter(s=>s.k==='공연').map(s=>s.t).join(' · ')||d.shows.map(s=>s.t).join(' · ');
const venues=d=>[...new Set(d.shows.map(s=>s.v))];
const shortV=v=>v.replace('티켓링크 라이브 아레나(핸드볼경기장)','티켓링크 라이브 아레나').replace(' 등','');
const walkProfile=v=>D.walk[v]?v:'KSPO DOME';
const walkOf=(v,g)=>D.walk[walkProfile(v)][g==='c'?'o':g];
const LV=[{t:'승차 적음',c:'#12A150'},{t:'승차 보통',c:'#D99A00'},{t:'승차 많음',c:'#F06A00'},{t:'승차 매우 많음',c:'#E5383B'}]; // 2025년 같은 날 승차 ÷ 그 역 평일 평균 최고치(수용능력 아님)
function crowd(d,k,h){if(!d||!d.sub||h<6||h>23)return null;const v=d.sub[k]?.[h];if(v==null)return null;const r=v/UM[k];return {v,r,lv:r<.6?0:r<1?1:r<1.6?2:3}}
function crowdG(d,g,h){const ks=GRP[g].k.map(k=>crowd(d,k,h)).filter(Boolean);if(!ks.length)return null;return ks.reduce((a,b)=>b.lv>a.lv?b:a)}
const hh=h=>`${h}시~${h+1}시`;
const CAP={'KSPO DOME':15000,'티켓링크 라이브 아레나(핸드볼경기장)':5000,'올림픽홀':3000,'우리금융아트홀':1200}; // 좌석 규모 가정(실제 공연별 관객 수 아님)
const NB=[['m','몽촌토성역','8'],['b','방이역','5'],['h','한성백제역','9'],['dd','둔촌오륜역','9']];
const combOf=Sx=>addArr(Sx.o,Sx.p);
// 피크 = 마지막 추정 종료 시각이 속한 시간대 ±2시간 안의 최대 1시간 (분석 엑셀·audit.py와 같은 정의)
const winOf=d=>{const eh=Math.floor(endH(d));return [Math.max(6,eh-2),Math.min(23,eh+2)]};
function peakOf(Sx,d){const C=combOf(Sx),[a,b]=winOf(d);let ph=-1,mx=-1;for(let h=a;h<=b;h++)if(C[h]!=null&&C[h]>mx){mx=C[h];ph=h}return {ph,mx,C}}
// 주차 순감소 = 연속 두 시각의 주차 차량 수 차이(출차 − 입차). 실제 출차 대수가 아님
function outflow(hrs){const o=Array(24).fill(null);for(let h=0;h<23;h++)if(hrs[h]!=null&&hrs[h+1]!=null)o[h]=hrs[h]-hrs[h+1];return o}
function parkPeak(d){if(!d.hrs.some(v=>v!=null))return null;const o=outflow(d.hrs),eh=Math.floor(endH(d));let ph=-1,mx=-Infinity;for(let h=Math.max(0,eh-2);h<=Math.min(22,eh+2);h++)if(o[h]!=null&&o[h]>mx){mx=o[h];ph=h}return ph<0?null:{ph,mx,o}}
// 종료 시각 이동: 종료 예정 간격 0분인 '정확히 두 공연'만. 작은 공연 몫(좌석 비율)의 초과 승차를 min분 뒤로 옮김. 인원 보존, 자정 이후는 overflow로 따로 셈
function stagger(obs,base,d,min){const shows=d.shows.filter(s=>s.k==='공연');if(shows.length!==2||d.gap!==0||shows.some(s=>!CAP[s.v]))return null;
  const ws=shows.map(s=>CAP[s.v]),w=Math.min(...ws)/(ws[0]+ws[1]),eh=Math.floor(endH(d)),H=[];for(let h=Math.max(6,eh-2);h<=Math.min(23,eh+2);h++)H.push(h);
  const nw=obs.slice(),ex=Array(24).fill(0);let overflow=0;
  for(const h of H){if(obs[h]!=null&&base[h]!=null){ex[h]=Math.max(0,obs[h]-base[h])*w;nw[h]-=ex[h]}}
  for(const h of H){const dest=h+min/60,lo=Math.floor(dest),f=dest-lo;for(const [i,part] of [[lo,1-f],[lo+1,f]]){const v=ex[h]*part;if(!v)continue;if(i>=24||nw[i]==null)overflow+=v;else nw[i]+=v}}
  const lo=H[0],hi=Math.min(23,H[H.length-1]+2),pk=a=>Math.max(...a.slice(lo,hi+1).filter(v=>v!=null));
  return {nw,w,H,overflow,lo,hi,before:pk(obs),after:pk(nw)}}
// 대체 역 분산: 원래 피크 시간의 초과 승차(평일 평균 대비) 중 pct%를 4개 역에 '평일 평균 최고치까지의 여유'에 비례 배분. 여유를 넘는 몫은 배분하지 않음(미배분). 이동 뒤 비교 구간 최대치를 다시 계산
function altScenario(Sx,d,pct){const {ph,C}=peakOf(Sx,d),excess=Math.max(0,C[ph]-SBC[ph]),target=excess*pct/100;
  const spare=NB.map(([k])=>Math.max(0,UMAX[k]-Sx[k][ph])),total=spare.reduce((a,b)=>a+b,0),moved=Math.min(target,total);
  const after=NB.map(([k],i)=>Sx[k][ph]+(total?moved*spare[i]/total:0)),center=C[ph]-moved,nc=C.slice();nc[ph]=center;const [a,b]=winOf(d);
  const peak=Math.max(...nc.slice(a,b+1).filter(v=>v!=null));return {ph,target,moved,after,center,peak,unallocated:target-moved}}
// 전체 공연일 요약(요약 화면·audit_model.js 공통)
function summary(){const days=D.days.filter(d=>d.sub),pk=days.map(d=>{const p=peakOf(d.sub,d);return {d,ph:p.ph,v:p.mx,b:SBC[p.ph]}});
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length,g0=pk.filter(x=>x.d.gap===0),g60=pk.filter(x=>x.d.gap!=null&&x.d.gap>=60);
  const sh=m=>{const r=days.map(d=>stagger(combOf(d.sub),SBC,d,m)).filter(x=>x&&x.overflow<=1e-9);return {n:r.length,before:mean(r.map(x=>x.before)),after:mean(r.map(x=>x.after))}};
  const al=p=>{const r=days.map(d=>altScenario(d.sub,d,p));return {after:mean(r.map(x=>x.peak)),unalloc:r.filter(x=>x.unallocated>.01).length}};
  const base=mean(pk.map(x=>x.v));
  return {days:days.length,shows:D.days.reduce((s,d)=>s+d.shows.length,0),peak:base,ratio:pk.reduce((s,x)=>s+x.v,0)/pk.reduce((s,x)=>s+x.b,0),
    g0:{n:g0.length,v:mean(g0.map(x=>x.v))},g60:{n:g60.length,v:mean(g60.map(x=>x.v))},shift:{30:sh(30),60:sh(60),90:sh(90)},alt:{10:al(10),20:al(20),30:al(30)},base}}
function calEnd(d){const e=endMin(d);if(!d.sub)return e;const {ph}=peakOf(d.sub,d);return ph*60>e&&ph*60-e<=90?ph*60:e} // 추정 종료보다 기록상 피크 시간대가 늦으면 그 시각을 "종료 직후"로 봄(화면에 밝힘)
function trainsFrom(k,dt,dir){return (M.tt[k]?.[dt]?.[dir])||[]}
function servesRow(row,ln,si,ti,sgn){const order=M.lines[ln].order,dn=M.dests[row[1]],di=order.indexOf(dn);
  if((di-ti)*sgn<0)return false;if(row[2]&&!M.lines[ln].express.includes(order[ti]))return false;return true}
function lineDir(ln,si,ti){const L=M.lines[ln];return ['UP','DOWN'].find(dr=>L[dr]*(ti-si)>0)}
// ===== 새 공연 일정 미리보기: 2025년의 비슷한 공연일(유사 사례)로 참고 범위를 보여 줌(예측 모델이 아님) =====
const BIG=['KSPO DOME','티켓링크 라이브 아레나(핸드볼경기장)','올림픽홀'];
const RUNTIME={'콘서트':150,'팬미팅·팬콘':120,'쇼케이스':90};
const wdGroup=w=>['금','토','일'].includes(w)?w:'평일';
const gapCat=(n,gap)=>n===1?'single':gap===0?'0':(gap||0)>=60?'60+':'1-59';
function featOfDay(d){const vs=new Set(d.shows.map(s=>s.v).filter(v=>BIG.includes(v)));return {vs,kspo:vs.has('KSPO DOME'),eh:Math.floor(endH(d)),g:gapCat(d.n,d.gap),wd:wdGroup(d.wd),aud:d.aud||null}}
const sameSet=(a,b)=>a.size===b.size&&[...a].every(v=>b.has(v));
function simDist(q,f){let s=sameSet(q.vs,f.vs)?0:(q.kspo===f.kspo?1.5:3);s+=Math.abs(q.eh-f.eh)*.7;s+=q.g===f.g?0:1;s+=q.wd===f.wd?0:.5;
  if(q.aud)s+=f.aud?Math.abs(Math.log(q.aud/f.aud))*2:1;return s}
// q: {vs,kspo,eh,g,wd,aud} · 가장 가까운 k일(기본 7)의 피크 중앙값·최소~최대, 피크 시간대(추정 종료 대비 가장 흔한 위치)
function similarCases(q,k=7,excludeId=null){const pool=D.days.filter(d=>d.sub&&d.id!==excludeId).map(d=>({d,f:featOfDay(d),dist:simDist(q,featOfDay(d))}));
  pool.sort((a,b)=>a.dist-b.dist||(a.d.date<b.d.date?-1:1));const c=pool.slice(0,k).map(x=>{const p=peakOf(x.d.sub,x.d),pk=parkPeak(x.d);return {...x,ph:p.ph,pk:p.mx,park:pk?pk.mx:null}});
  const med=a=>{const v=[...a].sort((x,y)=>x-y),n=v.length;return n?(n%2?v[(n-1)/2]:(v[n/2-1]+v[n/2])/2):null};
  const pks=c.map(x=>x.pk),cnt={};c.forEach(x=>{const o=x.ph-x.f.eh;cnt[o]=(cnt[o]||0)+1});
  const off=+Object.entries(cnt).sort((a,b)=>b[1]-a[1]||Math.abs(a[0])-Math.abs(b[0])||a[0]-b[0])[0][0];const pv=c.map(x=>x.park).filter(v=>v!=null);
  return {cases:c,med:med(pks),lo:Math.min(...pks),hi:Math.max(...pks),ph:q.eh+off,park:pv.length?{med:med(pv),n:pv.length}:null}}
// 한 날씩 빼고 나머지로 맞혀 보기(LOO). useAud: 실제 관객 수를 '예상 관객 수'로 넣었다고 보고 계산
function looCheck(useAud){const days=D.days.filter(d=>d.sub),err=[];let cov=0,h0=0,h1=0;
  days.forEach(d=>{const f=featOfDay(d),q={...f,aud:useAud?f.aud:null},r=similarCases(q,7,d.id),act=peakOf(d.sub,d);
    err.push(Math.abs(r.med-act.mx)/act.mx);if(act.mx>=r.lo&&act.mx<=r.hi)cov++;if(r.ph===act.ph)h0++;if(Math.abs(r.ph-act.ph)<=1)h1++});
  const s=[...err].sort((a,b)=>a-b),n=days.length;return {n,medErr:(s[(n-1)>>1]+s[n>>1])/2,w30:err.filter(e=>e<=.3).length/n,cov:cov/n,h0:h0/n,h1:h1/n}}
