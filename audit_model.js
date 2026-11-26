// 계산 모델 검증: index.html 안의 data·model 스크립트만 꺼내 실행해요(화면 코드는 실행하지 않음).
// 사용: node audit_model.js [index.html 경로]   · 네트워크·API 키 필요 없음
const fs = require('fs'), vm = require('vm'), path = require('path');
const file = process.argv[2] || path.join(__dirname, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const pick = id => { const m = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`)); if (!m) throw new Error('script ' + id + ' 없음'); return m[1]; };
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pick('data'), ctx);
vm.runInContext(pick('model'), ctx);
vm.runInContext(`
const assert=(b,msg)=>{if(!b)throw new Error('FAIL: '+msg)};
const sum=a=>a.reduce((s,v)=>s+(v||0),0),mean=a=>sum(a)/a.length,near=(a,b)=>Math.abs(a-b)<1e-6;
let n=0,altN=0,ttN=0;
for(const d of D.days){const C=combOf(d.sub),obs=peakOf(d.sub,d).mx,[a,b]=winOf(d);
  assert(peakOf(d.sub,d).ph>=a&&peakOf(d.sub,d).ph<=b,'피크가 ±2시간 구간 안');
  for(const p of [0,10,20,30,50]){const r=altScenario(d.sub,d,p);
    assert(near(r.moved,r.after.reduce((s,v,i)=>s+v-d.sub[NB[i][0]][r.ph],0)),'대체 역: 옮긴 인원 = 4개 역 증가분 합');
    assert(r.after.every((v,i)=>v<=UMAX[NB[i][0]]+1e-6||d.sub[NB[i][0]][r.ph]>UMAX[NB[i][0]]),'대체 역: 참고 상한 넘게 배분하지 않음');
    assert(r.unallocated>=-1e-8,'미배분은 음수가 아님');if(p===0)assert(r.peak===obs,'0%면 관측 피크 그대로');altN++}
  if(stagger(C,SBC,d,0)){n++;for(const m of [0,15,30,60,90,120]){const r=stagger(C,SBC,d,m);
    assert(Math.abs(sum(C)-sum(r.nw)-r.overflow)<1e-6,'종료 조정: 인원 보존(자정 이후 overflow 포함)');
    if(m===0)assert(r.nw.every((v,i)=>v===C[i]||Math.abs(v-C[i])<1e-6),'0분이면 관측값 그대로')}}}
// 시각표: 모든 열차의 행선지가 그 방향 쪽에 있는지
for(const k of Object.keys(M.tt))for(const dt of Object.keys(M.tt[k]))for(const dir of Object.keys(M.tt[k][dt])){const ln=SK[k].ln,o=M.lines[ln].order,si=o.indexOf(SK[k].n);
  for(const r of M.tt[k][dt][dir]){assert((o.indexOf(M.dests[r[1]])-si)*M.lines[ln][dir]>0,'시각표 방향');ttN++}}
console.log('PASS:',D.days.length,'공연일 ·',n,'일 종료 조정 대상 ·',altN,'건 대체 역 검사 ·',ttN,'개 열차 방향 검사');
const s=summary(),f=x=>(x*100).toFixed(1)+'%';
console.log('관측: 평균 피크',s.peak.toFixed(1),'명 · 평일 같은 시간 대비',s.ratio.toFixed(2),'배 · 종료 간격 0분',s.g0.n,'일',s.g0.v.toFixed(1),'vs 60분 이상',s.g60.n,'일',s.g60.v.toFixed(1),'→ 차이',f(1-s.g60.v/s.g0.v));
for(const m of [30,60,90])console.log('종료',m,'분 조정: 대상',s.shift[m].n,'일',s.shift[m].before.toFixed(1),'→',s.shift[m].after.toFixed(1),'감소',f(1-s.shift[m].after/s.shift[m].before));
for(const p of [10,20,30])console.log('대체 역',p,'%:',s.base.toFixed(1),'→',s.alt[p].after.toFixed(1),'감소',f(1-s.alt[p].after/s.base),'· 미배분 있는 날',s.alt[p].unalloc);
for(const u of [false,true]){const r=looCheck(u);console.log('새 일정 미리보기(유사 사례 7일, 한 날씩 빼고 시험'+(u?', 예상 관객 수 입력':'')+'): 범위 안',f(r.cov),'· 중앙값 오차',f(r.medErr),'· 30% 이내',f(r.w30),'· 피크 시간대 일치',f(r.h0),'/ ±1시간',f(r.h1))}
`, ctx);
