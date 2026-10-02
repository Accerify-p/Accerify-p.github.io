const c=document.getElementById('c'),g=c.getContext('2d');
const dom={menu:ovMenu,board:ovBoard,over:ovOver,boardTable:boardTable,overBoard:overBoard,
 overStat:overStat,hScore:hScore,hMeta:hMeta,hXp:hXp,hLives:hLives,hBossCd:hBossCd,
 skill:skillBtn,bossBar:bossBar,bossLabel:bossLabel};

let W,H,gy,stars=[],parts=[],now=0,keys={};
function rs(){W=c.width=innerWidth;H=c.height=innerHeight;gy=H-60;stars=[];for(let i=0;i<70;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+.3,s:Math.random()*1.2+.3})}
rs();addEventListener('resize',rs);

let ac,mu,bgm=null;
function au(){
 if(!ac){
  ac=new(window.AudioContext||window.webkitAudioContext)();
  mu=ac.createGain();
  mu.gain.value=.026;
  mu.connect(ac.destination);
  let o=ac.createOscillator();
  o.type='triangle';
  o.frequency.value=70;
  o.connect(mu);
  o.start();
  let l=ac.createOscillator();
  l.frequency.value=.13;
  let lg=ac.createGain();
  lg.gain.value=15;
  l.connect(lg);
  lg.connect(o.frequency);
  l.start();
 }
 if(ac.state==='suspended')ac.resume();
 if(!bgm||bgm.paused)playBgm();
}
function playBgm(){
 if(!bgm){
  bgm=new Audio('bgm.mp3');
  bgm.loop=true;
  bgm.volume=.4;
  bgm.addEventListener('error',()=>console.warn('bgm.mp3 加载失败'));
 }
 bgm.play().catch(e=>console.warn('BGM 被拦截:',e.message));
}
function bp(f,d,v,type,slide){
 if(!ac)return;
 let o=ac.createOscillator(),n=ac.createGain();
 o.type=type||'sine';
 o.frequency.setValueAtTime(f,ac.currentTime);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(slide,20),ac.currentTime+d);
 n.gain.setValueAtTime(0,ac.currentTime);
 n.gain.linearRampToValueAtTime(v||.03,ac.currentTime+.006);
 n.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);
 o.connect(n);n.connect(ac.destination);
 o.start();
 o.stop(ac.currentTime+d+.04);
}
function burst(x,y,co,n,sp){if(parts.length>90)return;sp=sp||3.2;n=Math.min(n,10);for(let i=0;i<n;i++){let a=Math.random()*6.28,s=1+Math.random()*sp;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,co,r:2+Math.random()*2})}}

const cfg={
 s:{sc:10,co:'#f55',hp:3},d:{sc:15,co:'#f88',hp:4},t:{sc:20,co:'#fa5',hp:5},
 h:{sc:25,co:'#c6f',hp:6},r:{sc:25,co:'#ff3',hp:7},w:{sc:30,co:'#8cf',hp:8},
 a:{sc:30,co:'#4fa',hp:8},p:{sc:40,co:'#f6a',hp:10},
 x:{sc:35,co:'#f9c',hp:5},v:{sc:35,co:'#9cf',hp:6}};
const pools=[
 ['s','s','d','d','t','t','t'],
 ['s','d','t','t','t','h','h','h','r','r','w','w','w','x','v'],
 ['s','d','t','t','h','h','h','r','r','r','w','w','w','a','a','a','p','p','p','x','x','v','v']];
const dn=['简单','中等','困难'],dd=[.75,1,1.3],dc=[1.5,1,.8];
const LV_STEP=320,BOSS_TIME=60;

let diff=0,state='menu',prevLv=1;
let p={x:0,y:0,r:16},bullets=[],enemies=[],eb=[],score=0,fireT=0,spT=0,hold=false,
 lives=3,maxLives=7,inv=0,sh=0,cd=0,kills=0,tm=0,boss=null,bossSpawned=false,warnT=0,healFx=0;

function reset(){p.x=W/2;p.y=H-90;bullets=[];enemies=[];eb=[];parts=[];score=0;fireT=0;spT=0;lives=3;inv=0;sh=0;cd=0;kills=0;tm=0;boss=null;bossSpawned=false;warnT=0;healFx=0;prevLv=1}
reset();

