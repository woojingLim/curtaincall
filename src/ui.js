/* ===== 커튼콜 이후 · 지도 앱 — 화면 ===== */
const LBL={c:'r',m:'t',b:'r',h:'b',dd:'t'};
let OPTS=[];const ACCESS=2; // 역 입구 → 승강장 여유(분)
const VLL={'KSPO DOME':[37.51916,127.127514],'티켓링크 라이브 아레나(핸드볼경기장)':[37.517345,127.126313],'올림픽홀':[37.51407,127.12707]},
  GLL={c:[37.516143,127.130871],m:[37.5175,127.11278],b:[37.50861,127.12583],h:[37.5166694,127.1162111],dd:[37.5198,127.1384]};
function kakaoWalk(v,g){const t=GLL[g],tn=encodeURIComponent(GRP[g].n+'역'),f=VLL[v];
  return f?`https://map.kakao.com/link/by/walk/${encodeURIComponent(shortV(v))},${f[0]},${f[1]}/${tn},${t[0]},${t[1]}`:`https://map.kakao.com/link/to/${tn},${t[0]},${t[1]}`}
const kakaoBtn=(v,g)=>`<a class="extlink" href="${kakaoWalk(v,g)}" target="_blank" rel="noopener">${IC.walk}카카오맵 도보 길찾기 열기</a>`;

/* ---------- 열차 · 추천 계산 ---------- */
function computeOptions(){const d=S.day,dt=dayType(d),v=S.venue,dep=S.dep;OPTS=[];
  if(!S.dest)return OPTS;
  S.dest.via.forEach(([ln,target])=>{Object.keys(SK).filter(k=>SK[k].ln===ln).forEach(k=>{
    const order=M.lines[ln].order,si=order.indexOf(SK[k].n),ti=order.indexOf(target);if(si===ti)return;
    const dir=lineDir(ln,si,ti),sgn=M.lines[ln][dir],w=walkOf(v,SK[k].g),arr=dep+w;
    const rows=trainsFrom(k,dt,dir).filter(r=>servesRow(r,ln,si,ti,sgn));
    const next=rows.filter(r=>r[0]>=arr+ACCESS).slice(0,4),last=rows.length?rows[rows.length-1][0]:null;
    const cr=crowd(d,k,Math.floor(arr/60));
    const ex=M.lines[ln].express||[],a=Math.min(si,ti),b=Math.max(si,ti),xstops=ex.length&&ex.includes(order[si])&&ex.includes(order[ti])?order.slice(a+1,b+1).filter(n=>ex.includes(n)).length:null;
    OPTS.push({key:k+'|'+target,k,g:SK[k].g,ln,target,dir,stops:Math.abs(ti-si),xstops,w,arr,next,last,cr})})});
  const stopsOf=(o,r)=>r[2]&&o.xstops?o.xstops:o.stops;
  OPTS.forEach(o=>{let best=null;o.next.slice(0,3).forEach(r=>{const c=(r[0]-o.arr)+stopsOf(o,r)*2;if(!best||c<best.c)best={c,r}});o.pick=best?.r||null;o.ride=best?stopsOf(o,best.r):o.stops});
  const minStops=Math.min(...OPTS.map(o=>o.ride));
  OPTS.forEach(o=>{o.wait=o.pick?o.pick[0]-o.arr:null;
    const t=o.w+o.wait+(o.ride-minStops)*2;o.score=o.pick?(S.pref==='calm'?(o.cr?o.cr.lv:1)*100+t:t+[0,3,8,15][o.cr?o.cr.lv:1]):1e9});
  OPTS.sort((a,b)=>a.score-b.score);
  if(OPTS.length&&OPTS[0].score<1e9){const b=OPTS[0];b.best=true;
    const fast=Math.min(...OPTS.filter(o=>o.next.length).map(o=>o.next[0][0]));const calm=Math.min(...OPTS.filter(o=>o.next.length&&o.cr).map(o=>o.cr.lv));
    OPTS.forEach(o=>{o.why=[];if(!o.next.length)return;if(o.next[0][0]===fast)o.why.push('가장 먼저 타요');if(o.cr&&o.cr.lv===calm&&OPTS.length>1)o.why.push('덜 붐벼요');
      if(o.w===Math.min(...OPTS.map(x=>x.w)))o.why.push('가장 가까워요');if(o.next.some(r=>r[2]))o.why.push('급행 탈 수 있어요');if(o.ride===minStops&&OPTS.some(x=>x.ride>minStops))o.why.push(o.pick&&o.pick[2]?'급행이라 빨라요':'정거장이 적어요')})}
  if(!S.sel||!OPTS.find(o=>o.key===S.sel))S.sel=OPTS[0]?.key||null;return OPTS}

/* ---------- 작은 차트 ---------- */
function bars({vals,base,H0=16,H1=23,hl=null,color='#2563EB',stack=null,band=null,h=120}){const W=340,top=14,ch=h-34,left=4,pw=W-left*2,n=H1-H0+1,bw=pw/n;
  const all=[];for(let i=H0;i<=H1;i++){const t=(vals[i]??0)+(stack?(stack[i]??0):0);all.push(t,base?.[i]??0)}const ymax=Math.max(1,...all)*1.15,y=v=>top+ch-v/ymax*ch;
  let s=`<svg viewBox="0 0 ${W} ${h}" role="img">`;
  if(band){const a=Math.max(band[0],H0),b=Math.min(band[1],H1+1);if(b>a)s+=`<rect x="${left+(a-H0)*bw}" y="${top-6}" width="${(b-a)*bw}" height="${ch+6}" fill="#FFF4E5" rx="6"/>`}
  for(let i=H0;i<=H1;i++){const x=left+(i-H0)*bw+bw*.18,w=bw*.64,a=vals[i];if(a==null)continue;const on=hl==null||hl===i;
    s+=`<rect x="${x}" y="${y(a)}" width="${w}" height="${top+ch-y(a)}" rx="3" fill="${color}" opacity="${on?1:.35}"/>`;
    if(stack&&stack[i]!=null)s+=`<rect x="${x}" y="${y(a+stack[i])}" width="${w}" height="${y(a)-y(a+stack[i])}" rx="3" fill="${color}" opacity="${on?.55:.2}"/>`;
    if(hl===i)s+=`<text x="${x+w/2}" y="${y(a+(stack?.[i]??0))-4}" text-anchor="middle" font-size="11" font-weight="800" fill="#101828">${fmt(a+(stack?.[i]??0))}</text>`}
  if(base){let p='';for(let i=H0;i<=H1;i++){if(base[i]==null)continue;const x=left+(i-H0)*bw;p+=`M${x+bw*.1} ${y(base[i])}H${x+bw*.9}`}s+=`<path d="${p}" stroke="#475467" stroke-width="2" stroke-dasharray="3 3" fill="none"/>`}
  for(let i=H0;i<=H1;i++)if((i-H0)%(n>10?2:1)===0)s+=`<text x="${left+(i-H0+.5)*bw}" y="${h-6}" text-anchor="middle" font-size="10.5" fill="#8B95A7">${i}시</text>`;
  return s+'</svg>'}

