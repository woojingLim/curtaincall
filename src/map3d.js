/* ===== 3D 지도 (MapLibre) — 기존 SVG 지도 함수들을 덮어써요 ===== */
// 실제 지도 라이브러리(MapLibre)를 불러오면 약도(SVG) 함수 대신 아래 gl_ 함수들을 써요.
// 라이브러리·지도 타일을 못 불러오면(인터넷 끊김, 오래된 브라우저) 자동으로 약도 지도로 돌아가요.
var MAP,MAPREADY,MK,GEO;
function toLL(p){const LAT0=37.5275,LNG0=127.1080,KX=111320*Math.cos(37.517*Math.PI/180),KY=110950;return [LNG0+p[0]/KX,LAT0-p[1]/KY]}
function glEl(){return document.getElementById('gl')}
var Z0=15.6,Z1=16.4,AUTO3D=true;   // 이 사이에서 약도 → 실제 3D 지도로 바뀌어요
function smoothRing(pts){const out=[],n=pts.length;for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
  for(let k=0;k<8;k++){const t=k/8,t2=t*t,t3=t2*t;out.push([0,1].map(j=>.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}return out}
function ellipse(cx,cy,rx,ry){const r=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;r.push(toLL([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]))}return r}
var GTILT=45;   // 3D일 때 기울기(도). 방향(회전)은 항상 북쪽 고정
function wantTilt(z){return AUTO3D&&z>=Z1}
function autoTilt(){if(!MAP)return;const z=MAP.getZoom(),p=MAP.getPitch(),want=wantTilt(z)?GTILT:(z<Z0||!AUTO3D?0:p);
  if(Math.abs(p-want)>2)MAP.easeTo({pitch:want,duration:500})}
function gl_initMap(){
  MAP=new maplibregl.Map({container:'gl',style:'https://tiles.openfreemap.org/styles/positron',center:[127.1222,37.5180],zoom:15,pitch:0,bearing:0,dragRotate:true,touchPitch:false,pitchWithRotate:false,
    maxPitch:70,attributionControl:{compact:true},localIdeographFontFamily:"'Pretendard Variable','Pretendard','Noto Sans KR','Malgun Gothic',sans-serif"});
  GEO=new maplibregl.GeolocateControl({positionOptions:{enableHighAccuracy:true},trackUserLocation:true,showUserHeading:true,fitBoundsOptions:{maxZoom:17}});
  MAP.addControl(GEO,'bottom-right');
  MAP.on('load',()=>{
    const st=MAP.getStyle();
    // 지명은 한국어 우선
    st.layers.forEach(l=>{if(l.type==='symbol'&&l.layout&&l.layout['text-field']){try{MAP.setLayoutProperty(l.id,'text-field',['coalesce',['get','name:ko'],['get','name'],['get','name_int']])}catch(e){}}});
    const firstSym=st.layers.find(l=>l.type==='symbol')?.id;
    // 입체 건물 (가까이 확대했을 때만 서서히 나타나요)
    const src=Object.keys(st.sources).find(k=>st.sources[k].type==='vector');
    if(src)MAP.addLayer({id:'cc-3d',type:'fill-extrusion',source:src,'source-layer':'building',minzoom:15.4,
      paint:{'fill-extrusion-color':['interpolate',['linear'],['coalesce',['get','render_height'],8],0,'#E7EAF0',40,'#D5DAE3'],
        'fill-extrusion-height':['coalesce',['get','render_height'],['get','height'],8],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],
        'fill-extrusion-opacity':['interpolate',['linear'],['zoom'],15.4,0,16.3,.88]}},firstSym);
    // 넓게 볼 때는 원래 약도 화면: 실제 지도를 덮고, 확대하면 덮개가 걷혀요
    const F=(a,b)=>['interpolate',['linear'],['zoom'],Z0,a,Z1,b];
    MAP.addLayer({id:'cc-cover',type:'background',paint:{'background-color':'#F3F4F6','background-opacity':F(1,0)}},firstSym);
    const ring=smoothRing(PARK).map(toLL);ring.push(ring[0]);
    MAP.addSource('cc-sketch',{type:'geojson',data:{type:'FeatureCollection',features:[
      {type:'Feature',properties:{k:'park'},geometry:{type:'Polygon',coordinates:[ring]}},
      {type:'Feature',properties:{k:'fort'},geometry:{type:'Polygon',coordinates:[ellipse(M.fort[0],M.fort[1]+20,300,190)]}},
      {type:'Feature',properties:{k:'road'},geometry:{type:'LineString',coordinates:[[1700,2440],ST.b,ST.c,[2470,-60]].map(toLL)}},
      {type:'Feature',properties:{k:'lab',t:'올림픽공원',sz:17},geometry:{type:'Point',coordinates:toLL([1150,1150])}},
      {type:'Feature',properties:{k:'lab',t:'몽촌토성',sz:13},geometry:{type:'Point',coordinates:toLL([M.fort[0],M.fort[1]-60])}}]}});
    MAP.addLayer({id:'cc-road-case',type:'line',source:'cc-sketch',filter:['==',['get','k'],'road'],paint:{'line-color':'#D9DCE1','line-width':['interpolate',['exponential',2],['zoom'],13,4,16,30],'line-opacity':F(1,0)},layout:{'line-join':'round'}},firstSym);
    MAP.addLayer({id:'cc-road',type:'line',source:'cc-sketch',filter:['==',['get','k'],'road'],paint:{'line-color':'#FFFFFF','line-width':['interpolate',['exponential',2],['zoom'],13,3,16,24],'line-opacity':F(1,0)},layout:{'line-join':'round'}},firstSym);
    MAP.addLayer({id:'cc-park',type:'fill',source:'cc-sketch',filter:['==',['get','k'],'park'],paint:{'fill-color':'#CFE6C3','fill-outline-color':'#B8D9A8','fill-opacity':F(1,0)}},firstSym);
    MAP.addLayer({id:'cc-fort',type:'fill',source:'cc-sketch',filter:['==',['get','k'],'fort'],paint:{'fill-color':'#BEDDAE','fill-opacity':F(1,0)}},firstSym);
    MAP.addLayer({id:'cc-lab',type:'symbol',source:'cc-sketch',filter:['==',['get','k'],'lab'],layout:{'text-field':['get','t'],'text-size':['get','sz'],'text-letter-spacing':.15,'text-allow-overlap':true},
      paint:{'text-color':'#6E9A5B','text-halo-color':'#CFE6C3','text-halo-width':1,'text-opacity':F(1,0)}});
    // 지하철 노선
    MAP.addSource('cc-lines',{type:'geojson',data:{type:'FeatureCollection',features:LINESHAPE.map(L=>({type:'Feature',properties:{c:L.c},geometry:{type:'LineString',coordinates:L.pts.map(toLL)}}))}});
    MAP.addLayer({id:'cc-lines-case',type:'line',source:'cc-lines',paint:{'line-color':'#fff','line-width':9},layout:{'line-cap':'round','line-join':'round'}},firstSym);
    MAP.addLayer({id:'cc-lines',type:'line',source:'cc-lines',paint:{'line-color':['get','c'],'line-width':5},layout:{'line-cap':'round','line-join':'round'}},firstSym);
    // 도보 경로
    MAP.addSource('cc-walk',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    MAP.addLayer({id:'cc-walk',type:'line',source:'cc-walk',filter:['!',['get','sel']],paint:{'line-color':'#98A2B3','line-width':3,'line-dasharray':[1,2.5],'line-opacity':.85},layout:{'line-cap':'round'}});
    MAP.addLayer({id:'cc-walk-sel-case',type:'line',source:'cc-walk',filter:['get','sel'],paint:{'line-color':'#fff','line-width':9},layout:{'line-cap':'round'}});
    MAP.addLayer({id:'cc-walk-sel',type:'line',source:'cc-walk',filter:['get','sel'],paint:{'line-color':'#1F5BD8','line-width':5,'line-dasharray':[.6,1.6]},layout:{'line-cap':'round'}});
    const zc=()=>glEl().classList.toggle('far',MAP.getZoom()<15.4);MAP.on('zoom',zc);zc();MAP.on('zoomend',autoTilt);
    MAP.on('rotate',syncBear);MAPREADY=true;clearTimeout(GLWAIT);glBtn();syncBear();drawDyn();fitDefault(false)});
}
function gl_visibleRect(){const el=glEl(),W=el.clientWidth,H=el.clientHeight,sh=$('#sheet');
  if(innerWidth>=960)return {l:464,t:24,r:W-70,b:H-24};
  const top=74,bot=H-(sh?sh.getBoundingClientRect().height:0)-8;return {l:12,t:top,r:W-64,b:Math.max(top+80,bot)}}
function gl_fitTo(b,anim=true,pad=60){if(!MAP)return;const el=glEl(),W=el.clientWidth,H=el.clientHeight,R=visibleRect();
  const sw=toLL([b[0]-pad,b[3]+pad]),ne=toLL([b[2]+pad,b[1]-pad]);
  const padding={left:Math.max(0,R.l),top:Math.max(0,R.t),right:Math.max(0,W-R.r),bottom:Math.max(0,H-R.b)};
  if(padding.left+padding.right>W-40||padding.top+padding.bottom>H-40)return;
  const cam=MAP.cameraForBounds([sw,ne],{padding,bearing:MAP.getBearing()});if(!cam)return;
  const z=Math.min(cam.zoom,17.3),tilt=wantTilt(z);MAP.easeTo({center:cam.center,zoom:z-(tilt?.3:0),bearing:MAP.getBearing(),pitch:tilt?GTILT:0,duration:anim?650:0})}
function gl_fitDefault(anim=true){const b=bboxOf([...Object.values(ST),VN['KSPO DOME']]);innerWidth<960?fitTo([b[0]+200,b[1],b[2]-120,b[3]],anim,0):fitTo([b[0]-150,b[1]-120,b[2]+150,b[3]+60],anim,40)}
function gl_zoomBtn(f){if(!MAP)return;f<1?MAP.zoomIn():MAP.zoomOut()}
function gl_setView(){}
/* ---- 마커 ---- */
function mk(html,xy,cls,data,anchor='center'){MK=MK||[];const el=document.createElement('div');el.className='m3 '+cls;el.innerHTML=html;for(const k in data)el.dataset[k]=data[k];
  el.addEventListener('click',e=>{e.stopPropagation();if(Object.keys(data).length)mapClick(el)});
  const m=new maplibregl.Marker({element:el,anchor}).setLngLat(toLL(xy)).addTo(MAP);MK.push(m);return el}
var lnBadges=g=>GRP[g].k.map(k=>`<i style="background:${M.lines[SK[k].ln].color}">${SK[k].ln}</i>`).join('');
function stnMarker3(g,c,o={}){const col=c?LV[c.lv].c:'#98A2B3';
  mk(`<span class="dot${o.sel?' sel':''}" style="--c:${col}"></span><span class="lab">${lnBadges(g)}<b>${GRP[g].n}</b>${c?`<em style="background:${col}">${LV[c.lv].t.replace('승차 ','')}</em>`:''}</span>`,ST[g],'stn'+(o.dim?' dim':'')+(o.sel?' on':''),{stn:g})}
function crowdMarker(g,v,r,lv){const col=lv==null?'#98A2B3':LV[lv].c,R=Math.round(14+Math.sqrt(v||0)*.42);
  const rt=r!=null?(r>=1?r.toFixed(1)+'배':Math.round(r*100)+'%'):'';
  mk(`<span class="halo" style="--c:${col};width:${R*2}px;height:${R*2}px"></span><span class="dot" style="--c:${col}"></span><span class="lab">${lnBadges(g)}<b>${GRP[g].n}</b>${v!=null?`<small>${fmt(v)}명</small>`:''}${rt?`<em style="background:${col}">${rt}</em>`:''}</span>`,ST[g],'stn crowd',{stn:g})}
function venuePin(v){if(!VN[v])return;mk(`<span class="pin"></span><b>${esc(shortV(v))}</b>`,VN[v],'venue',{},'bottom')}
function venueDot(v){if(!VN[v])return;mk(`<span class="vd"></span><b>${esc(shortV(v))}</b>`,VN[v],'venue small',{})}
function pillMarker(xy,t){mk(`<span class="walkpill">${IC.walk}${esc(t)}</span>`,xy,'pillm',{})}
function busMarker(t,sel){mk(`<span class="bsq${sel?' sel':''}">B</span>${sel?`<b>${esc(t.n)}</b>`:''}`,t.xy,'bus'+(sel?' on':''),{bus:t.id})}
function parkMarker(p){const lv=parkLv(p.full),sel=p.id===S.parkSel,col=lv==null?'#98A2B3':LV[lv].c;
  mk(`<span class="psq" style="background:${col}">P</span><b>${esc(p.n)}${sel&&p.full!=null?` · 만차 ${p.full}일`:''}</b>`,p.xy,'park'+(sel?' on':''),{park:p.id})}
function poiMarker(p){const sel=p.id===S.poiSel,col={walk:'#16834A',see:'#6D4FD8',out:'#1C6FD1',food:'#D9620B'}[p.cat];
  mk(`<span class="pc3" style="background:${col}">${IC[CAT[p.cat].ic]}</span>${sel?`<b>${esc(p.n)}</b>`:''}`,p.xy,'poi'+(sel?' on':''),{poi:p.id})}
function curvePts(a,b,bend=.18){const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],cx=mx-dy*bend,cy=my+dx*bend,pts=[];
  for(let i=0;i<=24;i++){const t=i/24,u=1-t;pts.push(toLL([u*u*a[0]+2*u*t*cx+t*t*b[0],u*u*a[1]+2*u*t*cy+t*t*b[1]]))}return pts}