function setState(s){
 state=s;
 dom.menu.classList.toggle('show',s==='menu');
 dom.board.classList.toggle('show',s==='board');
 dom.over.classList.toggle('show',s==='over');
 if(s==='board'||s==='over'){
  const bd=board();
  const html=bd.length?boardHTML(bd):'<div class="empty">暂无记录</div>';
  if(s==='board')dom.boardTable.innerHTML=html;else dom.overBoard.innerHTML=html;
 }
}
function boardHTML(bd){
 let h='<div class="row head"><span>#</span><span>分数</span><span>难度</span><span>存活</span></div>';
 bd.forEach((r,i)=>{
  const cls=i===0?'r1':i===1?'r2':i===2?'r3':'';
  h+=`<div class="row"><span class="${cls}">${i+1}.</span><span>${r.score}</span><span>${r.diff}</span><span>${r.time}s</span></div>`;
 });
 return h;
}
function board(){try{return JSON.parse(localStorage.getItem('planeTop10')||'[]')}catch(e){return[]}}
function saveScore(){let b=board();b.push({score,kills,time:+tm.toFixed(1),diff:dn[diff]});b.sort((a,b)=>b.score-a.score);localStorage.setItem('planeTop10',JSON.stringify(b.slice(0,10)))}

function use(){if(cd<=0&&sh<=0&&state==='play'){sh=300;cd=1200;bp(380,.32,.04,'sine',950);burst(p.x,p.y,'#4af',14,5)}}
dom.skill.onclick=e=>{e.preventDefault();au();use()};
document.querySelectorAll('[data-d]').forEach(btn=>{
 btn.onclick=()=>{au();diff=+btn.dataset.d;reset();setState('play');playBgm()};
});
document.querySelectorAll('[data-a]').forEach(btn=>{
 btn.onclick=()=>{au();setState(btn.dataset.a==='board'?'board':'menu');playBgm()};
});

function setPos(x,y,off){p.x=Math.max(p.r,Math.min(W-p.r,x));p.y=Math.max(p.r,Math.min(H-p.r,y-off))}
c.addEventListener('touchstart',e=>{e.preventDefault();au();if(state!=='play')return;const t=e.touches[0];hold=true;setPos(t.clientX,t.clientY,50)},{passive:false});
c.addEventListener('touchmove',e=>{e.preventDefault();if(hold&&state==='play'){const t=e.touches[0];setPos(t.clientX,t.clientY,50)}},{passive:false});
c.addEventListener('touchend',e=>{e.preventDefault();hold=false},{passive:false});
c.addEventListener('mousedown',e=>{au();if(state!=='play')return;hold=true;setPos(e.clientX,e.clientY,0)});
c.addEventListener('mousemove',e=>{if(hold&&state==='play')setPos(e.clientX,e.clientY,0)});
addEventListener('mouseup',()=>hold=false);
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();keys[k]=true;
 if(k===' '||k==='j'||k==='k'){e.preventDefault();au();use()}
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});

function efire(e){let sp=3.3+score/1200,t=e.type;
if(t=='s')eb.push({x:e.x,y:e.y+e.r,vx:0,vy:sp});
else if(t=='d'){eb.push({x:e.x-8,y:e.y+e.r,vx:0,vy:sp});eb.push({x:e.x+8,y:e.y+e.r,vx:0,vy:sp})}
else if(t=='t')for(let a=-.3;a<=.31;a+=.3)eb.push({x:e.x,y:e.y+e.r,vx:Math.sin(a)*sp,vy:Math.cos(a)*sp});
else if(t=='h'){let dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;eb.push({x:e.x,y:e.y+e.r,vx:dx/d*sp*.85,vy:dy/d*sp*.85})}
else if(t=='r')for(let a=0;a<6.28;a+=1.57)eb.push({x:e.x,y:e.y,vx:Math.cos(a)*sp*.6,vy:Math.sin(a)*sp*.6});
else if(t=='w')for(let i=-1;i<2;i++)eb.push({x:e.x+i*22,ox:e.x+i*22,y:e.y+e.r,vx:0,vy:sp*.9,ph:i*1.2,ty:'w'});
else if(t=='a')eb.push({x:e.x,y:e.y+e.r,vx:0,vy:sp*.5,ty:'a'});
else if(t=='x'){for(let a=0;a<4;a++){let ang=Math.PI/4+a*Math.PI/2;eb.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp*.8,vy:Math.sin(ang)*sp*.8,co:'#f9c'})}}
else if(t=='v'){for(let a=-.5;a<=.51;a+=.5)eb.push({x:e.x,y:e.y+e.r,vx:Math.sin(a)*sp,vy:Math.cos(a)*sp,co:'#9cf'})}
else eb.push({x:e.x,y:e.y+e.r,vx:0,vy:sp*.75,life:42,ty:'p'})}