/* ---------- 상단 · 탭 ---------- */
const TABS={aud:[['route','길찾기','route'],['near','주변','spark'],['last','막차','moon']],ops:[['sum','요약','spark'],['plan','새 일정','cal'],['over','공연일','chart'],['stn','역별','list'],['park','주차','car'],['sim','시뮬레이터','sliders']]};
function renderTop(){const d=S.day,md=d.date.slice(5).replace('-','.');
  $('#showBtn').innerHTML=`<span class="ic">${IC.ticket}</span><span class="tx"><b>${esc(title(d))}</b><small>${md} (${d.wd}) · ${esc(venues(d).map(shortV).join(' · '))} · 추정 종료 ${d.end}</small></span><span class="chev">${IC.chev}</span>`;
  document.querySelectorAll('#modeSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===S.mode));
  $('#tabs').innerHTML=TABS[S.mode].map(([id,t,ic])=>`<button role="tab" data-tab="${id}" aria-selected="${S.tab[S.mode]===id}">${IC[ic]}${t}</button>`).join('')}

/* ---------- 관람객: 길찾기 ---------- */
function timeChips(){const e=calEnd(S.day),cs=[['end','종료 직후',e],['30','+30분',e+30],['60','+1시간',e+60]];
  return `<div class="timechips" role="group" aria-label="출발 시각">${cs.map(([k,t,m])=>`<button class="chip" data-dep="${k}" data-m="${m}" aria-pressed="${S.depKey===k}">${t} <small>${hm(m)}</small></button>`).join('')}<input type="time" id="depIn" value="${hm(S.dep)}" aria-label="출발 시각 직접 입력"></div>${e!==endMin(S.day)?`<p class="small muted" style="margin:6px 2px 0">추정 종료는 ${S.day.end}(러닝타임 가정)이지만, 기록상 ${Math.floor(e/60)}시대 승차가 가장 많아 ${hm(e)}을 '종료 직후'로 봤어요.</p>`:''}`}
function tripBox(){const vs=venues(S.day);
  return `<div class="trip"><div class="tr from"><span class="pin">${IC.walk}</span><div class="grow"><span class="lab">출발 · 공연장</span><span class="val">${esc(shortV(S.venue))}</span>
    ${vs.length>1?`<div class="vchips">${vs.map(v=>`<button class="chip" data-venue="${esc(v)}" aria-pressed="${v===S.venue}">${esc(shortV(v))}</button>`).join('')}</div>`:''}</div></div>
    <button class="tr to" id="destBtn"><span class="pin">${IC.pin}</span><div class="grow"><span class="lab">도착</span><span class="val ${S.dest?'':'ph'}">${S.dest?esc(S.dest.n)+(S.dest.sub?` <small class="muted small">${esc(S.dest.sub)}</small>`:''):'어디로 가세요?'}</span></div><span class="muted">${IC.chev}</span></button></div>
    ${timeChips()}`}
function trainChips(o){if(!o.next.length)return `<div class="trains"><span class="tn off"><b>운행 끝</b>이 방향 열차가 없어요</span></div>`;
  return `<div class="trains">${o.next.slice(0,3).map(r=>`<span class="tn ${r[2]?'ex':''}" ${o.pick===r?'style="outline:2px solid #2563EB"':''}><b>${hm(r[0])}</b>${esc(M.dests[r[1]])}행${r[2]?'<i>급행</i>':''}</span>`).join('')}</div>`}
function optCard(o){const open=S.sel===o.key,stn=GRP[o.g].n+'역';
  let h=`<div class="opt" aria-expanded="${open}"><button class="hd" data-opt="${o.key}" aria-expanded="${open}">
    <div class="t1">${lb(o.ln)}<span class="nm">${stn}</span>${o.best?'<span class="badge">추천</span>':''}<span class="ml">${lvTag(o.cr)}</span></div>
    <div class="t2"><span>${IC.walk}<b>도보 ${o.w}분</b></span><span>${IC.clock}<b>${hm(o.arr)}</b> 역 도착</span><span>${IC.train}${o.pick&&o.pick[2]&&o.xstops?`급행 ${o.xstops}정거장`:o.stops+'정거장'}</span></div>
    ${trainChips(o)}${o.why&&o.why.length?`<div class="why">${o.why.map(t=>`<span>${t}</span>`).join('')}</div>`:''}</button>`;
  if(open){const dirEnd=END_OF[o.ln][o.dir],left=o.last!=null?o.last-o.arr:null;
    h+=`<div class="body"><ol class="steps">
      <li><span class="si">${IC.walk}</span>${esc(shortV(S.venue))}에서 <b>${stn}</b>까지 걸어서 ${o.w}분<small>${hm(S.dep)} 출발 → ${hm(o.arr)} 도착${D.walk[S.venue]?'':' · 도보 시간은 KSPO DOME 기준 근사'}</small>${kakaoBtn(S.venue,o.g)}</li>
      <li><span class="si">${IC.train}</span><b>${o.ln}호선 ${dirEnd} 방면</b> 승강장${o.pick?`<small>${hm(o.pick[0])} ${esc(M.dests[o.pick[1]])}행${o.pick[2]?' 급행':''} · 승강장까지 ${ACCESS}분 잡고 ${o.wait-ACCESS>0?(o.wait-ACCESS)+'분 기다려요':'바로 타요'}</small>`:'<small>이 시각 뒤로는 이 방향 열차가 없어요</small>'}</li>
      <li><span class="si">${IC.pin}</span><b>${esc(o.target)}역</b>에서 내려요 · ${o.pick&&o.pick[2]&&o.xstops?`급행 ${o.xstops}정거장`:o.stops+'정거장'}${S.dest.id==='hanam'?'<small>강동역에서 하남검단산행으로 갈아타요</small>':''}</li></ol>
      <div class="mini"><div class="row small"><b>${stn} ${o.ln}호선 승차 인원</b><span class="muted ml">${o.cr?'2025년 기록 · '+ratioTxt(o.cr.r):''}</span></div>
      ${bars({vals:S.day.sub?.[o.k]||[],base:SB[o.k],hl:Math.floor(o.arr/60),color:LV[o.cr?o.cr.lv:1].c,band:[startH(S.day),endH(S.day)]})}
      <div class="leg"><span><i style="background:${LV[o.cr?o.cr.lv:1].c}"></i>2025년 이 공연일</span><span><i class="ln"></i>비공연 평일 평균</span></div></div>
      <p class="note">이 방향으로 ${esc(o.target)}까지 가는 마지막 열차 <b>${hm(o.last)}</b>${left!=null?` · 역 도착 뒤 ${left>=0?left+'분 여유':'이미 끊겼어요'}`:''}</p></div>`}
  return h+'</div>'}
function waitCard(){const cand=OPTS.filter(o=>o.pick&&o.cr);if(!cand.length)return '';const b=cand.reduce((a,o)=>o.w<a.w?o:a);
  const h1=Math.floor((b.arr+60)/60),c1=crowd(S.day,b.k,h1),later=b.last!=null&&b.last>=b.arr+60+ACCESS;
  let msg='',sub='';const nm=`${GRP[b.g].n}역 ${b.ln}호선`;
  if(b.cr.lv>=2&&c1&&c1.lv<b.cr.lv&&later){msg=`가장 가까운 ${nm}, 1시간 뒤엔 ${LV[b.cr.lv].t} → ${LV[c1.lv].t.replace('승차 ','')}`;sub=`${h1}시대 승차는 ${ratioTxt(c1.r)} 수준이었어요. 막차 전까지 시간이 넉넉하니 주변에서 쉬었다 가도 돼요.`}
  else if(b.cr.lv>=2){msg=`가장 가까운 ${nm}, 2025년 이 시간엔 ${LV[b.cr.lv].t}`;sub='역 입구가 붐비면 개찰구까지 시간이 더 걸릴 수 있어요. 아래 덜 붐비는 역을 함께 보세요.'}
  else return '';
  const onWay=(ln,st)=>OPTS.some(o=>{if(o.ln!==ln)return false;const od=M.lines[ln].order,a=od.indexOf(SK[o.k].n),t=od.indexOf(o.target),x=od.indexOf(st);return (x-a)*(t-a)>0&&Math.abs(x-a)<=Math.abs(t-a)});
  const ps=M.poi.filter(p=>p.when.includes('after')&&(!p.via||p.via.some(([ln,st])=>onWay(ln,st)))).slice(0,3);
  return `<div class="wait"><span class="wi">${IC.clock}</span><div><b>${msg}</b><p>${sub}</p>${ps.length&&later?`<div class="chips">${ps.map(p=>`<button class="chip" data-gopoi="${p.id}">${esc(p.n)}</button>`).join('')}</div>`:''}</div></div>`}
function stationList(){const d=S.day;const rows=Object.keys(GRP).map(g=>{const w=walkOf(S.venue,g),arr=S.dep+w,c=crowdG(d,g,Math.floor(arr/60));return {g,w,arr,c}}).sort((a,b)=>((a.c?a.c.lv:1)-(b.c?b.c.lv:1))||a.w-b.w);
  return `<div class="sec"><h3>${IC.list}${hm(S.dep)}에 출발하면 · 2025년 이날 역별 승차</h3>${rows.map(r=>`<button class="srow" data-stn="${r.g}"><div class="grow"><div class="sn">${GRP[r.g].n}역 ${GRP[r.g].k.map(k=>lb(SK[k].ln)).join(' ')}</div><div class="sm">도보 ${r.w}분 · ${hm(r.arr)} 도착</div></div>${lvTag(r.c)}</button>`).join('')}</div>`}
function quickDests(){const ids=['jamsil','gangnam','cheonho','yeouido','gwanghwa','garak'];
  return `<div class="sec"><h3>${IC.pin}자주 가는 곳</h3><div class="chips">${ids.map(id=>{const t=M.DEST.find(x=>x.id===id);return `<button class="chip out" data-dest="${id}">${[...new Set(t.via.map(v=>v[0]))].map(lb).join('')} ${esc(t.n)}</button>`}).join('')}</div></div>`}
function vRoute(){computeOptions();let h=`<p class="banner">${IC.clock}<span>2025년 같은 공연일 기록과 열차 시각표로 만든 미리보기예요. 실시간 정보가 아니에요.</span></p>`+tripBox();
  if(!S.day.sub)h+=`<p class="empty">이 공연일은 지하철 승차 기록이 없어요. 다른 공연일을 골라 보세요.</p>`;
  if(!S.dest)return h+quickDests()+stationList()+srcNote();
  h+=`<div class="row" style="margin:4px 2px 10px;gap:6px"><span class="small muted">추천 기준</span><button class="chip" data-pref="calm" aria-pressed="${S.pref==='calm'}">덜 붐비게</button><button class="chip" data-pref="fast" aria-pressed="${S.pref==='fast'}">빨리</button></div>`;
  h+=waitCard();h+=OPTS.length?OPTS.map(optCard).join(''):`<p class="empty">이 목적지로 바로 가는 노선이 주변 역에 없어요.</p>`;
  return h+srcNote()}

/* ---------- 관람객: 주변 ---------- */
const distMin=(a,b)=>Math.round(Math.hypot(a[0]-b[0],a[1]-b[1])*1.45/65);
function vNear(){const vxy=VN[S.venue];const ps=M.poi.filter(p=>p.when.includes(S.poiWhen));
  let h=`<div class="chips" style="margin-bottom:12px"><button class="chip" data-when="before" aria-pressed="${S.poiWhen==='before'}">공연 전</button><button class="chip" data-when="after" aria-pressed="${S.poiWhen==='after'}">공연 끝나고</button></div>`;
  if(S.poiWhen==='after'){const calm=Object.keys(GRP).map(g=>({g,c:crowdG(S.day,g,Math.floor((S.dep+walkOf(S.venue,g))/60)),w:walkOf(S.venue,g)})).filter(x=>x.c&&x.c.lv<=1&&x.g!=='c').sort((a,b)=>a.w-b.w)[0];
    if(calm)h+=`<div class="wait"><span class="wi">${IC.walk}</span><div><b>걸으면서 붐비는 역 피하기</b><p>${esc(shortV(S.venue))}에서 ${GRP[calm.g].n}역까지 ${calm.w}분. 2025년 이날 같은 시간 ${GRP[calm.g].n}역은 <b>${LV[calm.c.lv].t}</b>이었어요. 가는 길에 아래 장소를 지나요.</p>${kakaoBtn(S.venue,calm.g)}</div></div>`}
  h+=`<div class="poilist">${ps.map(p=>{const c=CAT[p.cat],tags=[c.t];if(p.xy&&vxy)tags.push(`공연장에서 걸어서 약 ${distMin(vxy,p.xy)}분`);else if(!p.xy&&!p.via)tags.push('공원 안');
    if(p.via)tags.push(p.via.map(([ln,s])=>`${ln}호선 ${s}역`).join(' · '));if(p.near&&p.near.length)tags.push(p.near.map(g=>GRP[g].n+'역').join('·')+' 가까이');
    return `<button class="pc" data-poi="${p.id}" aria-pressed="${S.poiSel===p.id}"><span class="pi ${p.cat}">${IC[c.ic]}</span><span><b>${esc(p.n)}</b><p>${esc(p.d)}</p><span class="tg">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</span></span></button>`}).join('')}</div>`;
  return h+`<p class="note">장소는 위키백과 등으로 확인한 곳만 담았어요. 운영 시간과 정확한 위치는 방문 전 공식 안내를 확인하세요. 걸리는 시간(약)은 지도 거리로 어림한 값이에요.</p>`}

/* ---------- 관람객: 막차 ---------- */
function vLast(){const d=S.day,dt=dayType(d);let h=`<p class="small muted" style="margin-bottom:10px">${dt} 시각표 · ${hm(S.dep)}에 ${esc(shortV(S.venue))}에서 걸어갈 때 남는 시간</p>`;
  Object.keys(GRP).forEach(g=>{const w=walkOf(S.venue,g),arr=S.dep+w;let rows='';
    GRP[g].k.forEach(k=>{const ln=SK[k].ln;['UP','DOWN'].forEach(dir=>{const t=trainsFrom(k,dt,dir);if(!t.length)return;const last=t[t.length-1],full=t.filter(r=>M.dests[r[1]]===END_OF[ln][dir]),lf=full.length?full[full.length-1]:null;
      const lft=last[0]-arr,cls=lft<0?'bad':lft<30?'warn':'ok';
      rows+=`<div class="lt">${lb(ln)}<span class="t"><b>${hm(last[0])}</b> ${esc(M.dests[last[1]])}행${lf&&lf!==last?`<small>끝까지(${esc(END_OF[ln][dir])}) ${hm(lf[0])}${lf[0]<arr?' · 이미 끊김':''}</small>`:''}</span><span class="left ${cls}">${lft<0?'끊김':lft>=120?Math.floor(lft/60)+'시간 '+(lft%60)+'분':lft+'분'}</span></div>`})});
    h+=`<div class="ltcard"><div class="hd"><b>${GRP[g].n}역</b><span class="muted small">도보 ${w}분</span></div>${rows}</div>`});
  return h+`<p class="note">서울교통공사 열차운행시각표 기준이에요. 늦은 시간에는 짧게 가는 열차(군자행·삼전행 등)가 많아요. 시각표는 바뀔 수 있으니 출발 전 공식 앱에서 확인하세요.</p>`}

/* ---------- 운영자 ---------- */
function opsHour(){if(S.hour==null){S.hour=S.day.sub?peakOf(S.day.sub,S.day).ph:Math.min(23,Math.floor(endH(S.day)))}return S.hour}
function grpVal(d,g,h){if(!d.sub)return null;const ks=GRP[g].k;if(ks.some(k=>d.sub[k]?.[h]==null))return null;return ks.reduce((a,k)=>a+d.sub[k][h],0)}
let SUM=null;const pct=(a,b)=>((1-a/b)*100).toFixed(1)+'%';
function vSum(){SUM=SUM||summary();const s=SUM;
  return `<div class="ident"><b>운영 의사결정 시뮬레이터</b><p>과거 공연·주차·지하철 공공데이터를 결합해, 공연이 끝난 뒤 혼잡을 줄일 운영 대안(종료 시각 조정·대체 역 안내)을 미리 비교하는 도구예요. 실시간 혼잡·안전·대기시간 예측 서비스가 아니에요.</p><button class="hbtn" data-help>${IC.help}사용법 보기</button></div>
  <div class="sec"><h3>${IC.chart}관측 결과 · 2025년 기록</h3><div class="tiles">
    <div class="tile"><b>${s.days}일</b><small>분석 공연일(공연 항목 ${s.shows}건)</small></div>
    <div class="tile hot"><b>${fmt(s.peak)}명</b><small>올림픽공원역(5·9호선) 평균 피크 1시간 승차</small></div>
    <div class="tile hot"><b>${s.ratio.toFixed(1)}배</b><small>비공연 평일 같은 시간 평균 대비(평균의 비)</small></div>
    <div class="tile"><b>${pct(s.g60.v,s.g0.v)}</b><small>종료 예정 간격 60분 이상 ${s.g60.n}일과 0분 ${s.g0.n}일의 역 피크 차이(관측 차이, 인과효과 아님)</small></div></div>
    <p class="note" style="margin-top:2px">관람객 규모·요일·추정 종료 시간대·공연장 구성·공연 수를 함께 넣은 회귀(관람객 수가 있는 77일)에서도 역 피크는 약 20%(95% 신뢰구간 10~30%) 낮게 나타났어요. 관측 연관이며 인과효과는 아니에요(결과: regress_v3.py).</p></div>
  <div class="sec"><h3>${IC.sliders}시나리오 결과 · 가정 기반 계산</h3><div class="card bars" style="padding:8px 14px">
    ${[30,60,90].map(m=>`<div class="br"><span><b>종료 ${m}분 조정</b></span><span class="track"><span class="fill" style="width:${(1-s.shift[m].after/s.shift[m].before)/.3*100}%;background:#12A150"></span></span><span class="v">${pct(s.shift[m].after,s.shift[m].before)}<small>${s.shift[m].n}일 평균</small></span></div>`).join('')}
    ${[10,20,30].map(p=>`<div class="br"><span><b>대체 역 ${p}%</b></span><span class="track"><span class="fill" style="width:${(1-s.alt[p].after/s.base)/.3*100}%;background:#2563EB"></span></span><span class="v">${pct(s.alt[p].after,s.base)}<small>${s.days}일 평균</small></span></div>`).join('')}</div>
    <p class="note" style="margin-top:6px">종료 시각 조정은 종료 예정 간격 0분인 두 공연일 중 자정 전에 계산이 끝나는 날만 써요. 30·60분과 90분은 표본이 달라 바로 비교하면 안 돼요. 두 시나리오는 따로 계산했으니 감소율을 더하지 마세요.</p></div>
  <details class="src" open><summary>분석 기준과 한계</summary><p>피크: 마지막 추정 종료 시각이 속한 시간대 ±2시간 안의 최대 1시간 · 승차: 5호선 승차 + 9호선 순승차(환승 제외) · 종료 시각: 시작 시각 + 공연 유형별 러닝타임 가정(콘서트 150분, 팬미팅 120분, 쇼케이스 90분) · 비교 기준: 비공연 월~목 시간대별 평균(주말 효과는 통제 못 함) · 평일 평균 최고치는 역 수용능력이 아님 · 주차 순감소 = 연속 시각 주차 차량 수의 차이(실제 출차 대수 아님) · 공연 기준표 293건(151일) 중 종료 시각을 정할 수 없는 페스티벌 단독일 7일을 빼고 144일·286건을 분석.</p></details>
  <p class="note">위쪽에서 공연을 고르면 '공연일'·'역별'·'주차'에서 그날 기록을, '시뮬레이터'에서 그날 가정 계산을 볼 수 있어요. 관람객에게 보여 줄 안내 화면은 위쪽 '관객 안내'에서 미리 볼 수 있어요.</p>`}
function vOver(){const d=S.day;if(!d.sub)return `<p class="empty">이 공연일은 지하철 기록이 없어요.</p>`;const {ph,mx}=peakOf(d.sub,d),pk=parkPeak(d),hr=opsHour(),[a,b]=winOf(d);
  return `<div class="tiles"><div class="tile hot"><b>${hh(ph)}</b><small>추정 종료 ±2시간 중 올림픽공원역 승차가 가장 많은 1시간</small></div><div class="tile hot"><b>${fmt(mx)}명</b><small>그때 승차 · ${ratioTxt(mx/UMAX.c)}</small></div>
    <div class="tile"><b>${pk?hh(pk.ph):'기록 없음'}</b><small>같은 구간 주차 순감소가 가장 큰 1시간${pk?` (${fmt(pk.mx)}대)`:''}</small></div><div class="tile"><b>${fmt(d.aud)}명</b><small>공연 관람객(연계 데이터)</small></div></div>
  <div class="card"><h4>올림픽공원역 시간대 승차 (5·9호선)</h4><p class="cap">진한 색 5호선 승차, 옅은 색 9호선 순승차 · 점선은 비공연 평일 평균 · 주황 띠는 추정 공연 시간</p>${bars({vals:d.sub.o,stack:d.sub.p,base:SBC,H0:12,H1:23,hl:hr,color:'#E5383B',band:[startH(d),endH(d)],h:150})}
  <div class="ctl"><div class="lab"><span>지도에 보여 줄 시간</span><output>${hh(hr)}</output></div><input type="range" id="hourIn" min="12" max="23" step="1" value="${hr}" aria-label="지도 시간"></div>
  <button class="play" id="playBtn">${S.playing?IC.pause+'멈춤':IC.play+'시간 흐름 재생'}</button></div>
  <button class="pbtn" id="printDay">${IC.print}이 공연일 운영 검토표 인쇄 · PDF 저장</button>
  <p class="note">피크는 ${a}시~${b+1}시(추정 종료 ${d.end} ±2시간)에서 찾았어요. 지도의 원 크기는 그 시간 승차 인원, 색은 각 역의 평일 평균 최고치와 비교한 정도예요(수용능력 아님).</p>`}
function vStn(){const d=S.day;if(!d.sub)return `<p class="empty">이 공연일은 지하철 기록이 없어요.</p>`;const hr=opsHour();
  const rows=Object.keys(GRP).map(g=>{const v=grpVal(d,g,hr),u=UMAX[g],r=v!=null?v/u:null,lv=r==null?null:r<.6?0:r<1?1:r<1.6?2:3;
    return `<div class="br"><span><b>${GRP[g].n}</b><br>${GRP[g].k.map(k=>lb(SK[k].ln)).join(' ')}</span><span class="track"><span class="fill" style="width:${Math.min(100,(v||0)/Math.max(v||0,u*1.25)*100)}%;background:${lv==null?'#ccc':LV[lv].c}"></span><span class="mark" style="left:${Math.min(100,u/Math.max(v||0,u*1.25)*100)}%"></span></span><span class="v">${fmt(v)}명<small>${r==null?'':r>=1?r.toFixed(1)+'배':Math.round(r*100)+'%'}</small></span></div>`}).join('');
  return `<div class="ctl"><div class="lab"><span>시간</span><output>${hh(hr)}</output></div><input type="range" id="hourIn" min="12" max="23" step="1" value="${hr}"></div>
  <div class="card bars"><h4>역별 승차 · 평일 평균 최고치와 비교</h4><p class="cap">세로 막대는 각 역의 평일 평균 최고치(비공연 월~목 평균 중 가장 많은 1시간). 역 수용능력이 아니에요.</p>${rows}</div>
  <p class="note">2025년 144일 모두, 올림픽공원역 피크 시간에 주변 4개 역(공연장에서 걸어서 15~29분) 승차는 각 역의 평일 평균 최고치 이내였어요. 9호선은 환승을 뺀 순승차예요.</p>`}
function vPark(){const d=S.day;const pk=parkPeak(d);if(!d.hrs.some(v=>v!=null))return `<p class="empty">이 공연일은 연계 데이터에 주차 기록이 없어요.</p>`;const o=outflow(d.hrs);
  return `<div class="tiles"><div class="tile hot"><b>${pk?hh(pk.ph):'기록 없음'}</b><small>추정 종료 ±2시간 중 주차 순감소가 가장 큰 1시간</small></div><div class="tile"><b>${pk?fmt(pk.mx)+'대':'–'}</b><small>그 1시간 순감소(출차 − 입차)</small></div></div>
  <div class="card"><h4>시간대별 주차 차량</h4><p class="cap">그 시각 주차장에 있던 차량 · 점선은 비공연 평일 평균</p>${bars({vals:d.hrs,base:D.base,H0:10,H1:23,hl:pk?.ph,color:'#2563EB',band:[startH(d),endH(d)],h:150})}</div>
  <div class="card"><h4>1시간 주차 순감소</h4><p class="cap">다음 1시간 사이 줄어든 차량 수 = 출차 − 입차. 실제 출차 대수가 아니에요</p>${bars({vals:o.map((v,h)=>h>=10&&v!=null?Math.max(0,v):null),H0:10,H1:22,hl:pk?.ph,color:'#F06A00',h:140})}</div>
  <div class="card"><h4>주차 구역 참고 (팀 분석)</h4><p class="cap" style="font-size:12.5px;color:#475467;line-height:1.55">1번 팀원이 주차장 혼잡도 정보(2025년 공연·행사일 71일)로 본 결과, P6·P5·P4가 오후 1시경 가장 먼저·자주 만차였고(28~33일) P10·P1A는 12~17일이었어요. 구역 원자료는 재검증 후 쓰고, 주차 분산 효과는 수치로 예측하지 않아요.</p></div>`}
function vSim(){const d=S.day,Sx=d.sub;if(!Sx)return `<p class="empty">이 공연일은 지하철 기록이 없어요.</p>`;const C=combOf(Sx),st=stagger(C,SBC,d,S.shift),{ph,mx}=peakOf(Sx,d),a=altScenario(Sx,d,S.alt);let h='';
  h+=`<p class="small muted" style="margin:0 2px 10px">2025년 기록에 가정을 얹은 계산이에요. 두 시나리오는 따로 계산하니 감소율을 더하지 마세요.</p>`;
  h+=`<div class="card"><h4>종료 시각 조정</h4><p class="cap">종료 예정 간격 0분인 두 공연 중 좌석이 적은 공연의 몫(좌석 비율)을 늦춰요. 인원은 옮길 뿐 사라지지 않아요.</p>`;
  if(!st)h+=`<p class="empty" style="padding:14px 4px">이날은 계산 대상이 아니에요. 종료 예정 간격 0분인 공연 2개가 있는 날(2025년 23일)만 계산해요. 공연 목록에서 '동시 종료 예정'을 눌러 보세요.</p></div>`;
  else{h+=`<div class="ctl"><div class="lab"><span>작은 공연 종료를 늦추는 시간</span><output>${S.shift}분</output></div><input type="range" id="shIn" min="0" max="120" step="15" value="${S.shift}"></div>
    <div class="tiles"><div class="tile"><b>${fmt(st.before)}명</b><small>비교 구간(${st.lo}~${st.hi+1}시) 관측 피크</small></div><div class="tile ${st.overflow>0?'':'good'}"><b>${st.overflow>0?'판정 보류':pct(st.after,st.before)}</b><small>${st.overflow>0?`${fmt(st.overflow)}명이 자정 이후로 넘어가 계산 범위 밖`:`조정 뒤 계산 피크 ${fmt(st.after)}명`}</small></div></div>
    ${barsCompare(C,st.nw,Math.max(12,st.lo-1))}<div class="leg"><span><i style="background:#F3B3B4"></i>관측</span><span><i style="background:#12A150"></i>조정 가정(계산)</span><span class="muted">작은 공연 몫 ${(st.w*100).toFixed(1)}%(좌석 가정)</span></div></div>`}
  h+=`<div class="card"><h4>대체 역 분산</h4><p class="cap">원래 피크 시간(${hh(ph)})의 평일 대비 초과 승차 중 일부를 주변 4개 역에 '평일 평균 최고치까지의 여유'만큼 나눠요. 여유를 넘는 몫은 옮기지 않아요(미배분)</p>
  <div class="ctl"><div class="lab"><span>다른 역으로 옮기는 비율(가정)</span><output>${S.alt}%</output></div><input type="range" id="alIn" min="0" max="50" step="5" value="${S.alt}"></div>
  <div class="tiles"><div class="tile"><b>${fmt(mx)}→${fmt(a.peak)}</b><small>비교 구간 피크(다른 시간대까지 다시 확인)</small></div><div class="tile good"><b>${pct(a.peak,mx)}</b><small>피크 감소 · 옮긴 인원 ${fmt(a.moved)}명${a.unallocated>.5?` · 미배분 ${fmt(a.unallocated)}명`:''}</small></div></div>
  <div class="bars">${NB.map(([k,n,ln],i)=>{const sc=Math.max(a.after[i],UMAX[k])*1.15;return `<div class="br"><span><b>${n.replace('역','')}</b> ${lb(ln)}</span><span class="track"><span class="fill" style="width:${a.after[i]/sc*100}%;background:#2563EB"></span><span class="mark" style="left:${UMAX[k]/sc*100}%"></span></span><span class="v">${fmt(Sx[k][ph])}→${fmt(a.after[i])}<small>참고 상한 ${fmt(UMAX[k])}</small></span></div>`}).join('')}</div></div>
  <p class="note">참고 상한(평일 평균 최고치)은 역 수용능력이 아니에요. 걸어가는 시차·목적지·환승·막차는 반영하지 않았어요. 실제 대기시간 단축이나 안전을 보장하는 결과가 아니에요. 주차는 입·출차가 분리된 자료가 없어 수치로 예측하지 않아요.</p>`;return h}
function barsCompare(a,b,H0){const H1=23,W=340,h=150,top=14,ch=h-34,left=4,pw=W-8,n=H1-H0+1,bw=pw/n;const ymax=Math.max(1,...a.slice(H0,H1+1).filter(v=>v!=null),...b.slice(H0,H1+1).filter(v=>v!=null))*1.12,y=v=>top+ch-v/ymax*ch;
  let s=`<svg viewBox="0 0 ${W} ${h}" style="width:100%;height:auto;display:block;margin-top:8px">`;
  for(let i=H0;i<=H1;i++){const x=left+(i-H0)*bw;if(a[i]!=null)s+=`<rect x="${x+bw*.12}" y="${y(a[i])}" width="${bw*.38}" height="${top+ch-y(a[i])}" rx="3" fill="#F3B3B4"/>`;if(b[i]!=null)s+=`<rect x="${x+bw*.5}" y="${y(b[i])}" width="${bw*.38}" height="${top+ch-y(b[i])}" rx="3" fill="#12A150"/>`;
    if((i-H0)%2===0)s+=`<text x="${x+bw/2}" y="${h-6}" text-anchor="middle" font-size="10.5" fill="#8B95A7">${i}시</text>`}return s+'</svg>'}

/* ---------- 운영자: 새 공연 일정 미리보기(유사 사례) ---------- */
let LOO=null;
function planQuery(){const p=S.plan,sh=p.shows.filter(s=>s.on);if(!sh.length)return null;
  const ends=sh.map(s=>{const [h,m]=s.s.split(':').map(Number);return h*60+m+RUNTIME[s.t]}).sort((a,b)=>a-b),last=ends[ends.length-1],gap=ends.length>1?last-ends[ends.length-2]:null;
  const wd='일월화수목금토'[new Date(p.date+'T00:00:00').getDay()],vs=new Set(sh.map(s=>s.v));
  return {q:{vs,kspo:vs.has('KSPO DOME'),eh:Math.min(23,Math.floor(last/60)),g:gapCat(sh.length,gap),wd:wdGroup(wd),aud:+p.aud>0?+p.aud:null},last,gap,wd,n:sh.length,sh}}
function vPlan(){const P=S.plan,pq=planQuery();LOO=LOO||{a:looCheck(false),b:looCheck(true)};const f1=x=>(x*100).toFixed(1)+'%';
  let h=`<p class="banner">${IC.clock}2025년 비슷한 공연일 기록으로 보는 참고 범위예요. 예측 모델이나 실시간 정보가 아니에요.</p>
  <div class="card"><h4>새 공연 일정</h4><p class="cap">공연장·시작 시각·유형을 고르면 러닝타임 가정으로 추정 종료 시각을 계산해 비슷한 날을 찾아요</p>
  <div class="fld"><span>날짜</span><input type="date" id="planDate" value="${P.date}"></div>
  ${P.shows.map((s,i)=>`<div class="prow"><button class="chip" data-pv="${i}" aria-pressed="${s.on}">${esc(s.v==='티켓링크 라이브 아레나(핸드볼경기장)'?'티켓링크':shortV(s.v))}</button><input type="time" data-ps="${i}" value="${s.s}" min="10:00" max="21:30" step="900" aria-label="${esc(shortV(s.v))} 시작 시각" ${s.on?'':'disabled'}><select data-pt="${i}" aria-label="${esc(shortV(s.v))} 공연 유형" ${s.on?'':'disabled'}>${Object.keys(RUNTIME).map(t=>`<option ${t===s.t?'selected':''}>${t}</option>`).join('')}</select></div>`).join('')}
  <div class="fld"><span>예상 관객 수 <small class="muted">(선택, 판매 현황 등)</small></span><input type="number" id="planAud" min="0" step="500" value="${P.aud}" placeholder="예: 15000"></div></div>`;
  if(!pq)return h+`<p class="empty">공연장을 하나 이상 골라 주세요.</p>`;
  const r=similarCases(pq.q,7),q=pq.q;SIMQ=r;
  h+=`<div class="tiles"><div class="tile"><b>${hm(pq.last)}</b><small>추정 종료(마지막 공연)${pq.n>1?` · 종료 간격 ${pq.gap}분`:''}</small></div>
    <div class="tile hot"><b>${hh(r.ph)}</b><small>올림픽공원역 승차가 가장 많을 것으로 보이는 시간(비슷한 날 기준)</small></div>
    <div class="tile hot"><b>${fmt(r.med)}명</b><small>피크 1시간 승차 참고값(비슷한 7일 중앙값) · 범위 ${fmt(r.lo)}~${fmt(r.hi)}명</small></div>
    <div class="tile"><b>${r.park?fmt(r.park.med)+'대':'–'}</b><small>주차 순감소 피크 참고값(비슷한 날 중 주차 기록이 있는 ${r.park?r.park.n:0}일 중앙값)</small></div></div>`;
  const items=[];
  if(pq.n>=2&&pq.gap===0){const el=r.cases.find(c=>stagger(combOf(c.d.sub),SBC,c.d,0));
    items.push(`<li><b>두 공연의 추정 종료가 같아요.</b> 2025년 종료 간격 0분인 날의 역 피크 평균은 6,302명, 60분 이상인 날은 5,207명이었어요(관측 차이 17.4%, 인과 아님). 대관 협의 때 종료 간격을 함께 검토해 보세요.${el?` <button class="linkbtn" data-goday="${el.d.id}" data-gotab="sim">비슷한 날(${el.d.date.slice(5).replace('-','.')}) 시뮬레이터 열기</button>`:''}</li>`)}
  items.push(`<li><b>${hh(r.ph)} 전후 올림픽공원역 안내 검토.</b> 2025년 피크 승차의 약 73%가 9호선이었어요.</li>`);
  items.push(`<li><b>주차 출구 안내를 역 안내보다 먼저 검토.</b> 2025년 124일 중 92일은 지하철 피크가 주차 순감소 피크보다 늦었어요.</li>`);
  items.push(`<li><b>대체 역 안내 문구 준비.</b> 주변 4개 역(걸어서 15~29분)은 2025년 모든 공연일에 피크 시간 승차가 평일 평균 최고치 이내였어요(수용능력 아님).</li>`);
  h+=`<div class="card"><h4>운영 검토 항목</h4><ul class="chk">${items.join('')}</ul></div>`;
  h+=`<div class="card"><h4>비슷한 2025년 공연일 7일</h4><p class="cap">공연장 구성·추정 종료 시간대·종료 간격·요일${q.aud?'·관객 수':''}가 가까운 순서 · 누르면 그날 기록을 열어요</p>
    ${r.cases.map(c=>`<button class="srow" data-goday="${c.d.id}" data-gotab="over"><div class="grow"><div class="sn">${c.d.date.slice(2).replace(/-/g,'.')} (${c.d.wd}) · 추정 종료 ${c.d.end}</div><div class="sm">${esc(venues(c.d).map(shortV).join(' · '))}${c.d.n>1?` · 간격 ${c.d.gap??'–'}분`:''}</div></div><span class="v2"><b>${fmt(c.pk)}명</b><small>${hh(c.ph)}</small></span></button>`).join('')}</div>`;
  h+=`<details class="src" open><summary>이 참고 범위는 얼마나 맞았나요?</summary><p>2025년 ${LOO.a.n}일을 한 날씩 빼고 나머지로 맞혀 봤어요. 실제 피크가 참고 범위(최소~최대) 안에 든 날 ${f1(LOO.a.cov)}, 중앙값과의 오차는 중앙값 기준 ${f1(LOO.a.medErr)}(30% 이내 ${f1(LOO.a.w30)}), 피크 시간대는 ±1시간 안 ${f1(LOO.a.h1)}였어요. 예상 관객 수를 넣으면 범위 안 ${f1(LOO.b.cov)}, 오차 ${f1(LOO.b.medErr)}예요. 작은 공연이나 녹화 행사처럼 관객이 적은 날은 오차가 커요.</p></details>
  <button class="pbtn" id="printPlan">${IC.print}검토표 인쇄 · PDF 저장</button>`;
  return h}
let SIMQ=null;

/* ---------- 운영 검토표(인쇄) ---------- */
function printHTML(title,body){const el=$('#print');el.innerHTML=`<div class="rp"><div class="rph"><b>커튼콜 이후 · 운영 검토표 <small>팀 크라우드제로</small></b><span>${esc(title)}</span></div>${body}
  <p class="rpn">2025년 과거 공공데이터(한국체육산업개발 연계·공연·대관정보, 서울교통공사 승하차·열차운행시각표)로 만든 참고 자료예요. 추정 종료 = 시작 시각 + 공연 유형별 러닝타임 가정. 관측 차이와 시나리오는 인과효과나 실제 대기시간·안전 개선을 보장하지 않으며, 평일 평균 최고치는 역 수용능력이 아니에요. 출력: ${new Date().toLocaleDateString('ko-KR')}</p></div>`;
  setTimeout(()=>window.print(),50)}
const rtab=rows=>`<table class="rtb">${rows.map((r,i)=>`<tr>${r.map(c=>i?`<td>${c}</td>`:`<th>${c}</th>`).join('')}</tr>`).join('')}</table>`;
function printDay(){const d=S.day,Sx=d.sub,{ph,mx,C}=peakOf(Sx,d),pk=parkPeak(d),st=stagger(C,SBC,d,S.shift),a=altScenario(Sx,d,S.alt);
  let b=`<h3>공연</h3>${rtab([['공연장','공연명','시작','구분'],...d.shows.map(s=>[esc(shortV(s.v)),esc(s.t),s.s||'–',esc(s.k)])])}<p>마지막 추정 종료 ${d.end}${d.n>1?` · 종료 예정 간격 ${d.gap??'–'}분`:''} · 연계 관람객 ${fmt(d.aud)}명</p>`;
  b+=`<h3>2025년 기록(관측)</h3>${rtab([['항목','값'],['올림픽공원역 피크 1시간',`${hh(ph)} · ${fmt(mx)}명 (5호선 ${fmt(Sx.o[ph])} + 9호선 ${fmt(Sx.p[ph])})`],['비공연 평일 같은 시간 대비',`${(mx/SBC[ph]).toFixed(1)}배`],['평일 평균 최고치 대비',`${(mx/UMAX.c).toFixed(1)}배`],['주차 순감소 피크',pk?`${hh(pk.ph)} · ${fmt(pk.mx)}대`:'기록 없음']])}`;
  b+=`<h3>${hh(ph)} 역별 승차</h3>${rtab([['역','승차','평일 평균 최고치','비율'],...Object.keys(GRP).map(g=>{const v=grpVal(d,g,ph);return [GRP[g].n+'역',fmt(v),fmt(UMAX[g]),v==null?'–':(v/UMAX[g]*100).toFixed(0)+'%']})])}`;
  b+=`<h3>시나리오(가정 기반 계산)</h3>${rtab([['시나리오','결과'],['종료 시각 조정 '+S.shift+'분',st?(st.overflow>0?'판정 보류(자정 이후 범위 밖)':`비교 구간 피크 ${fmt(st.before)} → ${fmt(st.after)}명 (${pct(st.after,st.before)} 감소)`):'계산 대상 아님(종료 간격 0분인 두 공연일만)'],['대체 역 분산 '+S.alt+'%',`비교 구간 피크 ${fmt(mx)} → ${fmt(a.peak)}명 (${pct(a.peak,mx)} 감소), 옮긴 인원 ${fmt(a.moved)}명${a.unallocated>.5?`, 미배분 ${fmt(a.unallocated)}명`:''}`]])}`;
  b+=`<h3>검토 항목</h3><ul><li>${pk?`주차 순감소 피크(${hh(pk.ph)})${pk.ph<ph?'가 지하철 피크보다 먼저 와요':pk.ph===ph?'와 지하철 피크가 같은 시간대예요':'가 지하철 피크보다 늦어요'}. 주차 출구 안내와 역 안내 시점을 따로 검토해요.`:'주차 기록이 없어 지하철 기록만 참고해요.'}</li><li>${hh(ph)} 전후 올림픽공원역(9호선 ${Math.round(Sx.p[ph]/mx*100)}%) 안내 동선을 검토해요.</li><li>주변 4개 역 안내 문구(도보 15~29분)와 가는 길의 안내 인력·조명을 함께 준비해요.</li></ul>`;
  printHTML(`${d.date} (${d.wd}) · ${title(d)}`,b)}
function printPlan(){const pq=planQuery();if(!pq||!SIMQ)return;const r=SIMQ;
  let b=`<h3>새 공연 일정</h3>${rtab([['공연장','시작','유형 가정','추정 종료'],...pq.sh.map(s=>{const [h,m]=s.s.split(':').map(Number);return [esc(shortV(s.v)),s.s,s.t,hm(h*60+m+RUNTIME[s.t])]})])}<p>${S.plan.date} (${pq.wd}) · 마지막 추정 종료 ${hm(pq.last)}${pq.n>1?` · 종료 간격 ${pq.gap}분`:''}${S.plan.aud?` · 예상 관객 ${fmt(+S.plan.aud)}명`:''}</p>`;
  b+=`<h3>비슷한 2025년 공연일 기준 참고 범위</h3>${rtab([['항목','값'],['올림픽공원역 피크 예상 시간',hh(r.ph)],['피크 1시간 승차',`${fmt(r.med)}명 (범위 ${fmt(r.lo)}~${fmt(r.hi)}명)`],['주차 순감소 피크',r.park?`${fmt(r.park.med)}대 (비슷한 날 ${r.park.n}일 중앙값)`:'–']])}`;
  b+=`<h3>비슷한 공연일</h3>${rtab([['날짜','공연장','추정 종료','피크'],...r.cases.map(c=>[`${c.d.date} (${c.d.wd})`,esc(venues(c.d).map(shortV).join(' · ')),c.d.end,`${hh(c.ph)} ${fmt(c.pk)}명`])])}`;
  b+=`<p>정확도(2025년 ${LOO.a.n}일 한 날씩 빼고 시험): 실제 피크가 범위 안 ${(LOO.a.cov*100).toFixed(1)}%, 중앙값 오차 ${(LOO.a.medErr*100).toFixed(1)}%, 피크 시간대 ±1시간 ${(LOO.a.h1*100).toFixed(1)}%.</p>`;
  printHTML(`새 일정 미리보기 · ${S.plan.date}`,b)}

function srcNote(){return `<details class="src"><summary>데이터 출처</summary><p>승차: 서울교통공사 역별 일별 시간대별 승하차인원(1~8호선)·9호선 2·3단계(환승 제외 순승차), 2025년 · 혼잡 정도: 각 역이 평소 가장 붐비는 1시간(공연 없는 평일 평균)과 비교 · 열차: 서울교통공사 열차운행시각표 · 도보 시간: 카카오맵 도보 길찾기(큰길 우선) · 공연: 한국체육산업개발 올림픽공원 공연·대관정보, 종료 시각은 공연 유형별 러닝타임 가정 · 지도는 약도예요(역·공연장 좌표는 위키백과, 올림픽홀은 도보 거리로 추정).</p></details>`}

/* ---------- 지도 동적 레이어 ---------- */
function drawDyn(){const sc=px(),d=S.day;let s=lineTags(sc);const vxy=VN[S.venue];
  if(S.mode==='aud'){const tab=S.tab.aud;
    let groups=Object.keys(GRP),selG=null;
    if(tab==='route'&&S.dest){groups=[...new Set(OPTS.map(o=>o.g))];const so=OPTS.find(o=>o.key===S.sel);selG=so?.g}
    if(tab==='route'&&!S.dest&&S.stnSel)selG=S.stnSel;
    if(vxy&&tab!=='near'){groups.forEach(g=>{if(g===selG)return;const c=curve(vxy,ST[g]);s+=`<path d="${c.d}" fill="none" stroke="#98A2B3" stroke-width="${3*sc}" stroke-dasharray="${2*sc} ${7*sc}" stroke-linecap="round" opacity=".8"/>`});
      if(selG){const c=curve(vxy,ST[selG]);s+=`<path d="${c.d}" fill="none" stroke="#fff" stroke-width="${10*sc}" stroke-linecap="round"/><path d="${c.d}" fill="none" stroke="#2563EB" stroke-width="${6*sc}" stroke-linecap="round" stroke-dasharray="${.1*sc} ${10*sc}"/>`;
        s+=pill(c.m[0],c.m[1],`${walkOf(S.venue,selG)}분`,sc,{icon:'walk',bg:'#2563EB',fg:'#fff'})}}
    if(tab==='near'&&vxy){const p=M.poi.find(x=>x.id===S.poiSel&&x.xy);if(p){const c=curve(vxy,p.xy,.12);s+=`<path d="${c.d}" fill="none" stroke="#2563EB" stroke-width="${5*sc}" stroke-linecap="round" stroke-dasharray="${.1*sc} ${9*sc}"/>`+pill(c.m[0],c.m[1],`약 ${distMin(vxy,p.xy)}분`,sc,{icon:'walk',bg:'#2563EB',fg:'#fff'})}}
    Object.keys(GRP).forEach(g=>{const on=groups.includes(g);const arr=S.dep+walkOf(S.venue,g),c=crowdG(d,g,Math.floor(arr/60));s+=stnMarker(g,c,sc,{dim:!on,sel:g===selG})});
    if(tab==='near')M.poi.filter(p=>p.xy).forEach(p=>{const sel=p.id===S.poiSel,r=(sel?17:13)*sc,col={walk:'#16834A',see:'#6D4FD8',out:'#1C6FD1',food:'#D9620B'}[p.cat];
      s+=`<g class="poi" data-poi="${p.id}"><circle cx="${p.xy[0]}" cy="${p.xy[1]}" r="${r}" fill="${col}" stroke="#fff" stroke-width="${3*sc}" filter="url(#shd)"/><g transform="translate(${p.xy[0]-r*.62} ${p.xy[1]-r*.62}) scale(${r*1.24/24})" color="#fff">${IC[CAT[p.cat].ic].replace('<svg','<svg width="24" height="24"')}</g>${sel||sc<3.2?`<text x="${p.xy[0]}" y="${p.xy[1]+r+15*sc}" text-anchor="middle" font-size="${12*sc}" font-weight="700" fill="#101828" stroke="#fff" stroke-width="${4*sc}" paint-order="stroke">${esc(p.n)}</text>`:''}</g>`});
    s+=venueLabels(sc,[S.venue]);venuePins(sc,[S.venue]).forEach(x=>s+=x)}
  else if(S.tab.ops==='plan'){Object.keys(GRP).forEach(g=>{s+=stnMarker(g,null,sc,{dim:false,sel:false})});const vs=S.plan.shows.filter(x=>x.on).map(x=>x.v);s+=venueLabels(sc,vs);venuePins(sc,vs).forEach(x=>s+=x)}
  else{const hr=opsHour();Object.keys(GRP).forEach(g=>{const v=grpVal(d,g,hr),u=UMAX[g],r=v!=null?v/u:null,lv=r==null?null:r<.6?0:r<1?1:r<1.6?2:3,[x,y]=ST[g],R=(10+Math.sqrt(v||0)*.5)*sc;
      s+=`<g class="stn" data-stn="${g}"><circle cx="${x}" cy="${y}" r="${R}" fill="${lv==null?'#98A2B3':LV[lv].c}" fill-opacity=".28" stroke="${lv==null?'#98A2B3':LV[lv].c}" stroke-width="${2.5*sc}"/><circle cx="${x}" cy="${y}" r="${6*sc}" fill="${lv==null?'#98A2B3':LV[lv].c}" stroke="#fff" stroke-width="${2*sc}"/>`;
      const rt=r!=null?(r>=1?r.toFixed(1)+'배':Math.round(r*100)+'%'):'',t=innerWidth<600?`${GRP[g].n} ${rt}`:`${GRP[g].n} ${fmt(v)}명${rt?' · '+rt:''}`,fs=11.5*sc,w=t.length*fs*.86+fs*1.6,pos=LBL[g],off=R+8*sc;
      const cx=pos==='r'?x+off+w/2:pos==='l'?x-off-w/2:x,cy=pos==='t'?y-off-fs:pos==='b'?y+off+fs:y;s+=pill(cx,cy,t,sc,{fs:11.5})+`</g>`});
    venues(d).filter(v=>VN[v]).forEach(v=>{const [x,y]=VN[v];s+=`<circle cx="${x}" cy="${y}" r="${7*sc}" fill="#101828" stroke="#fff" stroke-width="${2.5*sc}"/>`+(innerWidth>=600||sc<2.2?`<text x="${x}" y="${y-12*sc}" text-anchor="middle" font-size="${11.5*sc}" font-weight="800" fill="#101828" stroke="#fff" stroke-width="${4*sc}" paint-order="stroke">${esc(shortV(v))}</text>`:'')})}
  elDyn.innerHTML=s}
function stnMarker(g,c,sc,o){const [x,y]=ST[g],col=c?LV[c.lv].c:'#98A2B3',r=(o.sel?13:10)*sc,lns=GRP[g].k.map(k=>SK[k].ln);
  const name=GRP[g].n,fs=12.5*sc,lw=(name.length*fs*.98)+(lns.length*16*sc)+fs*1.8,lh=fs*2.1,pos=LBL[g];
  let lx=x+r+8*sc,ly=y-lh/2;if(pos==='l')lx=x-r-8*sc-lw;if(pos==='b'){lx=x-lw/2+40*sc;ly=y+r+6*sc}if(pos==='t'){lx=x-lw/2;ly=y-r-6*sc-lh}
  let s=`<g class="stn" data-stn="${g}" opacity="${o.dim?.45:1}"><circle cx="${x}" cy="${y}" r="${r+5*sc}" fill="${col}" opacity=".22"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${col}" stroke-width="${(o.sel?5:4)*sc}"/>${o.sel?`<circle cx="${x}" cy="${y}" r="${r*.45}" fill="${col}"/>`:''}`;
  s+=`<g transform="translate(${lx} ${ly})"><rect width="${lw}" height="${lh}" rx="${lh/2}" fill="#fff" filter="url(#shd)" ${o.sel?`stroke="#2563EB" stroke-width="${2*sc}"`:''}/>`;
  lns.forEach((ln,i)=>{s+=`<circle cx="${fs*.95+i*16*sc}" cy="${lh/2}" r="${7*sc}" fill="${M.lines[ln].color}"/><text x="${fs*.95+i*16*sc}" y="${lh/2+3.6*sc}" text-anchor="middle" font-size="${9.5*sc}" font-weight="800" fill="#fff">${ln}</text>`});
  s+=`<text x="${fs*.95+lns.length*16*sc+2*sc}" y="${lh/2+fs*.36}" font-size="${fs}" font-weight="800" fill="#101828">${name}</text></g></g>`;return s}
function venueLabels(sc,skip){if(sc>2.6)return '';return Object.keys(VN).filter(v=>!skip.includes(v)).map(v=>`<text x="${VN[v][0]}" y="${VN[v][1]+4*sc}" text-anchor="middle" font-size="${11*sc}" font-weight="600" fill="#5E7352">${esc(shortV(v))}</text>`).join('')}
function venuePins(sc,vs){return vs.filter(v=>VN[v]).map(v=>{const [x,y]=VN[v],r=15*sc;
  return `<g data-v="${esc(v)}"><path d="M${x} ${y} l${-r*.75} ${-r*1.3} a${r} ${r} 0 1 1 ${r*1.5} 0 z" fill="#101828" stroke="#fff" stroke-width="${2.5*sc}" filter="url(#shd)"/><circle cx="${x}" cy="${y-r*1.95}" r="${r*.42}" fill="#fff"/>
  <text x="${x}" y="${y+16*sc}" text-anchor="middle" font-size="${12.5*sc}" font-weight="800" fill="#101828" stroke="#fff" stroke-width="${4*sc}" paint-order="stroke">${esc(shortV(v))}</text></g>`})}

/* ---------- 오버레이 ---------- */
function openShows(){const ov=$('#ov');ov.hidden=false;
  ov.innerHTML=`<div class="ovbox" role="dialog" aria-label="공연 고르기"><div class="ovhd"><h2>공연 고르기</h2><button class="x" data-close aria-label="닫기">${IC.x}</button></div>
  <label class="sbox">${IC.search}<input id="q" placeholder="공연 이름, 날짜(예: 05-10)" autocomplete="off"></label>
  <div class="ovchips" id="vf"><button class="chip" data-vf="" aria-pressed="true">전체</button><button class="chip" data-vf="multi">동시 종료 예정</button>${['KSPO DOME','올림픽홀','티켓링크 라이브 아레나(핸드볼경기장)'].map(v=>`<button class="chip" data-vf="${esc(v)}">${esc(shortV(v))}</button>`).join('')}</div>
  <div class="ovlist" id="dl"></div></div>`;
  let vf='';const draw=()=>{const f=$('#q').value.trim().toLowerCase();let m='',h='';
    D.days.filter(d=>(!f||d.date.includes(f)||title(d).toLowerCase().includes(f))&&(!vf||(vf==='multi'?d.gap===0:venues(d).includes(vf)))).forEach(d=>{const mm=+d.date.slice(5,7);if(mm!==m){m=mm;h+=`<div class="mon">${mm}월</div>`}
      h+=`<button class="dayrow" data-day="${d.id}" aria-current="${d.id===S.day.id}"><span class="dbox"><b>${+d.date.slice(8)}</b><small>${d.wd}</small></span><span class="dt"><b>${esc(title(d))}</b><small>${esc(venues(d).map(shortV).join(' · '))} · 추정 종료 ${d.end}</small></span>${d.n>1?`<span class="pill2">${d.gap===0?'동시 종료 예정':d.n+'개 공연'}</span>`:''}</button>`});
    $('#dl').innerHTML=h||'<p class="empty">찾는 공연이 없어요.</p>'};
  draw();$('#q').addEventListener('input',draw);
  $('#vf').addEventListener('click',e=>{const b=e.target.closest('[data-vf]');if(!b)return;vf=b.dataset.vf;document.querySelectorAll('#vf .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()});
  const cur=document.querySelector('.dayrow[aria-current=true]');if(cur)cur.scrollIntoView({block:'center'});
  if(innerWidth>=960)$('#q').focus()}
function openDests(){const ov=$('#ov');ov.hidden=false;
  ov.innerHTML=`<div class="ovbox" role="dialog" aria-label="도착지 고르기"><div class="ovhd"><h2>어디로 가세요?</h2><button class="x" data-close aria-label="닫기">${IC.x}</button></div>
  <label class="sbox">${IC.search}<input id="q2" placeholder="역 이름 (예: 신논현, 천호)" autocomplete="off"></label><div class="ovlist"><div class="dgrid" id="dg"></div>
  <p class="note" style="padding:0 10px">목록에 없는 곳은 같은 노선의 가까운 역을 골라 주세요.</p></div></div>`;
  const draw=()=>{const f=$('#q2').value.trim();$('#dg').innerHTML=(S.dest?`<button class="dcell" data-dest=""><b>도착지 지우기</b><small>역별 상황 보기</small></button>`:'')+M.DEST.filter(t=>!f||t.n.includes(f)||t.sub.includes(f)||t.via.some(v=>v[1].includes(f))).map(t=>`<button class="dcell" data-dest="${t.id}" aria-pressed="${S.dest?.id===t.id}"><span class="lns">${[...new Set(t.via.map(v=>v[0]))].map(lb).join('')}</span><b>${esc(t.n)}</b><small>${esc(t.sub||t.via.map(v=>v[1]+'역').join(' · '))}</small></button>`).join('')};
  draw();$('#q2').addEventListener('input',draw);if(innerWidth>=960)$('#q2').focus()}
function openHelp(){const ov=$('#ov');ov.hidden=false;
  const row=(a,b)=>`<div class="hrow"><b>${a}</b><span>${b}</span></div>`;
  ov.innerHTML=`<div class="ovbox" role="dialog" aria-label="도움말"><div class="ovhd"><h2>도움말</h2><button class="x" data-close aria-label="닫기">${IC.x}</button></div><div class="ovlist help">
  <p class="hlead"><b>커튼콜 이후</b>는 2025년 공연·주차·지하철 공공데이터로 공연이 끝난 뒤의 혼잡을 미리 검토하는 도구예요. 실시간 정보가 아니에요.</p>
  <h3>화면 안내</h3><div class="card"><h4>운영자</h4>${row('요약','관측 결과와 시나리오 결과')}${row('새 일정','앞으로의 공연을 넣으면 비슷한 2025년 공연일 7일로 참고 범위')}${row('공연일·역별·주차','고른 날의 시간대별 기록')}${row('시뮬레이터','종료 시각 조정·대체 역 분산 가정 계산')}</div>
  <div class="card"><h4>관객 안내</h4>${row('길찾기','도착지를 고르면 탈 역·열차, 카카오맵 도보 길찾기')}${row('주변','공연 전후 들를 곳')}${row('막차','역별 마지막 열차까지 남은 시간')}</div>
  <h3>현장에서 쓰는 순서</h3><ol class="flow"><li><b>대관 협의</b><span>'새 일정'에서 종료 간격과 피크 참고 범위를 보고, 검토표를 출력해 기획사와 협의해요(권고).</span></li><li><b>공연 주간</b><span>비슷한 날 기록으로 주차 출구 안내 → 역 안내 순서와 인력 시간을 정해요.</span></li><li><b>공연 당일</b><span>A4 검토표를 현장에 나누고, 관람객에게는 '관객 안내' 화면으로 대체 역·막차를 알려요.</span></li><li><b>공연 뒤</b><span>안내한 날과 안 한 날의 대체 역 승차를 비교해 효과를 확인해요.</span></li></ol>
  <h3>꼭 알아 둘 점</h3><ul class="chk"><li>색은 각 역의 <b>평일 평균 최고치</b>와 비교한 정도예요. 역 수용능력이 아니에요.</li><li>시나리오는 2025년 기록에 가정을 얹은 계산이에요. 인과효과나 대기시간 단축을 보장하지 않아요.</li><li>대체 역 분산은 가는 길의 안내 인력·야간 조명·유도 표지와 관계기관 협의가 있어야 가능해요.</li><li>종료 시각은 공연 기획사와 협의할 사항이라, 결과는 협의 근거로 써요.</li><li>도보 시간은 카카오맵 '큰길우선' 경로 기준이에요. 밤에는 불 밝은 큰길로 걸어요.</li><li>공연이 늦게 끝나면 길찾기의 출발 시각을 바꿔 보고, 현장에서는 역·공연장 안내를 먼저 따르세요.</li></ul>
  <p class="hfoot">팀 크라우드제로(류시헌·임우징·석지혜)<br>2026년도 공공데이터 활용 경진대회 출품작 · <a href="https://github.com/woojingLim/curtaincall" target="_blank" rel="noopener">코드·데이터</a></p></div></div>`}
function closeOv(){const ov=$('#ov');ov.hidden=true;ov.innerHTML=''}

/* ---------- 렌더 ---------- */
function renderPanel(){const t=S.tab[S.mode];const P=$('#panel');
  P.innerHTML=S.mode==='aud'?(t==='route'?vRoute():t==='near'?vNear():vLast()):(t==='sum'?vSum():t==='plan'?vPlan():t==='over'?vOver():t==='stn'?vStn():t==='park'?vPark():vSim())}
function render(){renderTop();renderPanel();drawDyn();$('#legend').hidden=!(S.mode==='aud'||S.mode==='ops')}
function focusSel(){if(S.mode!=='aud')return fitDefault();const vxy=VN[S.venue];
  if(S.tab.aud==='route'){const o=OPTS.find(x=>x.key===S.sel);const g=o?.g||S.stnSel;if(g&&vxy)return fitTo(bboxOf([vxy,ST[g]]),true,180)}
  if(S.tab.aud==='near'){const p=M.poi.find(x=>x.id===S.poiSel&&x.xy);if(p&&vxy)return fitTo(bboxOf([vxy,p.xy]),true,200);return fitTo(bboxOf([...M.poi.filter(x=>x.xy).map(x=>x.xy),vxy||ST.c]),true,160)}
  fitDefault()}

/* ---------- 이벤트 ---------- */
function go(id){if(location.hash.slice(1)===id){setDay(id);render();focusSel()}else location.hash=id}
window.addEventListener('hashchange',()=>{setDay(location.hash.slice(1));closeOv();render();focusSel()});
$('#showBtn').addEventListener('click',openShows);
$('#modeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.mode=b.dataset.m;stopPlay();render();focusSel()});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;S.tab[S.mode]=b.dataset.tab;render();focusSel();$('#panel').scrollTop=0});
$('#ov').addEventListener('click',e=>{if(e.target.id==='ov'||e.target.closest('[data-close]'))return closeOv();
  const dr=e.target.closest('[data-day]');if(dr)return go(dr.dataset.day);
  const ds=e.target.closest('[data-dest]');if(ds){S.dest=M.DEST.find(t=>t.id===ds.dataset.dest)||null;S.sel=null;closeOv();S.tab.aud='route';render();$('#panel').scrollTop=0;focusSel()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#ov').hidden)closeOv()});
$('#panel').addEventListener('click',e=>{const t=e.target;let b;
  if(b=t.closest('#destBtn'))return openDests();
  if(b=t.closest('[data-dest]')){S.dest=M.DEST.find(x=>x.id===b.dataset.dest);S.sel=null;render();$('#panel').scrollTop=0;return focusSel()}
  if(b=t.closest('[data-venue]')){S.venue=b.dataset.venue;S.sel=null;render();return focusSel()}
  if(b=t.closest('[data-pref]')){S.pref=b.dataset.pref;S.sel=null;renderPanel();drawDyn();focusSel();return}
  if(b=t.closest('[data-dep]')){S.depKey=b.dataset.dep;S.dep=+b.dataset.m;S.sel=null;render();return}
  if(b=t.closest('[data-opt]')){S.sel=S.sel===b.dataset.opt?null:b.dataset.opt;renderPanel();drawDyn();if(S.sel)focusSel();return}
  if(b=t.closest('[data-stn]')){S.stnSel=S.stnSel===b.dataset.stn?null:b.dataset.stn;drawDyn();if(S.stnSel){const vxy=VN[S.venue];fitTo(bboxOf([vxy||ST[S.stnSel],ST[S.stnSel]]),true,180)}return}
  if(b=t.closest('[data-when]')){S.poiWhen=b.dataset.when;S.poiSel=null;renderPanel();drawDyn();return}
  if(b=t.closest('[data-poi]')){S.poiSel=S.poiSel===b.dataset.poi?null:b.dataset.poi;renderPanel();drawDyn();focusSel();return}
  if(b=t.closest('[data-gopoi]')){S.tab.aud='near';S.poiWhen='after';S.poiSel=b.dataset.gopoi;render();focusSel();return}
  if(b=t.closest('#playBtn')){S.playing?stopPlay():startPlay();return}
  if(b=t.closest('[data-help]'))return openHelp();
  if(b=t.closest('#printDay'))return printDay();
  if(b=t.closest('#printPlan'))return printPlan();
  if(b=t.closest('[data-pv]')){const sh=S.plan.shows[+b.dataset.pv];sh.on=!sh.on;renderPanel();drawDyn();return}
  if(b=t.closest('[data-goday]')){S.tab.ops=b.dataset.gotab||'over';go(b.dataset.goday);$('#panel').scrollTop=0;return}});
$('#panel').addEventListener('change',e=>{const t=e.target;
  if(t.id==='planDate'&&t.value){S.plan.date=t.value;renderPanel();return}
  if(t.id==='planAud'){S.plan.aud=t.value;renderPanel();document.getElementById('planAud')?.focus();return}
  if(t.dataset.ps!=null&&t.value){S.plan.shows[+t.dataset.ps].s=t.value;renderPanel();return}
  if(t.dataset.pt!=null){S.plan.shows[+t.dataset.pt].t=t.value;renderPanel();return}});
$('#panel').addEventListener('input',e=>{const t=e.target;
  if(t.id==='depIn'&&t.value){const [h,m]=t.value.split(':').map(Number);let v=h*60+m;if(v<240)v+=1440;S.dep=v;S.depKey='custom';S.sel=null;renderPanel();drawDyn();document.getElementById('depIn')?.focus();return}
  if(t.id==='hourIn'){S.hour=+t.value;stopPlay();renderPanel();drawDyn();document.getElementById('hourIn')?.focus();return}
  if(t.id==='shIn'){S.shift=+t.value;renderPanel();document.getElementById('shIn')?.focus();return}
  if(t.id==='alIn'){S.alt=+t.value;renderPanel();document.getElementById('alIn')?.focus();return}});
function startPlay(){S.hour=12;S.playing=setInterval(()=>{S.hour=S.hour>=23?12:S.hour+1;renderPanel();drawDyn()},900);renderPanel()}
function stopPlay(){if(S.playing){clearInterval(S.playing);S.playing=null;if(S.mode==='ops')renderPanel()}}
function mapClick(el){if(!el)return;if(el.dataset.stn){if(S.mode==='ops'){S.tab.ops='stn';render();return}
    if(S.tab.aud!=='route'){S.tab.aud='route'}
    if(S.dest){const o=OPTS.find(x=>x.g===el.dataset.stn);if(o){S.sel=o.key;render();focusSel();setTimeout(()=>document.querySelector('.opt[aria-expanded=true]')?.scrollIntoView({block:'nearest',behavior:'smooth'}),50)}}
    else{S.stnSel=el.dataset.stn;render();focusSel()}return}
  if(el.dataset.poi){S.poiSel=el.dataset.poi;renderPanel();drawDyn();setTimeout(()=>document.querySelector('.pc[aria-pressed=true]')?.scrollIntoView({block:'nearest',behavior:'smooth'}),50)}}
// 시트 끌기(모바일)
(function(){const sh=$('#sheet'),gb=$('#grab');let y0=null,h0=0;
  const setState=s=>{S.sheet=s;sh.classList.remove('min','max');if(s!=='mid')sh.classList.add(s)};
  gb.addEventListener('click',()=>{if(moved2>6)return;setState(S.sheet==='mid'?'max':S.sheet==='max'?'min':'mid');setTimeout(focusSel,300)});
  let moved2=0;gb.addEventListener('pointerdown',e=>{y0=e.clientY;h0=sh.getBoundingClientRect().height;moved2=0;gb.setPointerCapture(e.pointerId);sh.classList.add('nodrag')});
  gb.addEventListener('pointermove',e=>{if(y0==null)return;const dy=e.clientY-y0;moved2=Math.abs(dy);sh.style.height=Math.max(120,Math.min(innerHeight-70,h0-dy))+'px'});
  gb.addEventListener('pointerup',e=>{if(y0==null)return;sh.classList.remove('nodrag');const h=sh.getBoundingClientRect().height;sh.style.height='';y0=null;
    if(moved2>6){setState(h<innerHeight*.3?'min':h>innerHeight*.66?'max':'mid');setTimeout(focusSel,300)}})})();
$('#zin').addEventListener('click',()=>zoomBtn(.7));$('#zout').addEventListener('click',()=>zoomBtn(1.4));$('#zfit').addEventListener('click',focusSel);
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(focusSel,150)});

/* ---------- 시작 ---------- */
$('#zin').innerHTML=IC.plus;$('#zout').innerHTML=IC.minus;$('#zfit').innerHTML=IC.target;$('#helpBtn').innerHTML=IC.help;$('#helpBtn').addEventListener('click',openHelp);
setDay(location.hash.slice(1));initMap();render();setTimeout(focusSel,30);