function gl_drawDyn(){if(!MAPREADY)return;(MK||[]).forEach(m=>m.remove());MK=[];const d=S.day,vxy=VN[S.venue],walk=[];
  if(S.mode==='aud'){const tab=S.tab.aud;let groups=Object.keys(GRP),selG=null;
    if(tab==='route'&&S.dest){groups=[...new Set(OPTS.map(o=>o.g))];const so=OPTS.find(o=>o.key===S.sel);selG=so?.g}
    if(tab==='route'&&!S.dest&&S.stnSel)selG=S.stnSel;
    if(vxy&&tab!=='near'){groups.forEach(g=>walk.push({a:vxy,b:ST[g],sel:g===selG}));if(selG)pillMarker(curve(vxy,ST[selG]).m,`${walkOf(S.venue,selG)}분`)}
    if(tab==='near'&&vxy){const p=M.poi.find(x=>x.id===S.poiSel&&x.xy);if(p){walk.push({a:vxy,b:p.xy,sel:true,bend:.12});pillMarker(curve(vxy,p.xy,.12).m,`약 ${distMin(vxy,p.xy)}분`)}}
    if(tab==='route'&&M.bus){const bs=M.bus.find(t=>t.id===S.busSel);if(bs&&vxy){walk.push({a:vxy,b:bs.xy,sel:true,bend:.12});pillMarker(curve(vxy,bs.xy,.12).m,`약 ${distMin(vxy,bs.xy)}분`)}M.bus.forEach(t=>busMarker(t,t.id===S.busSel))}
    if(tab==='near')M.poi.filter(p=>p.xy).forEach(poiMarker);
    Object.keys(GRP).forEach(g=>{const on=groups.includes(g),arr=S.dep+walkOf(S.venue,g),c=crowdG(d,g,Math.floor(arr/60));stnMarker3(g,c,{dim:!on,sel:g===selG})});
    venuePin(S.venue)}
  else if(S.tab.ops==='plan'){Object.keys(GRP).forEach(g=>stnMarker3(g,null,{}));S.plan.shows.filter(x=>x.on).forEach(x=>venuePin(x.v))}
  else{const hr=opsHour();if(S.tab.ops==='park'&&M.park)M.park.forEach(parkMarker);
    Object.keys(GRP).forEach(g=>{const v=grpVal(d,g,hr),u=UMAX[g],r=v!=null?v/u:null,lv=r==null?null:r<.6?0:r<1?1:r<1.6?2:3;crowdMarker(g,v,r,lv)});
    venues(d).filter(v=>VN[v]).forEach(venueDot)}
  MAP.getSource('cc-walk').setData({type:'FeatureCollection',features:walk.map(w=>({type:'Feature',properties:{sel:!!w.sel},geometry:{type:'LineString',coordinates:curvePts(w.a,w.b,w.bend||.18)}}))})}
