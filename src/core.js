/* ===== 커튼콜 이후 · 지도 앱 — 공통 · 지도 ===== */
const $=s=>document.querySelector(s);
const IC={
  ticket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a3 3 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a3 3 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M14 5v14" stroke-dasharray="2 2"/></svg>',
  chev:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
  route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  walk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="m9 21 2-6 3 3v3M7 12l2-4 4-1 3 3 3 1M11 15l1-5"/></svg>',
  train:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 17l-2 4M15 17l2 4M9 14h.01M15 14h.01"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 7.6h.01"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  tree:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-6M7 16h10l-3-4h2l-4-5-4 5h2z"/></svg>',
  museum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>',
  food:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 4-3 7h3v11"/></svg>',
  wave:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M12 3v5"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  car:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14v-4l-2-5H7l-2 5z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg>',
  sliders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 14v4M10 16h4"/></svg>',
  print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
};
const CAT={walk:{ic:'tree',t:'산책'},see:{ic:'museum',t:'볼거리'},out:{ic:'wave',t:'가는 길에'},food:{ic:'food',t:'먹거리'}};

/* ---------- 데이터 ---------- */
const lvTag=c=>c?`<span class="lv lv${c.lv}">${LV[c.lv].t}</span>`:'<span class="lv lvx">기록 없음</span>';
const ratioTxt=r=>r>=1?`평일 평균 최고치의 ${r.toFixed(1)}배`:`평일 평균 최고치의 ${Math.round(r*100)}%`;
const lb=ln=>`<span class="lb l${ln}">${ln}</span>`;

/* ---------- 상태 ---------- */
const S={plan:{date:'2026-12-05',aud:'',shows:[{v:'KSPO DOME',s:'18:00',t:'콘서트',on:true},{v:'티켓링크 라이브 아레나(핸드볼경기장)',s:'18:00',t:'콘서트',on:false},{v:'올림픽홀',s:'18:30',t:'팬미팅·팬콘',on:true}]},pref:'calm',day:null,venue:null,mode:'ops',tab:{aud:'route',ops:'sum'},depKey:'end',dep:null,dest:null,sel:null,hour:null,shift:60,alt:20,poiWhen:'after',poiSel:null,stnSel:null,sheet:'mid',playing:null};
function setDay(id){const d=byId[id]||byId['d20250510']||D.days[0];S.day=d;const vs=venues(d);S.venue=vs.find(v=>D.walk[v])||vs[0];S.depKey='end';S.dep=calEnd(d);S.sel=null;S.hour=null;S.stnSel=null;S.poiSel=null;S.busSel=null}

/* ---------- 지도 ---------- */
const G=M.geo,[MW,MH]=G.size,NS='http://www.w3.org/2000/svg';
const svg=$('#svg');let V={x:0,y:0,w:MW,h:MH};
const PARK=[[560,1010],[640,820],[760,640],[930,470],[1150,350],[1420,300],[1700,320],[1960,420],[2170,560],[2290,740],[2300,940],[2200,1110],[2080,1220],[1990,1380],[1880,1540],[1760,1640],[1560,1670],[1360,1600],[1160,1480],[960,1370],[780,1270],[640,1170]];
const smooth=pts=>{let d='';const n=pts.length;for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];if(i===0)d+=`M${p1[0]} ${p1[1]}`;
  d+=`C${p1[0]+(p2[0]-p0[0])/6} ${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6} ${p2[1]-(p3[1]-p1[1])/6} ${p2[0]} ${p2[1]}`}return d+'Z'};