function spawnBoss(){let per=[400,600,850][diff];boss={x:W/2,y:-120,r:70,phase:0,phases:3,phaseHp:per,phaseMax:per,t:0,cd:60,dir:1,flash:0};warnT=120;bp(70,.8,.065,'sawtooth',35)}
function updateBoss(dt){
 if(!boss)return;
 boss.t+=dt;
 if(boss.y<110)boss.y+=1.8*dt;
 else{boss.x+=boss.dir*(1+boss.phase*0.5)*dt;
  if(boss.x>W-boss.r){boss.x=W-boss.r;boss.dir=-1}
  if(boss.x<boss.r){boss.x=boss.r;boss.dir=1}}
 if(boss.flash>0)boss.flash-=dt;
 if(boss.y>60){boss.cd-=dt;if(boss.cd<=0)bossFire()}}
function bossFire(){
 const sp=3.3+diff*0.4,dx=p.x-boss.x,dy=p.y-boss.y,base=Math.atan2(dy,dx),r=Math.random();
 if(boss.phase===0){
  if(r<0.4){for(let a=-0.7;a<=0.71;a+=0.35)eb.push({x:boss.x,y:boss.y+20,vx:Math.cos(base+a)*sp,vy:Math.sin(base+a)*sp,big:1,co:'#f6a'});boss.cd=42}
  else if(r<0.75){for(let i=0;i<14;i++){let a=boss.t*0.04+i*6.28/14;eb.push({x:boss.x,y:boss.y,vx:Math.cos(a)*sp*0.8,vy:Math.sin(a)*sp*0.8,big:1,co:'#c6f'})}boss.cd=46}
  else{for(let i=0;i<6;i++){let a=i*6.28/6+boss.t*0.08;for(let k=0;k<2;k++)eb.push({x:boss.x,y:boss.y,vx:Math.cos(a+k*3.14)*sp*.9,vy:Math.sin(a+k*3.14)*sp*.9,big:1,co:'#ff3'})}boss.cd=50}
 }else if(boss.phase===1){
  if(r<0.3){for(let i=0;i<22;i++){let a=boss.t*0.06+i*6.28/22;eb.push({x:boss.x,y:boss.y,vx:Math.cos(a)*sp*0.9,vy:Math.sin(a)*sp*0.9,big:1,co:'#c6f'})}boss.cd=44}
  else if(r<0.55){for(let a=-0.5;a<=0.51;a+=0.15)eb.push({x:boss.x,y:boss.y+20,vx:Math.cos(base+a)*sp*1.1,vy:Math.sin(base+a)*sp*1.1,big:1,co:'#ff3'});boss.cd=40}
  else if(r<0.8){for(let i=-1;i<=1;i++){let off=i*30;eb.push({x:boss.x+off,ox:boss.x+off,y:boss.y+20,vx:0,vy:sp*0.9,ph:i*1.5,ty:'w',big:1,co:'#8cf'})}boss.cd=44}
  else{for(let i=-1;i<=1;i++){let a=base+i*0.25;eb.push({x:boss.x,y:boss.y+20,vx:Math.cos(a)*sp*1.3,vy:Math.sin(a)*sp*1.3,big:1,co:'#f55'})}boss.cd=46}
 }else{
  if(r<0.25){for(let i=0;i<8;i++){let a=boss.t*0.18+i*6.28/8;eb.push({x:boss.x,y:boss.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,big:1,co:'#f55'})}for(let a=-0.25;a<=0.26;a+=0.12)eb.push({x:boss.x,y:boss.y+20,vx:Math.cos(base+a)*sp*1.35,vy:Math.sin(base+a)*sp*1.35,big:1,co:'#ff3'});boss.cd=36}
  else if(r<0.5){for(let i=0;i<30;i++){let a=boss.t*0.08+i*6.28/30;eb.push({x:boss.x,y:boss.y,vx:Math.cos(a)*sp*0.95,vy:Math.sin(a)*sp*0.95,big:1,co:'#f6a'})}boss.cd=42}
  else if(r<0.75){for(let a=-0.7;a<=0.71;a+=0.15)eb.push({x:boss.x,y:boss.y+20,vx:Math.cos(base+a)*sp*1.2,vy:Math.sin(base+a)*sp*1.2,big:1,co:'#ff3'});for(let i=0;i<10;i++){let a=boss.t*0.14+i*6.28/10;eb.push({x:boss.x,y:boss.y,vx:Math.cos(a)*sp*0.6,vy:Math.sin(a)*sp*0.6,big:1,co:'#f55'})}boss.cd=38}
  else{for(let i=-1;i<=1;i++)eb.push({x:boss.x+i*45,y:boss.y+20,vx:0,vy:sp*2.1,big:1,co:'#ff0'});boss.cd=34}}
 bp(240,.07,.013,'sine',190)}