/* ---- 버튼 ---- */
document.getElementById('gpsBtn').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 20l8-4 8 4z"/></svg>';
document.getElementById('gpsBtn').addEventListener('click',()=>{if(!GEO)return;if(!navigator.geolocation){alert('이 브라우저에서는 위치를 쓸 수 없어요.');return}GEO.trigger()});

/* ---- 3D 버튼 ---- */
function glBtn(){const b=$('#tiltBtn');if(!b)return;b.textContent=AUTO3D?'3D':'2D';b.setAttribute('aria-pressed',AUTO3D);b.setAttribute('aria-label',AUTO3D?'2D로 보기':'3D로 보기')}
function gl_toggleTilt(){if(!MAP)return;AUTO3D=!AUTO3D;glBtn();
  if(AUTO3D){if(MAP.getZoom()<Z1)MAP.easeTo({zoom:Z1+.4,pitch:GTILT,duration:900});else autoTilt()}else MAP.easeTo({pitch:0,duration:500})}
/* ---- 지도 방향(회전) ----
   나침반 버튼 → 방향 슬라이더. 휴대폰은 두 손가락으로 돌려도 되고, PC는 오른쪽 버튼으로 끌어도 돌아가요. */
var DIRS=['북','북동','동','남동','남','남서','서','북서'];
function norm360(b){return ((b%360)+360)%360}
function syncBear(){if(!MAP)return;const b=MAP.getBearing(),r=$('#bearRange'),n=$('#compassBtn .needle');
  if(r&&document.activeElement!==r)r.value=Math.round(b);
  if(n)n.style.transform=`rotate(${-b}deg)`;
  const v=$('#bearVal');if(v)v.textContent=Math.abs(b)<.5?'북쪽이 위':`위쪽 ${DIRS[Math.round(norm360(b)/45)%8]} ${Math.round(norm360(b))}°`;
  const c=$('#compassBtn');if(c)c.classList.toggle('turned',Math.abs(b)>=.5)}