const ST=G.stn,VN=G.venue;
// 지하철 노선(역 좌표는 위키백과, 지도 밖으로 나가는 방향은 단순화)
const LINESHAPE=[
  {ln:'5',c:'#996CAC',pts:[[1700,2440],ST.b,ST.c,[2470,-60]],ends:[[1640,2330,'오금·마천'],[2400,70,'둔촌동·천호·광화문']]},
  {ln:'9',c:'#BDB092',pts:[[150,2440],[480,1720],ST.h,ST.c,ST.dd,[3060,690]],ends:[[290,2150,'석촌·신논현·여의도'],[2880,770,'중앙보훈병원']]},
  {ln:'8',c:'#E6186C',pts:[[-60,1300],ST.m,[1020,-60]],ends:[[150,1250,'잠실·모란'],[960,90,'천호·별내']]},
];
function baseLayer(){
  let s=`<defs><pattern id="blk" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#F3F4F6"/><rect x="10" y="10" width="100" height="100" rx="14" fill="#E9EBEF"/></pattern>
  <filter id="shd" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#101828" flood-opacity=".22"/></filter></defs>
  <rect x="-2000" y="-2000" width="${MW+4000}" height="${MH+4000}" fill="url(#blk)"/>`;
  // 큰길(양재대로 · 5호선 위)
  s+=`<path d="M1700 2440 L${ST.b} L${ST.c} L2470 -60" fill="none" stroke="#D9DCE1" stroke-width="58" stroke-linejoin="round"/><path d="M1700 2440 L${ST.b} L${ST.c} L2470 -60" fill="none" stroke="#FFFFFF" stroke-width="46" stroke-linejoin="round"/>`;
  s+=`<text x="1690" y="2260" font-size="34" fill="#98A2B3" font-weight="600" transform="rotate(-62 1690 2260)">양재대로</text>`;
  // 공원
  s+=`<path d="${smooth(PARK)}" fill="#CFE6C3" stroke="#B8D9A8" stroke-width="10"/>`;
  s+=`<ellipse cx="${M.fort[0]}" cy="${M.fort[1]+20}" rx="300" ry="190" fill="#BEDDAE"/><text x="${M.fort[0]}" y="${M.fort[1]-70}" text-anchor="middle" font-size="34" fill="#5E8A4C" font-weight="600">몽촌토성</text>`;
  s+=`<text x="1150" y="1150" text-anchor="middle" font-size="44" fill="#6E9A5B" font-weight="700" letter-spacing="4">올림픽공원</text>`;
  // 공연장 건물
  const K=VN['KSPO DOME'],T=VN['티켓링크 라이브 아레나(핸드볼경기장)'],H=VN['올림픽홀'];
  s+=`<g fill="#F4F7F1" stroke="#B9CDAE" stroke-width="5"><circle cx="${K[0]}" cy="${K[1]}" r="62"/><rect x="${T[0]-50}" y="${T[1]-34}" width="100" height="68" rx="14"/><rect x="${H[0]-46}" y="${H[1]-30}" width="92" height="60" rx="12"/></g>`;
  // 노선
  LINESHAPE.forEach(L=>{const d='M'+L.pts.map(p=>p.join(' ')).join(' L');s+=`<path d="${d}" fill="none" stroke="#fff" stroke-width="30" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${L.c}" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>`});
  return s}
const LNAME=[['9',(ST.h[0]+ST.c[0])/2,(ST.h[1]+ST.c[1])/2+4],['5',(ST.b[0]+ST.c[0])/2+8,(ST.b[1]+ST.c[1])/2],['8',(ST.m[0]+1020)/2-150,(ST.m[1])/2+280]];
function lineTags(sc){return LNAME.map(([ln,x,y])=>{const c=M.lines[ln].color,fs=10.5*sc,w=fs*4.6,h=fs*1.8;return `<g transform="translate(${x} ${y})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${c}"/><text y="${fs*.36}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff">${ln}호선</text></g>`}).join('')}
function ends(scale){let s='';LINESHAPE.forEach(L=>L.ends.forEach(([x,y,t])=>{const fs=11.5*scale,w=(t.length*fs*.92+fs*2.4),h=fs*2;
  s+=`<g transform="translate(${x} ${y})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="#fff" stroke="${L.c}" stroke-width="${1.5*scale}"/><circle cx="${-w/2+h/2}" cy="0" r="${fs*.42}" fill="${L.c}"/><text x="${fs*.55}" y="${fs*.36}" text-anchor="middle" font-size="${fs}" fill="#344054" font-weight="600">${t}</text></g>`}));return s}
const elBase=document.createElementNS(NS,'g'),elDyn=document.createElementNS(NS,'g');
function initMap(){elBase.innerHTML=baseLayer();svg.append(elBase,elDyn);fitDefault(false);bindPan()}
const px=()=>V.w/svg.clientWidth;   // 화면 1px = 지도 몇 m
function setView(v,anim){const aspect=svg.clientHeight/svg.clientWidth||1;v.h=v.w*aspect;
  if(anim){const a={...V},t0=performance.now(),dur=320;const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);V={x:a.x+(v.x-a.x)*e,y:a.y+(v.y-a.y)*e,w:a.w+(v.w-a.w)*e,h:a.h+(v.h-a.h)*e};apply();if(k<1)requestAnimationFrame(step);else drawDyn()};requestAnimationFrame(step)}
  else{V=v;apply();drawDyn()}}