function hurt(){if(inv>0||state!=='play'||sh>0)return;lives--;inv=90;bp(150,.22,.045,'triangle',70);burst(p.x,p.y,'#f66',10,4);if(lives<=0){state='over';saveScore();dom.overStat.textContent=`难度 ${dn[diff]} · 得分 ${score} · 击败 ${kills} · 存活 ${tm.toFixed(1)}s`;setState('over');if(bgm){bgm.pause();bgm.currentTime=0}}}

let hudCache={};
function updateHUD(){
 const lv=1+Math.floor(score/LV_STEP),dmg=Math.min(5,1+Math.floor((lv-1)/2)),ep=(score%LV_STEP)/LV_STEP;
 if(hudCache.score!==score){dom.hScore.textContent=score;hudCache.score=score}
 const mt=`Lv${lv} · DMG${dmg} · ${dn[diff]} · 击败${kills} · ${tm.toFixed(1)}s`;
 if(hudCache.meta!==mt){dom.hMeta.textContent=mt;hudCache.meta=mt}
 if(hudCache.ep!==ep){dom.hXp.style.width=(ep*100)+'%';hudCache.ep=ep}
 if(hudCache.lives!==lives){
  let h='';for(let i=0;i<maxLives;i++)h+=`<span class="${i<lives?'':'off'}">♥</span>`;
  dom.hLives.innerHTML=h;hudCache.lives=lives}
 const st=sh>0?'shield':(cd>0?'cool':'');
 if(hudCache.skill!==st){dom.skill.className=st;hudCache.skill=st}
 const stt=sh>0?Math.ceil(sh/60):(cd>0?Math.ceil(cd/60):'⚡');
 if(hudCache.stt!==stt){dom.skill.textContent=stt;hudCache.stt=stt}
 if(boss){
  if(!hudCache.bossShow){dom.bossBar.classList.add('show');dom.bossLabel.classList.add('show');hudCache.bossShow=true}
  const segs=dom.bossBar.children;
  for(let i=0;i<3;i++){
   const seg=segs[i],bar=seg.querySelector('i');
   if(i<boss.phase){seg.classList.add('done');bar.style.width='0%'}
   else if(i===boss.phase){seg.classList.remove('done');bar.style.width=(boss.phaseHp/boss.phaseMax*100)+'%'}
   else{seg.classList.remove('done');bar.style.width='100%'}}
  const bl=`BOSS 阶段 ${boss.phase+1}/3`;
  if(hudCache.bl!==bl){dom.bossLabel.textContent=bl;hudCache.bl=bl}
 }else if(hudCache.bossShow){dom.bossBar.classList.remove('show');dom.bossLabel.classList.remove('show');hudCache.bossShow=false}
 const cdt=(!boss&&!bossSpawned&&tm<BOSS_TIME)?`BOSS 倒计时 ${(BOSS_TIME-tm).toFixed(1)}s`:'';
 if(hudCache.cdt!==cdt){dom.hBossCd.textContent=cdt;hudCache.cdt=cdt}
}