function bearPop(open){const pop=$('#bearPop'),c=$('#compassBtn');if(!pop||!c)return;open=open??pop.hidden;pop.hidden=!open;c.setAttribute('aria-expanded',open);
  if(open){const m=mapEl.getBoundingClientRect(),r=c.getBoundingClientRect();pop.style.top=(r.top-m.top+r.height/2)+'px';pop.style.right=(m.right-r.left+8)+'px';syncBear()}}
$('#compassBtn').innerHTML='<svg viewBox="0 0 24 24" class="needle"><path d="M12 2.5 15.4 12H8.6z" fill="#E5383B"/><path d="M12 21.5 8.6 12h6.8z" fill="#98A2B3"/><circle cx="12" cy="12" r="1.7" fill="#fff"/></svg>';
$('#compassBtn').addEventListener('click',e=>{e.stopPropagation();bearPop()});
function bearAround(){const R=gl_visibleRect();return MAP.unproject([(R.l+R.r)/2,(R.t+R.b)/2])}   // 패널에 가리지 않은 화면 가운데를 축으로 돌려요
$('#bearRange').addEventListener('input',e=>{if(MAP)MAP.easeTo({bearing:+e.target.value,around:bearAround(),duration:0})});
$('#bearRange').addEventListener('change',()=>syncBear());
$('#bearN').addEventListener('click',()=>{if(MAP)MAP.easeTo({bearing:0,around:bearAround(),duration:450})});
document.addEventListener('pointerdown',e=>{const pop=$('#bearPop');if(pop&&!pop.hidden&&!e.target.closest('#bearPop,#compassBtn'))bearPop(false)});
/* ---- 바꿔 끼우기 + 실패하면 약도로 ---- */
var GLWAIT=0,SVGFN=null;
function glFail(why){if(!SVGFN)return;console.warn('3D 지도를 못 불러와서 약도로 보여 줘요:',why);clearTimeout(GLWAIT);
  try{MAP&&MAP.remove()}catch(e){}MAP=null;MAPREADY=false;(MK||[]).forEach(m=>m.remove());MK=[];
  ({initMap,visibleRect,fitTo,fitDefault,zoomBtn,setView,drawDyn,toggleTilt,relayoutTilt,billboard}=SVGFN);SVGFN=null;
  mapEl.classList.remove('gl');bearPop(false);const b=$('#tiltBtn');if(b){b.textContent='2D';b.setAttribute('aria-pressed',false)}
  initMap();drawDyn();focusSel()}
if(window.maplibregl&&(!maplibregl.supported||maplibregl.supported())){
  SVGFN={initMap,visibleRect,fitTo,fitDefault,zoomBtn,setView,drawDyn,toggleTilt,relayoutTilt,billboard};
  mapEl.classList.add('gl');
  initMap=()=>{try{gl_initMap();MAP.on('error',e=>{if(!MAPREADY&&e&&e.error&&/style|Failed to fetch|NetworkError/i.test(String(e.error.message||e.error)))glFail(e.error)});
    GLWAIT=setTimeout(()=>{if(!MAPREADY)glFail('시간 초과')},10000)}catch(e){glFail(e)}};
  visibleRect=gl_visibleRect;fitTo=gl_fitTo;fitDefault=gl_fitDefault;zoomBtn=gl_zoomBtn;setView=gl_setView;drawDyn=gl_drawDyn;
  toggleTilt=gl_toggleTilt;relayoutTilt=()=>{};billboard=()=>{};
}