function apply(){svg.setAttribute('viewBox',`${V.x} ${V.y} ${V.w} ${V.h}`)}
function visibleRect(){const W=svg.clientWidth,H=svg.clientHeight;const sh=$('#sheet');
  if(innerWidth>=960)return {l:464,t:24,r:W-70,b:H-24};
  const top=74,bot=H-(sh?sh.getBoundingClientRect().height:0)-8;return {l:12,t:top,r:W-64,b:Math.max(top+80,bot)}}
function fitTo(b,anim=true,pad=60){const R=visibleRect(),W=svg.clientWidth,H=svg.clientHeight;
  const bw=b[2]-b[0]+pad*2,bh=b[3]-b[1]+pad*2,sx=bw/(R.r-R.l),sy=bh/(R.b-R.t),s=Math.max(sx,sy,innerWidth>=960?2.3:1.7);
  const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,vw=W*s,vh=H*s;
  const x=cx-((R.l+R.r)/2)*s,y=cy-((R.t+R.b)/2)*s;setView({x,y,w:vw,h:vh},anim)}
const bboxOf=pts=>[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
function fitDefault(anim=true){const b=bboxOf([...Object.values(ST),VN['KSPO DOME']]);fitTo([b[0]-190,b[1]-140,b[2]+330,b[3]+60],anim,60)}
function bindPan(){const P=new Map();let last=null;
  svg.addEventListener('pointerdown',e=>{downEl=e.target.closest('[data-stn],[data-poi],[data-v],[data-bus],[data-park]');svg.setPointerCapture(e.pointerId);P.set(e.pointerId,{x:e.clientX,y:e.clientY});last=null;svg.classList.add('drag');moved=0});
  svg.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const p=P.get(e.pointerId),nx=e.clientX,ny=e.clientY;
    if(P.size===1){const s=px();V.x-=(nx-p.x)*s;V.y-=(ny-p.y)*s;moved+=Math.abs(nx-p.x)+Math.abs(ny-p.y);P.set(e.pointerId,{x:nx,y:ny});apply()}
    else if(P.size===2){P.set(e.pointerId,{x:nx,y:ny});const [a,b]=[...P.values()],dist=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      if(last){zoomAt(mid,last.dist/dist,false);const s=px();V.x-=(mid.x-last.mid.x)*s;V.y-=(mid.y-last.mid.y)*s;apply()}last={dist,mid};moved=99}});
  const up=e=>{P.delete(e.pointerId);last=null;if(!P.size){svg.classList.remove('drag');if(moved<8&&downEl&&e.type==='pointerup')mapClick(downEl);else drawDyn();downEl=null}};
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
  svg.addEventListener('wheel',e=>{e.preventDefault();zoomAt({x:e.clientX,y:e.clientY},Math.exp(e.deltaY*.0015),true)},{passive:false})}
let moved=0,dynT=null,downEl=null;
function zoomAt(c,f,redraw){const r=svg.getBoundingClientRect(),s=px(),wx=V.x+(c.x-r.left)*s,wy=V.y+(c.y-r.top)*s;
  const nw=Math.min(Math.max(V.w*f,600),MW*2.2),k=nw/V.w;V.x=wx-(wx-V.x)*k;V.y=wy-(wy-V.y)*k;V.w=nw;V.h=V.h*k;apply();
  if(redraw){clearTimeout(dynT);dynT=setTimeout(drawDyn,90)}}
function zoomBtn(f){const r=svg.getBoundingClientRect(),R=visibleRect();zoomAt({x:r.left+(R.l+R.r)/2,y:r.top+(R.t+R.b)/2},f,true)}
const curve=(a,b,bend=.18)=>{const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1];return {d:`M${a[0]} ${a[1]} Q${mx-dy*bend} ${my+dx*bend} ${b[0]} ${b[1]}`,m:[mx-dy*bend/2,my+dx*bend/2]}};
function pill(x,y,txt,sc,o={}){const fs=(o.fs||12)*sc,w=txt.length*fs*.86+fs*1.6+(o.icon?fs*1.3:0),h=fs*2.05;
  return `<g transform="translate(${x} ${y})" ${o.attr||''}><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${o.bg||'#fff'}" ${o.bg?'':'filter="url(#shd)"'}/>${o.icon?`<g transform="translate(${-w/2+fs*.7} ${-fs*.62}) scale(${fs/20})" color="${o.fg||'#344054'}">${IC[o.icon].replace('<svg','<svg width="24" height="24"')}</g>`:''}<text x="${o.icon?fs*.62:0}" y="${fs*.36}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${o.fg||'#344054'}">${esc(txt)}</text></g>`}