let last=0;
function loop(ts){
 if(!last)last=ts;let dt=Math.min((ts-last)/16.67,3);last=ts;now=ts;
 for(let i=0;i<stars.length;i++){let s=stars[i];s.y+=s.s*dt;if(s.y>H)s.y=0}
 for(let i=parts.length-1;i>=0;i--){let pt=parts[i];pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.life-=.05*dt;if(pt.life<=0)parts.splice(i,1)}
 if(state==='play'){
  tm+=dt/60;
  let spd=7;
  if(keys['w']||keys['arrowup'])p.y-=spd*dt;
  if(keys['s']||keys['arrowdown'])p.y+=spd*dt;
  if(keys['a']||keys['arrowleft'])p.x-=spd*dt;
  if(keys['d']||keys['arrowright'])p.x+=spd*dt;
  if(keys['w']||keys['s']||keys['a']||keys['d']||keys['arrowup']||keys['arrowdown']||keys['arrowleft']||keys['arrowright']){
   p.x=Math.max(p.r,Math.min(W-p.r,p.x));p.y=Math.max(p.r,Math.min(H-p.r,p.y))}
  if(inv>0)inv-=dt;if(sh>0)sh-=dt;if(cd>0)cd-=dt;if(warnT>0)warnT-=dt;if(healFx>0)healFx-=dt;
  let lv=1+Math.floor(score/LV_STEP);
  if(lv>prevLv){if(lv>6&&lives<maxLives){lives++;healFx=30;bp(880,.28,.038,'sine',1600)}prevLv=lv}
  let fireGap=Math.max(3,11-Math.min(lv*1.4,8));
  let dmg=Math.min(5,1+Math.floor((lv-1)/2));
  let hpMul=1+Math.floor(score/2500);
  fireT+=dt;
  if(fireT>fireGap){fireT=0;
   let n=Math.min(lv,2);
   for(let i=0;i<n;i++){let off=(i-(n-1)/2)*13;bullets.push({x:p.x+off,y:p.y-p.r,vx:off*.12,dmg:dmg})}
   bp(660,.06,.016,'sine',480)}
  if(!boss&&!bossSpawned&&tm>=BOSS_TIME)spawnBoss();
  if(!bossSpawned){
   spT+=dt;
   if(spT>Math.max(32,88-score/100)/dd[diff]){spT=0;
    let s=14+Math.random()*14;
    if(Math.random()<0.12){let h=2*hpMul;
     enemies.push({x:s+Math.random()*(W-2*s),y:-s,r:s+4,v:.9+Math.random()*.3,cd:999,type:'s',ph:Math.random()*6.28,hp:h,maxHp:h,flash:0,heal:1})}
    else if(!boss){const type=pools[diff][Math.floor(Math.random()*pools[diff].length)];let h=cfg[type].hp*hpMul;
     enemies.push({x:s+Math.random()*(W-2*s),y:-s,r:s,v:1.1+Math.random()*.8+Math.min(score/900,1),cd:45+Math.random()*45,type,ph:Math.random()*6.28,hp:h,maxHp:h,flash:0})}}}
  for(let i=0;i<enemies.length;i++){let e=enemies[i];
   e.cd-=dt;e.ph+=.05*dt;e.x+=Math.sin(e.ph)*2.2*dt;
   if(e.flash>0)e.flash-=dt;
   if(e.x<e.r)e.x=e.r;if(e.x>W-e.r)e.x=W-e.r;
   if(e.cd<=0&&e.y>0){let lateBonus=Math.min(score/3000,2);e.cd=(Math.max(34,70-score/300-lateBonus)+Math.random()*14)*dc[diff];efire(e)}}
  updateBoss(dt);
  for(let i=0;i<bullets.length;i++){let b=bullets[i];b.y-=10*dt;b.x+=b.vx*dt}
  for(let i=0;i<enemies.length;i++)enemies[i].y+=enemies[i].v*dt;
  for(let i=0;i<eb.length;i++){let b=eb[i];
   if(b.ty=='w'){b.ph+=.2*dt;b.y+=b.vy*dt;b.x=b.ox+Math.sin(b.ph)*25}
   else if(b.ty=='a'){b.vy+=.16*dt;b.y+=b.vy*dt}
   else if(b.ty=='p'){b.life-=dt;b.y+=b.vy*dt;if(b.life<=0&&!b.dead){b.dead=true;for(let a=-.5;a<=.5;a+=.5)eb.push({x:b.x,y:b.y,vx:Math.sin(a)*3.2,vy:Math.cos(a)*3.5})}}
   else{b.x+=b.vx*dt;b.y+=b.vy*dt}}
  bullets=bullets.filter(b=>b.y>-10);
  enemies=enemies.filter(e=>{if(e.y+e.r>gy){if(!e.heal)hurt();return false}return e.y<H+e.r+20});
  eb=eb.filter(b=>!b.dead&&b.y<H+20&&b.y>-60&&b.x>-40&&b.x<W+40);
  for(let i=bullets.length-1;i>=0;i--){let b=bullets[i],hit=false;
   for(let j=enemies.length-1;j>=0;j--){let e=enemies[j];
    if(Math.hypot(b.x-e.x,b.y-e.y)<e.r+3){
     bullets.splice(i,1);e.hp-=b.dmg;e.flash=6;
     burst(b.x,b.y,'#4df',3);bp(1400,.02,.006,'sine',1100);
     if(e.hp<=0){
      if(e.heal){if(lives<maxLives){lives++;healFx=30}burst(e.x,e.y,'#4f8',14,5);bp(880,.28,.038,'sine',1600)}
      else{score+=cfg[e.type].sc;burst(e.x,e.y,cfg[e.type].co,10,4);bp(780,.1,.022,'triangle',1100)}
      kills++;enemies.splice(j,1)}
     hit=true;break}}
   if(hit)continue}
  if(boss&&boss.y>-boss.r){
   for(let i=bullets.length-1;i>=0;i--){let b=bullets[i];
    if(Math.hypot(b.x-boss.x,b.y-boss.y)<boss.r+4){
     bullets.splice(i,1);boss.phaseHp-=b.dmg;boss.flash=5;
     burst(b.x,b.y,'#4df',3);bp(1400,.025,.008,'sine',1000);
     if(boss.phaseHp<=0){
      boss.phase++;
      if(boss.phase>=boss.phases){
       score+=800;kills++;
       burst(boss.x,boss.y,'#f6a',30,8);burst(boss.x,boss.y,'#ff3',20,6);
       bp(95,1,.07,'sawtooth',30);boss=null;bossSpawned=true;break}
      else{boss.phaseHp=boss.phaseMax;bp(200,.45,.048,'sawtooth',400);burst(boss.x,boss.y,'#f6a',25,7);boss.cd=30}}}}}
  for(let i=0;i<enemies.length;i++){let e=enemies[i];if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r-4)hurt()}
  if(boss&&Math.hypot(p.x-boss.x,p.y-boss.y)<boss.r+p.r)hurt();
  for(let i=0;i<eb.length;i++){let b=eb[i];if(Math.hypot(p.x-b.x,p.y-b.y)<p.r+(b.big?7:4))hurt()}
 }
 updateHUD();

 g.fillStyle='#05070f';g.fillRect(0,0,W,H);
 let gr=g.createRadialGradient(W/2,H*.25,40,W/2,H*.25,W);
 gr.addColorStop(0,'rgba(40,80,170,.28)');gr.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.fillStyle='#cfe';
 for(let i=0;i<stars.length;i++){let s=stars[i];g.globalAlpha=.25+s.s/2.8;g.beginPath();g.arc(s.x,s.y,s.r,0,6.284);g.fill()}
 g.globalAlpha=1;

 if(state!=='play'){requestAnimationFrame(loop);return}

 g.globalCompositeOperation='lighter';
 for(let i=0;i<parts.length;i++){let pt=parts[i];g.globalAlpha=pt.life*.8;g.fillStyle=pt.co;
  g.beginPath();g.arc(pt.x,pt.y,(pt.r||3)*pt.life,0,6.284);g.fill()}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
 g.shadowBlur=12;g.shadowColor='#f80';g.strokeStyle='#f80';g.lineWidth=3;
 g.beginPath();g.moveTo(0,gy);g.lineTo(W,gy);g.stroke();g.shadowBlur=0;
 for(let i=0;i<bullets.length;i++){let b=bullets[i];
  let bs=2.5+b.dmg*0.5;
  g.fillStyle='#bff';g.shadowBlur=12+b.dmg*2;g.shadowColor='#4df';
  g.beginPath();g.ellipse(b.x,b.y-8,bs,10+b.dmg,0,0,6.284);g.fill();
  g.fillStyle='#4df';g.globalAlpha=.6;g.shadowBlur=0;
  g.beginPath();g.ellipse(b.x,b.y-8,bs*2,15+b.dmg*1.5,0,0,6.284);g.fill();g.globalAlpha=1}
 g.shadowBlur=0;
 for(let i=0;i<enemies.length;i++){let e=enemies[i];
  g.save();g.translate(e.x,e.y);
  let co=e.flash>0?'#fff':(e.heal?'#4f8':cfg[e.type].co);
  if(e.heal){g.globalCompositeOperation='lighter';g.globalAlpha=.4;
   g.fillStyle='#4f8';g.beginPath();g.arc(0,0,e.r*1.6,0,6.284);g.fill();
   g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  g.globalAlpha=.45+.55*(e.hp/e.maxHp);
  g.fillStyle=co;g.shadowBlur=14;g.shadowColor=co;
  let r=e.r;
  if(e.heal){g.beginPath();for(let k=0;k<12;k++){let a=k*Math.PI/6;let rr=k%2===0?r:r*.55;g[k===0?'moveTo':'lineTo'](Math.cos(a)*rr,Math.sin(a)*rr)}g.closePath();g.fill();
   g.fillStyle='#0f4';g.beginPath();g.arc(0,0,r*.3,0,6.284);g.fill()}
  else if(e.type==='p'){g.beginPath();for(let k=0;k<10;k++){let a=-Math.PI/2+k*Math.PI/5;let rr=k%2===0?r:r*.5;g[k===0?'moveTo':'lineTo'](Math.cos(a)*rr,Math.sin(a)*rr)}g.closePath();g.fill();
   g.fillStyle='#000a';g.beginPath();g.arc(0,0,r*.3,0,6.284);g.fill()}
  else if(e.type==='r'||e.type==='h'){g.beginPath();g.moveTo(0,-r);g.lineTo(r*.85,0);g.lineTo(0,r);g.lineTo(-r*.85,0);g.closePath();g.fill();
   g.fillStyle='#000a';g.beginPath();g.arc(0,0,r*.35,0,6.284);g.fill()}
  else if(e.type==='w'||e.type==='a'){g.beginPath();for(let k=0;k<6;k++){let a=k*Math.PI/3-Math.PI/2;g[k===0?'moveTo':'lineTo'](Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();
   g.fillStyle='#000a';g.beginPath();g.arc(0,0,r*.32,0,6.284);g.fill()}
  else if(e.type==='x'){g.beginPath();g.moveTo(0,-r);g.lineTo(r*.7,-r*.3);g.lineTo(r*.7,r*.7);g.lineTo(0,r*.3);g.lineTo(-r*.7,r*.7);g.lineTo(-r*.7,-r*.3);g.closePath();g.fill();
   g.fillStyle='#000a';g.beginPath();g.arc(0,0,r*.32,0,6.284);g.fill()}
  else if(e.type==='v'){g.beginPath();g.moveTo(0,-r);g.lineTo(r*.9,r*.6);g.lineTo(r*.4,r*.4);g.lineTo(0,r*.9);g.lineTo(-r*.4,r*.4);g.lineTo(-r*.9,r*.6);g.closePath();g.fill();
   g.fillStyle='#000a';g.beginPath();g.arc(0,0,r*.3,0,6.284);g.fill()}
  else{g.beginPath();g.moveTo(0,r);g.lineTo(-r,-r*.7);g.lineTo(0,-r*.3);g.lineTo(r,-r*.7);g.closePath();g.fill();
   g.fillStyle='#000a';g.beginPath();g.arc(0,0,r*.3,0,6.284);g.fill()}
  g.globalAlpha=1;g.shadowBlur=0;g.restore();
  if(e.maxHp>1){g.fillStyle='#000a';g.fillRect(e.x-e.r,e.y-e.r-8,e.r*2,4);
   g.fillStyle='#4f8';g.fillRect(e.x-e.r,e.y-e.r-8,e.r*2*(e.hp/e.maxHp),4)}}
 if(boss){
  g.save();g.translate(boss.x,boss.y);
  let pulse=1+Math.sin(boss.t*.08)*.08;
  let co=boss.flash>0?'#fff':'#f6a';
  g.globalCompositeOperation='lighter';g.globalAlpha=.35;
  let hg=g.createRadialGradient(0,0,10,0,0,boss.r*2);
  hg.addColorStop(0,'#f6a');hg.addColorStop(1,'rgba(246,106,170,0)');
  g.fillStyle=hg;g.beginPath();g.arc(0,0,boss.r*2*pulse,0,6.284);g.fill();
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
  g.shadowBlur=20;g.shadowColor='#f6a';
  g.strokeStyle=co;g.lineWidth=4;
  g.beginPath();g.arc(0,0,boss.r*.9*pulse,0,6.284);g.stroke();
  g.strokeStyle='#ff3';g.lineWidth=2;
  g.beginPath();g.arc(0,0,boss.r*.65,0,6.284);g.stroke();
  g.fillStyle=co;
  g.beginPath();for(let k=0;k<8;k++){let a=k*Math.PI/4-Math.PI/2;let rr=k%2===0?boss.r:boss.r*.6;g[k===0?'moveTo':'lineTo'](Math.cos(a)*rr,Math.sin(a)*rr)}g.closePath();g.fill();
  let coreCo=boss.phase===0?'#ff3':boss.phase===1?'#f6a':'#f55';
  g.globalCompositeOperation='lighter';
  let cg2=g.createRadialGradient(0,0,2,0,0,boss.r*.55);
  cg2.addColorStop(0,'#fff');cg2.addColorStop(.4,coreCo);cg2.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=cg2;g.beginPath();g.arc(0,0,boss.r*.5+Math.sin(boss.t*.15)*5,0,6.284);g.fill();
  g.globalCompositeOperation='source-over';g.restore()}
 g.globalCompositeOperation='lighter';
 for(let i=0;i<eb.length;i++){let b=eb[i];
  let co=b.co||(b.ty=='w'?'#ff3':b.ty=='a'?'#c6f':b.ty=='p'?'#f6a':'#fa3');
  let r=b.big?6:4;
  let bg=g.createRadialGradient(b.x,b.y,1,b.x,b.y,r*2);
  bg.addColorStop(0,'#fff');bg.addColorStop(.4,co);bg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=bg;g.beginPath();g.arc(b.x,b.y,r*2,0,6.284);g.fill();
  g.fillStyle=co;g.beginPath();g.arc(b.x,b.y,r*.7,0,6.284);g.fill()}
 g.globalCompositeOperation='source-over';
 if(inv<=0||Math.floor(inv/5)%2===0){
  g.save();g.translate(p.x,p.y);
  let fl=9+Math.sin(now*.03)*3;
  g.globalCompositeOperation='lighter';
  let eng=g.createRadialGradient(0,p.r*.4,0,0,p.r*.4,fl);
  eng.addColorStop(0,'#ff0');eng.addColorStop(.5,'#f80');eng.addColorStop(1,'rgba(255,80,0,0)');
  g.fillStyle=eng;g.beginPath();g.arc(0,p.r*.4,fl,0,6.284);g.fill();
  g.globalCompositeOperation='source-over';
  g.shadowBlur=18;g.shadowColor='#6f6';
  g.fillStyle='#3a6';
  g.beginPath();g.moveTo(0,-p.r);g.lineTo(-p.r*1.2,p.r*.5);g.lineTo(-p.r*.5,p.r*.6);g.lineTo(0,p.r*.2);g.lineTo(p.r*.5,p.r*.6);g.lineTo(p.r*1.2,p.r*.5);g.closePath();g.fill();
  g.fillStyle='#6f6';
  g.beginPath();g.moveTo(0,-p.r*1.3);g.lineTo(-p.r*.35,p.r*.3);g.lineTo(-p.r*.5,p.r*.8);g.lineTo(0,p.r*.6);g.lineTo(p.r*.5,p.r*.8);g.lineTo(p.r*.35,p.r*.3);g.closePath();g.fill();
  g.globalCompositeOperation='lighter';
  g.fillStyle='#8ef';g.shadowColor='#8ef';g.shadowBlur=20;
  g.beginPath();g.ellipse(0,-p.r*.3,p.r*.25,p.r*.45,0,0,6.284);g.fill();
  g.globalCompositeOperation='source-over';g.shadowBlur=0;g.restore()}
 if(sh>0){let pl=(300-sh)*.1;
  g.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){
   g.beginPath();g.arc(p.x,p.y,p.r+8+i*7+Math.sin(pl+i)*3,0,6.284);
   g.strokeStyle=i===0?'#8cf':i===1?'#4af':'#25a';
   g.lineWidth=3-i;g.shadowBlur=20;g.shadowColor='#4af';g.stroke()}
  g.globalAlpha=.25;
  let sg=g.createRadialGradient(p.x,p.y,5,p.x,p.y,p.r+30);
  sg.addColorStop(0,'rgba(74,170,255,.6)');sg.addColorStop(1,'rgba(74,170,255,0)');
  g.fillStyle=sg;g.beginPath();g.arc(p.x,p.y,p.r+30,0,6.284);g.fill();
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.shadowBlur=0}
 if(healFx>0){
  g.globalCompositeOperation='lighter';g.globalAlpha=healFx/30;
  g.strokeStyle='#4f8';g.lineWidth=3;g.shadowBlur=25;g.shadowColor='#4f8';
  g.beginPath();g.arc(p.x,p.y,p.r+30-healFx*.6,0,6.284);g.stroke();
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.shadowBlur=0}
 if(warnT>0&&Math.floor(warnT/10)%2===0){
  g.textAlign='center';g.fillStyle='#f55';g.shadowBlur=30;g.shadowColor='#f55';
  g.font='bold 38px sans-serif';g.fillText('WARNING',W/2,H/2);g.shadowBlur=0}
 requestAnimationFrame(loop)}
setState('menu');
requestAnimationFrame(loop);
