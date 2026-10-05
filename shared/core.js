'use strict';
/* ===================== CONFIG (ปรับบาลานซ์ตรงนี้) ===================== */
const W=1280,H=720,GY0=440,GY1=610,CHX=215;
const CFG={
  waves:20,classWave:5,
  churchHp:n=>650+150*n,
  countMul:{1:.45,2:.7,3:.9,4:1},      // จำนวนมอนตามจำนวนผู้เล่น
  bossHpMul:{1:.38,2:.72,3:.88,4:1},   // เลือดบอสตามจำนวนผู้เล่น
  hpGrow:.09,dmgGrow:.035,            // มอนแรงขึ้นต่อเวฟ
  firstDelay:6,intermission:4,
  reviveTime:4.5,reviveSupport:3,reviveHp:.4,reviveBetween:true,reviveBetweenHp:.5,
  shareDmg:.5,                         // EXP: 70% ตามดาเมจที่ทำ / 30% หารเท่ากันทุกคนที่ยังรอด
  maxLvl:12,maxSkill:5,hpPerLvl:.08,dmgPerLvl:.06
};
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const hyp=Math.hypot;
function lerpC(a,b,t){const ar=a>>16&255,ag=a>>8&255,ab=a&255,br=b>>16&255,bg=b>>8&255,bb=b&255;return((ar+(br-ar)*t)<<16)|((ag+(bg-ag)*t)<<8)|(ab+(bb-ab)*t);}

/* ===================== DATA ===================== */
const CLS={
  archer:{name:'นักธนู',icon:'🏹',col:0x8fd18a,css:'#8fd18a',hp:120,mp:100,regen:4.5,range:540,dmg:11,rate:.62,spd:950,pk:'arrow',pr:5,role:'ยิงต่อเนื่อง ดาเมจเดี่ยว',dmul:1},
  mage:{name:'นักเวทย์',icon:'🔥',col:0xff7a3c,css:'#ff7a3c',hp:90,mp:150,regen:6,range:500,dmg:16,rate:.95,spd:650,pk:'fire',pr:9,splash:45,role:'AOE ไฟ · บัพดาเมจทีม',dmul:1},
  gunner:{name:'นักแม่นปืน',icon:'🔫',col:0xe8c46a,css:'#e8c46a',hp:105,mp:110,regen:5,range:580,dmg:8,rate:.34,spd:1300,pk:'bullet',pr:4,role:'ยิงรัว ปืนใหญ่ เลเซอร์',dmul:1},
  support:{name:'ซัพพอร์ต',icon:'✨',col:0x7fe0d4,css:'#7fe0d4',hp:110,mp:160,regen:7,range:450,dmg:7,rate:.8,spd:700,pk:'orb',pr:7,role:'ฮีล · ชุบเร็ว · สโลว์',dmul:1.35},
  tank:{name:'แทงค์',icon:'🛡️',col:0x8aa4d6,css:'#8aa4d6',hp:230,mp:90,regen:4,range:360,dmg:8,rate:.9,spd:700,pk:'bolt',pr:8,role:'โล่ · กำแพง · ผลักถอย',dmul:1.4}
};
const EN={
  khamot:{n:'ผีโขมด',hp:22,spd:78,dmg:4,cd:1.1,size:13,exp:3,col:0x7dff9a,h:36},
  krahang:{n:'กระหัง',hp:48,spd:58,dmg:7,cd:1.2,size:17,exp:5,col:0xe6d9b8,hop:1,h:46},
  taihong:{n:'ผีตายโหง',hp:75,spd:44,dmg:11,cd:1.3,size:21,exp:7,col:0xb48cff,h:62},
  pret:{n:'เปรต',hp:280,spd:28,dmg:22,cd:1.6,size:34,exp:20,col:0xc98a5a,h:104},
  krasue:{n:'กระสือ',hp:95,spd:62,dmg:11,cd:1.2,size:18,exp:12,col:0xff6a7a,fly:1,h:30},
  pop:{n:'ปอบ',hp:560,spd:36,dmg:34,cd:1.5,size:42,exp:34,col:0x9a2438,h:100},
  boss1:{n:'เปรตราชา',hp:4800,spd:21,dmg:58,cd:1.8,size:74,exp:200,col:0xe8a04a,boss:1,h:230},
  boss2:{n:'พญาผีแห่งกรุงศรี',hp:16000,spd:19,dmg:85,cd:2,size:88,exp:600,col:0x9a6bff,boss:1,h:250}
};
function waveBoost(w){return w<=4?1.9:(w<=10?1.6:1);}
function waveCount(w,n){return Math.max(1,Math.round(n*CFG.countMul[nP]*waveBoost(w)));}
function waveDef(w){
  const L=[null,
    [['khamot',8]],
    [['khamot',10],['krahang',3]],
    [['khamot',10],['krahang',6]],
    [['khamot',8],['krahang',8],['taihong',3]],
    [['khamot',12],['krahang',8],['taihong',6]],
    [['khamot',10],['krahang',10],['taihong',10]],
    [['khamot',14],['krahang',10],['taihong',12]],
    [['khamot',14],['krahang',10],['taihong',12],['pret',2]],
    [['khamot',20],['taihong',14],['pret',3]],
    [['khamot',10],['taihong',8],['pret',2]]];
  if(w<=10)return{list:L[w],boss:w===10?'boss1':null};
  if(w===20)return{list:[['khamot',16],['taihong',10],['krasue',8],['pret',4],['pop',2]],boss:'boss2'};
  const k=w-10;
  return{list:[['khamot',14+k*2],['taihong',12+k],['krasue',5+k],['pret',3+(k>>1)],['pop',k>>1]].filter(x=>x[1]>0),boss:null};
}

/* ===================== STATE ===================== */
let players=[],enemies=[],projs=[],zones=[],walls=[],fx=[],popups=[],sched=[],spawnQ=[];
let T=0,speed=1,state='menu',wave=0,interT=0,churchHp=1,churchMax=1,ctl=0,targeting=-1;
let nP=1,botsOn=true,botAll=false,classChosen=false,paused=false,shakeAmt=0,churchFlash=0,waveClock=0,bossRef=null,ann=null,chosen=[];
let eid=0;
const YMIN=455,YMAX=618,MV_SPEED=120;
const SLOT={1:[[290,525]],2:[[300,490],[250,570]],3:[[300,470],[250,525],[300,580]],4:[[300,468],[250,512],[300,556],[250,600]]};
const FRONT={1:[0],2:[0,1],3:[0,2,1],4:[0,2,1,3]};
const PRI={tank:0,gunner:1,archer:2,mage:3,support:4};

const C=p=>CLS[p.cls];
const maxHp=p=>Math.round(C(p).hp*(1+CFG.hpPerLvl*(p.lvl-1)))+(T<p.hpBuffUntil?p.hpBuff:0);
const maxMp=p=>C(p).mp+4*(p.lvl-1);
const dm=p=>(1+CFG.dmgPerLvl*(p.lvl-1))*(T<p.buffUntil?p.buffMul:1)*(C(p).dmul||1);
const hm=p=>1+.04*(p.lvl-1);
const expNeed=l=>Math.round(40+30*Math.pow(l-1,1.35));
const expMul=()=>nP/CFG.countMul[nP];
const ecy=m=>m.fly?m.y:m.y-m.size*.8;
const aliveP=()=>players.filter(p=>p.alive);

function later(s,fn){sched.push({at:T+s,fn});}
function pop(x,y,txt,col,sz){if(popups.length>28)popups.shift();popups.push({x,y,txt:String(txt),col:col||'#fff',sz:sz||15,t:0,dur:.85});}
function ring(x,y,col,r1){fx.push({k:'ring',x,y,r0:10,r1:r1||70,col,t:0,dur:.5});}
let shakeEvt=0,netSpeed=1;
function shake(a){shakeAmt=Math.max(shakeAmt,a);shakeEvt=Math.max(shakeEvt,a);}
function toast(m){HK.toast(m);}
function gtoast(m){HK.gtoast(m);}
function announce(t,s,d){ann={t,s,until:T+(d||3)};}

function makePlayer(i){return{i,cls:'archer',bot:false,mv:0,x:-60,y:0,tx:0,ty:0,hp:0,mana:0,lvl:1,exp:0,sp:0,skillLv:[1,1,1,1],cd:[0,0,0,0],atkT:.3,alive:true,
  hpBuff:0,hpBuffUntil:0,buffMul:1,buffUntil:0,rapidUntil:0,invuln:0,flash:0,kills:0,dealt:0,healed:0,deaths:0,rev:null,castAnim:0,recoil:0,botT:rnd(0,.3),slot:i};}

/* ===================== COMBAT HELPERS ===================== */
function shoot(p,ang,o){
  const sp=o.spd||800,x=p.x+Math.cos(ang)*16,y=p.y-28+Math.sin(ang)*16;
  projs.push({x,y,px:x,py:y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,dmg:o.dmg,r:o.r||6,own:p.i,pierce:o.pierce||0,hit:[],life:o.life||1.5,
    col:o.col||0xffffff,kind:o.kind||'bolt',splash:o.splash||0,burn:o.burn||0,kb:o.kb||0,slow:o.slow||0,dead:false});
}
function nearestEnemy(x,y,maxD){let b=null,bd=maxD||1e9;for(const m of enemies){if(m.dead)continue;const d=hyp(m.x-x,ecy(m)-y);if(d<bd){bd=d;b=m;}}return b;}
function aimAng(p){const e=nearestEnemy(p.x,p.y-28,900);if(!e)return 0;return clamp(Math.atan2(ecy(e)-(p.y-28),e.x-p.x),-1.1,1.1);}
function angTo(p,t){return clamp(Math.atan2(t.y-(p.y-28),t.x-p.x),-.9,.9);}
function inAOE(m,x,y,r){const dx=m.x-x;if(m.fly)return Math.abs(dx)<r+m.size;const dy=(m.y-y)*1.7;return dx*dx+dy*dy<(r+m.size)*(r+m.size);}
function aoe(x,y,r,d,p,o){let n=0;for(const m of enemies){if(m.dead)continue;if(inAOE(m,x,y,r)){hurt(m,d,p?p.i:-1,o);n++;}}return n;}
function hurt(m,d,own,o){
  if(m.dead)return;o=o||{};
  const real=Math.min(d,m.hp);m.hp-=d;m.flash=.1;
  const pl=players[own];
  if(pl){m.dmgBy[own]=(m.dmgBy[own]||0)+real;pl.dealt+=real;m.last=own;}
  if(!o.quiet&&(d>=40||Math.random()<.12))pop(m.x+rnd(-8,8),ecy(m)-m.size-6,Math.round(d),d>=60?'#ffd36b':'#ffffff',d>=60?19:14);
  if(o.slow){m.slowUntil=T+(o.slowT||2);m.slowMul=1-o.slow;}
  if(o.burn){m.burnUntil=T+(o.burnT||3);m.burnDps=o.burn;m.burnOwner=own;}
  if(o.kb)m.x=Math.min(1350,m.x+o.kb*(m.boss?.15:1));
  if(m.hp<=0)kill(m);
}
function kill(m){
  if(m.dead)return;m.dead=true;
  fx.push({k:'soul',x:m.x,y:ecy(m),col:m.col,t:0,dur:.9,sz:m.size});
  if(m.boss){shake(14);fx.push({k:'boom',x:m.x,y:m.y,r:m.size*2.2,col:m.col,t:0,dur:.8});}
  const pl=players[m.last];if(pl)pl.kills++;
  giveExp(m);
  if(m.type==='boss1'){for(const p of players)p.sp++;gtoast('เปรตราชาพ่ายแล้ว! ทุกคนได้ +1 แต้มสกิล');}
  if(m===bossRef)bossRef=null;
}
function giveExp(m){
  const pool=m.exp*expMul()/waveBoost(wave),al=aliveP();let tot=0;for(const k in m.dmgBy)tot+=m.dmgBy[k];
  for(const p of players){
    let s=0;
    if(tot>0)s+=pool*CFG.shareDmg*(m.dmgBy[p.i]||0)/tot;else if(al.length&&p.alive)s+=pool*CFG.shareDmg/al.length;
    if(p.alive&&al.length)s+=pool*(1-CFG.shareDmg)/al.length;
    if(s>0)gainExp(p,s);
  }
}
function gainExp(p,a){
  if(p.lvl>=CFG.maxLvl)return;
  let avg=0;for(const q of players)avg+=q.lvl;avg/=players.length||1;
  p.exp+=a*(1+clamp((avg-p.lvl)*.15,0,.6));
  while(p.lvl<CFG.maxLvl&&p.exp>=expNeed(p.lvl)){
    p.exp-=expNeed(p.lvl);p.lvl++;p.sp++;
    if(p.alive){p.hp=Math.min(maxHp(p),p.hp+maxHp(p)*.25);p.mana=maxMp(p);}
    ring(p.x,p.y,0xffe08a,90);pop(p.x,p.y-76,'LEVEL UP!','#ffe08a',20);
  }
  if(p.lvl>=CFG.maxLvl)p.exp=0;
}
function hitPlayer(p,d){
  if(!p.alive||T<p.invuln)return;
  p.hp-=d;p.flash=.14;pop(p.x,p.y-62,Math.round(d),'#ff6b5e',14);gainExp(p,d*(p.cls==='tank'?.07:.03));
  if(p.hp<=0){p.hp=0;p.alive=false;p.rev=null;p.deaths++;ring(p.x,p.y,0xaaaaaa,60);pop(p.x,p.y-70,'ล้มแล้ว!','#ff9a8a',18);
    if(!players.some(q=>q.alive))endGame(false,'ผู้เล่นล้มครบทุกคน');}
}
function healP(q,a,src){
  if(!q.alive)return;const m=maxHp(q),r=Math.max(0,Math.min(a,m-q.hp));q.hp+=r;if(src){src.healed+=r;if(r>0)gainExp(src,r*.05);}
  if(r>.5)pop(q.x,q.y-66,'+'+Math.round(r),'#7ff0a0',14);
  fx.push({k:'heal',x:q.x,y:q.y,t:0,dur:.7});
}
function hitChurch(d){
  if(state==='over')return;
  churchHp-=d;churchFlash=.25;shake(4);
  HK.onChurchHit();
  if(churchHp<=0){churchHp=0;endGame(false,'โบสถ์พังทลาย');}
}

/* ===================== SKILLS ===================== */
const SKILLS={
archer:[
 {n:'ยิงสามทิศ',ic:'🏹',k:'auto',cd:3.2,mp:8,ai:'auto',d:'ยิงลูกศร 3 ดอกเป็นแฉก',
  cast(p,t,l){const a=aimAng(p);for(const o of[-.16,0,.16])shoot(p,a+o,{dmg:(9+4*l)*dm(p),spd:980,col:0xd9f2a8,kind:'arrow'});return true;}},
 {n:'ฝนธนู',ic:'🌧️',k:'point',r:95,cd:9,mp:22,ai:'dense',d:'ฝนลูกศรกระหน่ำพื้นที่ 2 วินาที',
  cast(p,t,l){const d=(5+2.6*l)*dm(p);fx.push({k:'rain',x:t.x,y:t.y,r:95,t:0,dur:2.3,sd:Math.random()*90});
   for(let i=0;i<8;i++)later(.3+.25*i,()=>aoe(t.x,t.y,95,d,p,{quiet:i%2===0}));return true;}},
 {n:'ศรทะลวง',ic:'🎯',k:'aim',cd:6,mp:18,ai:'aim',d:'ลูกศรพลังสูง เจาะทะลุทุกตัวในแนว',
  cast(p,t,l){shoot(p,angTo(p,t),{dmg:(28+13*l)*dm(p),spd:1500,pierce:99,r:9,col:0xfff0b0,life:1.3,kind:'pierce'});return true;}},
 {n:'โฟกัสเร่งยิง',ic:'⚡',k:'self',cd:16,mp:25,ai:'self',d:'ยิงเร็วขึ้น 2 เท่าชั่วคราว',
  cast(p,t,l){p.rapidUntil=T+4.5+l;ring(p.x,p.y,CLS.archer.col,70);return true;}}
],
mage:[
 {n:'ลูกไฟ',ic:'🔥',k:'auto',cd:2.4,mp:12,ai:'auto',d:'ยิงบอลไฟ ระเบิดเป็นวง',
  cast(p,t,l){shoot(p,aimAng(p),{dmg:(30+13*l)*dm(p),spd:700,r:10,splash:75,col:0xff8a3c,kind:'fire',life:1.8});return true;}},
 {n:'อุกกาบาต',ic:'☄️',k:'point',r:115,cd:10,mp:34,ai:'dense',d:'ก้อนไฟจากฟ้า AOE ตรงจุดที่เลือก',
  cast(p,t,l){const d=(70+28*l)*dm(p);fx.push({k:'meteor',x:t.x,y:t.y,r:115,t:0,dur:.9});
   later(.9,()=>{aoe(t.x,t.y,115,d,p,{burn:6+2*l,burnT:3});fx.push({k:'boom',x:t.x,y:t.y,r:115,col:0xff7a2a,t:0,dur:.6});shake(7);});return true;}},
 {n:'ไฟปะทุ',ic:'🌋',k:'point',r:105,cd:12,mp:30,ai:'dense',d:'สร้างพื้นที่ไฟไหม้ ลวกต่อเนื่อง',
  cast(p,t,l){zones.push({kind:'fire',x:t.x,y:t.y,r:105,until:T+4+.5*l,tick:0,dmg:(14+6*l)*dm(p),own:p.i,sd:Math.random()*9});return true;}},
 {n:'เปลวพลัง',ic:'✨',k:'team',cd:22,mp:40,ai:'buff',d:'บัพดาเมจให้ทั้งทีม',
  cast(p,t,l){const mul=1.2+.04*l,dur=8+l;for(const q of players)if(q.alive){q.buffMul=mul;q.buffUntil=T+dur;ring(q.x,q.y,0xff7a3c,60);}
   pop(p.x,p.y-82,'ดาเมจทีม +'+Math.round((mul-1)*100)+'%','#ffb27a',16);return true;}}
],
gunner:[
 {n:'ยิงรัว',ic:'🔫',k:'auto',cd:4,mp:12,ai:'auto',d:'กระสุนหลายนัดติดกัน',
  cast(p,t,l){const a=aimAng(p);for(let i=0;i<8;i++)later(.07*i,()=>{if(p.alive)shoot(p,a+rnd(-.05,.05),{dmg:(5+1.8*l)*dm(p),spd:1500,r:5,col:0xffe08a,kind:'bullet'});});return true;}},
 {n:'ปืนใหญ่',ic:'💣',k:'point',r:90,cd:7,mp:26,ai:'dense',d:'ลูกปืนใหญ่ระเบิดเป็นวง',
  cast(p,t,l){const d=(65+22*l)*dm(p);fx.push({k:'shell',x0:p.x+10,y0:p.y-34,x1:t.x,y1:t.y,t:0,dur:.65});
   later(.65,()=>{aoe(t.x,t.y,90,d,p,{kb:25});fx.push({k:'boom',x:t.x,y:t.y,r:90,col:0xffc060,t:0,dur:.5});shake(5);});return true;}},
 {n:'กระสุนไฟ',ic:'🧨',k:'auto',cd:5,mp:15,ai:'auto',d:'กระสุนแรงสูง ติดไฟเผาต่อ',
  cast(p,t,l){shoot(p,aimAng(p),{dmg:(42+17*l)*dm(p),spd:1200,r:9,burn:8+4*l,col:0xff5a1f,kind:'fire',life:1.4});return true;}},
 {n:'เลเซอร์',ic:'⚡',k:'aim',cd:14,mp:40,ai:'aim',d:'ลำแสงทะลวงเป็นเส้นตรง',
  cast(p,t,l){const a=clamp(Math.atan2(t.y-(p.y-28),t.x-p.x),-.55,.55),x0=p.x+14,y0=p.y-28,dx=Math.cos(a),dy=Math.sin(a),d=(90+32*l)*dm(p);
   fx.push({k:'beam',x0,y0,x1:x0+dx*1400,y1:y0+dy*1400,t:0,dur:.45,col:0xff5a3a});
   later(.12,()=>{for(const m of enemies){if(m.dead)continue;const vx=m.x-x0,vy=ecy(m)-y0;if(vx*dx+vy*dy<0)continue;if(Math.abs(vx*dy-vy*dx)<26+m.size)hurt(m,d,p.i,{});}});
   shake(4);return true;}}
],
support:[
 {n:'บอลหน่วง',ic:'🔮',k:'point',r:105,cd:6,mp:18,ai:'dense',d:'บอลเวทย์ทำดาเมจและทำให้ช้า',
  cast(p,t,l){fx.push({k:'orb',x0:p.x+10,y0:p.y-34,x1:t.x,y1:t.y,t:0,dur:.5,col:0x7fe0d4});
   later(.5,()=>{aoe(t.x,t.y,105,(14+7*l)*dm(p),p,{slow:.5,slowT:3+.5*l});ring(t.x,t.y,0x7fe0d4,105);});return true;}},
 {n:'ฮีลเดี่ยว',ic:'💚',k:'ally',cd:4.5,mp:20,ai:'heal1',d:'ฮีลเพื่อนที่เลือก',
  cast(p,t,l){const q=t.ally;if(!q||!q.alive)return false;healP(q,(45+18*l)*hm(p),p);return true;}},
 {n:'ฮีลหมู่',ic:'💞',k:'team',cd:14,mp:36,ai:'healAll',d:'ฮีลทุกคนทันที (ไม่เยอะ)',
  cast(p,t,l){for(const q of players)if(q.alive)healP(q,(20+8*l)*hm(p),p);return true;}},
 {n:'วงฮีล',ic:'⭕',k:'point',r:125,cd:20,mp:42,ai:'healzone',d:'วงฮีลต่อเนื่องในพื้นที่',
  cast(p,t,l){zones.push({kind:'heal',x:t.x,y:t.y,r:125,until:T+6+.6*l,tick:0,heal:(7+3*l)*hm(p),own:p.i,sd:Math.random()*9});return true;}}
],
tank:[
 {n:'โล่พุ่ง',ic:'🛡️',k:'auto',cd:3.5,mp:10,ai:'auto',d:'ปาโล่พุ่งชนมอนเตอร์ ผลักถอย',
  cast(p,t,l){shoot(p,aimAng(p),{dmg:(22+9*l)*dm(p),spd:900,r:16,pierce:3,kb:55,col:0xaec4ff,kind:'shield',life:1.1});return true;}},
 {n:'กำแพง',ic:'🧱',k:'wall',cd:14,mp:25,ai:'wall',d:'สร้างกำแพงกันผีเดิน (บินข้ามได้)',
  cast(p,t,l){const x=clamp(t.x,380,1100),h=140+70*l;walls.push({x,hp:h,max:h,until:T+5+l});ring(x,GY1-40,0xe8b85a,60);return true;}},
 {n:'พรเสริมเลือด',ic:'❤️',k:'team',cd:20,mp:30,ai:'hpbuff',d:'เพิ่มเลือดสูงสุดให้ทีมชั่วคราว',
  cast(p,t,l){const add=35+14*l;for(const q of players)if(q.alive){
    if(T<q.hpBuffUntil){const df=Math.max(0,add-q.hpBuff);q.hpBuff+=df;q.hp+=df;}else{q.hpBuff=add;q.hp+=add;}
    q.hpBuffUntil=T+10+l;ring(q.x,q.y,0xff6a6a,60);}return true;}},
 {n:'คลื่นสะท้าน',ic:'💥',k:'self',cd:20,mp:40,ai:'shock',d:'ระเบิดพลังด้านหน้า ผีถอยหลังแล้วมึนงง',
  cast(p,t,l){const dur=1.6+.15*l;
   for(const m of enemies){if(m.dead||m.x>p.x+460)continue;hurt(m,(25+10*l)*dm(p),p.i,{});if(m.dead)continue;const bm=m.boss?.35:1;
    m.reverseUntil=T+dur*bm;m.dazeUntil=T+dur*bm+.9*bm;m.x=Math.min(1350,m.x+60*bm);}
   fx.push({k:'ring',x:p.x+10,y:p.y,r0:20,r1:480,col:0xaec4ff,t:0,dur:.6});shake(8);return true;}}
]};

/* ===================== PLAYER CONTROL ===================== */
function upgrade(p,i){if(!p||p.sp<=0||p.skillLv[i]>=CFG.maxSkill)return false;p.sp--;p.skillLv[i]++;ring(p.x,p.y,0xffe08a,60);return true;}
function pickAlly(p,x,y,usePtr){
  const al=aliveP();if(!al.length)return null;
  if(usePtr){let b=null,bd=100;for(const q of al){const d=hyp(q.x-x,(q.y-26)-y);if(d<bd){bd=d;b=q;}}if(b)return b;}
  let w=al[0],r=2;for(const q of al){const f=q.hp/maxHp(q);if(f<r){r=f;w=q;}}return w;
}
function makeTarget(p,s,px,py){
  const has=px!==null&&px!==undefined;
  const t={x:has?px:p.x+320,y:has?py:p.y};
  if(s.k==='point'||s.k==='wall'){t.x=clamp(t.x,120,1240);t.y=clamp(t.y,GY0+10,GY1);}
  if(s.k==='ally')t.ally=pickAlly(p,t.x,t.y,has);
  return t;
}
function tryCast(p,i,t){
  if(!p||!p.alive||p.rev||state==='over')return false;
  const s=SKILLS[p.cls][i];
  if(p.cd[i]>0)return false;
  if(p.mana<s.mp){if(p===players[ctl])toast('มานาไม่พอ');return false;}
  const r=s.cast(p,t||{x:p.x+300,y:p.y},p.skillLv[i]);
  if(r===false)return false;
  p.mana-=s.mp;p.cd[i]=s.cd;p.castAnim=.3;
  return true;
}
function startRevive(p,q){
  if(!p.alive||p.rev)return false;
  const free=players.filter(o=>!o.alive&&!players.some(r=>r.rev&&r.rev.target===o));
  if(!q){if(!free.length){if(p===players[ctl])toast('ไม่มีเพื่อนที่ต้องชุบ');return false;}free.sort((a,b)=>hyp(a.x-p.x,a.y-p.y)-hyp(b.x-p.x,b.y-p.y));q=free[0];}
  else if(!free.includes(q))return false;
  p.rev={target:q,t:0,dur:p.cls==='support'?CFG.reviveSupport:CFG.reviveTime};return true;
}
function stepRevive(p,dt){
  const r=p.rev,q=r.target;if(q.alive){p.rev=null;return;}
  r.t+=dt;
  if(r.t>=r.dur){q.alive=true;q.hp=maxHp(q)*CFG.reviveHp;q.invuln=T+3;q.mana=maxMp(q)*.5;p.rev=null;ring(q.x,q.y,0x9fffb0,100);pop(q.x,q.y-72,'ฟื้นคืนชีพ!','#9fffb0',18);}
}

/* ---- bots (ใช้ทดสอบเล่นหลายคนบนเครื่องเดียว) ---- */
function denseSpot(r,min){
  let best=null,bn=0;
  for(const m of enemies){if(m.dead||m.x>1150)continue;let n=0;for(const o of enemies)if(!o.dead&&inAOE(o,m.x,m.y,r*.8))n++;if(n>bn){bn=n;best=m;}}
  return best&&bn>=min?{x:best.x,y:best.fly?GY0+60:best.y}:null;
}
function botTarget(p,s){
  const en=enemies.filter(m=>!m.dead),near=en.filter(m=>m.x<1100);
  switch(s.ai){
    case 'auto':return nearestEnemy(p.x,p.y-28,650)?{x:p.x+300,y:p.y}:null;
    case 'self':return nearestEnemy(p.x,p.y,520)?{x:p.x,y:p.y}:null;
    case 'aim':{const e=nearestEnemy(p.x,p.y-28,900);return e?{x:e.x,y:ecy(e)}:null;}
    case 'dense':return denseSpot(s.r||100,en.length===1&&en[0].boss?1:2);
    case 'heal1':{let w=null,r=.55;for(const q of players)if(q.alive){const f=q.hp/maxHp(q);if(f<r){r=f;w=q;}}return w?{x:w.x,y:w.y,ally:w}:null;}
    case 'healAll':return players.filter(q=>q.alive&&q.hp<maxHp(q)*.6).length>=2||players.some(q=>q.alive&&q.hp<maxHp(q)*.3)?{x:p.x,y:p.y}:null;
    case 'healzone':{const al=aliveP();if(!al.some(q=>q.hp<maxHp(q)*.75))return null;let sx=0,sy=0;for(const q of al){sx+=q.x;sy+=q.y;}return{x:sx/al.length,y:sy/al.length};}
    case 'buff':return near.length>=4||en.some(m=>m.boss)?{x:p.x,y:p.y}:null;
    case 'wall':{const c=near.filter(m=>!m.fly&&m.x<820&&m.x>430);if(c.length<4||walls.length)return null;c.sort((a,b)=>a.x-b.x);return{x:c[0].x-70,y:525};}
    case 'shock':return en.filter(m=>m.x<p.x+300).length>=3?{x:p.x,y:p.y}:null;
    case 'hpbuff':return near.filter(m=>m.x<800).length>=5?{x:p.x,y:p.y}:null;
  }
  return null;
}
function botThink(p,dt){
  p.botT-=dt;if(p.botT>0)return;p.botT=.3;
  if(p.sp>0){let bi=0;for(let i=1;i<4;i++)if(p.skillLv[i]<p.skillLv[bi])bi=i;upgrade(p,bi);}
  if(!p.rev&&!nearestEnemy(p.x,p.y,260))startRevive(p);
  if(p.rev)return;
  const sk=SKILLS[p.cls];
  for(let i=0;i<4;i++){const s=sk[i];if(p.cd[i]>0||p.mana<s.mp+(s.mp>=30?8:0))continue;const t=botTarget(p,s);if(t&&tryCast(p,i,t))break;}
}

/* ===================== ENEMIES ===================== */
function spawn(type,x,y){
  const d=EN[type],b=!!d.boss;
  const hpm=b?CFG.bossHpMul[nP]:1+CFG.hpGrow*(wave-1);
  const m={id:++eid,type,x:x===undefined?1330+rnd(0,60):x,y:y===undefined?(d.fly?rnd(250,360):rnd(GY0+10,GY1)):y,
    hp:d.hp*hpm,maxHp:0,spd:d.spd*rnd(.92,1.08),dmg:b?d.dmg:d.dmg*(1+CFG.dmgGrow*(wave-1)),dmgMul:1,cd:d.cd,atkT:rnd(0,d.cd),size:d.size,exp:d.exp,col:d.col,
    fly:!!d.fly,hop:!!d.hop,boss:b,name:d.n,h:d.h,age:rnd(0,5),ph:rnd(0,6.28),flash:0,atkAnim:0,slowUntil:0,slowMul:1,dazeUntil:0,reverseUntil:0,
    burnUntil:0,burnDps:0,burnAcc:0,burnOwner:-1,dmgBy:{},last:-1,dead:false,enraged:false,phase:0,summonT:6,boltT:9};
  m.maxHp=m.hp;enemies.push(m);if(b)bossRef=m;return m;
}
function bossStep(m,dt){
  if(m.type==='boss1'){
    if(!m.enraged&&m.hp<m.maxHp*.5){m.enraged=true;m.dmgMul*=1.4;pop(m.x,m.y-m.h-10,'คลุ้มคลั่ง!','#ff5a3a',26);shake(10);gtoast('เปรตราชาคลุ้มคลั่ง!');
      for(let i=0;i<5;i++)spawn('khamot',m.x+rnd(-30,60),rnd(GY0,GY1));}
  }else{
    const ph=m.hp<m.maxHp*.34?2:(m.hp<m.maxHp*.67?1:0);
    if(ph>m.phase){m.phase=ph;shake(10);gtoast('พญาผีเข้าสู่ร่างที่ '+(ph+1));for(let i=0;i<6;i++)spawn('taihong',m.x+rnd(-40,80),rnd(GY0,GY1));}
    m.summonT-=dt;
    if(m.summonT<=0){m.summonT=9-ph*1.8;const n=3+ph*2;for(let i=0;i<n;i++)spawn(Math.random()<.5?'khamot':'taihong',m.x+rnd(-40,80),rnd(GY0,GY1));ring(m.x,m.y,0x9a6bff,160);}
    m.boltT-=dt;
    if(m.boltT<=0&&m.x<1150){m.boltT=12-ph*2;fx.push({k:'bolt',x0:m.x,y0:m.y-110,x1:110,y1:500,t:0,dur:1.6});later(1.6,()=>{if(state!=='over')hitChurch(55+12*ph);});}
  }
}
function stepEnemy(m,dt){
  m.age+=dt;if(m.flash>0)m.flash-=dt;if(m.atkAnim>0)m.atkAnim-=dt;
  if(T<m.burnUntil){m.burnAcc+=dt;if(m.burnAcc>=.5){m.burnAcc-=.5;hurt(m,m.burnDps*.5,m.burnOwner,{quiet:true});if(m.dead)return;}}
  if(m.boss)bossStep(m,dt);
  if(m.dead)return;
  if(T<m.reverseUntil){m.x=Math.min(1360,m.x+m.spd*1.6*dt);return;}
  if(T<m.dazeUntil)return;
  const sl=T<m.slowUntil?m.slowMul:1;
  let spd=m.spd*sl*(m.enraged?1.6:1)*(1+.18*m.phase);
  if(m.hop)spd*=.15+1.9*Math.max(0,Math.sin(m.age*3.2+m.ph));
  let tgt=null,td=1e9;
  for(const p of players){if(!p.alive)continue;const d=hyp(m.x-p.x,m.y-(m.fly?p.y-30:p.y));if(d<td){td=d;tgt=p;}}
  const reach=m.size*.8+36;
  if(!m.fly){for(const w of walls){if(m.x>w.x-4&&m.x-w.x<m.size*.6+16){m.atkT-=dt;if(m.atkT<=0){m.atkT=m.cd;m.atkAnim=.22;w.hp-=m.dmg*.9;}return;}}}
  if(tgt&&td<=reach){m.atkT-=dt;if(m.atkT<=0){m.atkT=m.cd;m.atkAnim=.22;hitPlayer(tgt,m.dmg*m.dmgMul);}return;}
  if(m.x<=CHX+reach*.6){m.atkT-=dt;if(m.atkT<=0){m.atkT=m.cd;m.atkAnim=.22;hitChurch(m.dmg*m.dmgMul*.8);}return;}
  m.x-=spd*dt;
  if(m.x<1100){const gy=tgt?(m.fly?tgt.y-30:tgt.y):(m.fly?470:540);const sy=spd*(m.fly?.8:.5)*dt+.3;m.y+=clamp(gy-m.y,-sy,sy);}
  if(!m.fly)m.y=clamp(m.y,GY0,GY1);
}
function separate(){
  const n=enemies.length;
  for(let i=0;i<n;i++){const a=enemies[i];if(a.dead)continue;
    for(let j=i+1;j<n;j++){const b=enemies[j];if(b.dead||a.fly!==b.fly)continue;
      const dx=a.x-b.x,md=(a.size+b.size)*.5;if(dx>md||dx<-md)continue;
      const dy=(a.y-b.y)*1.5,d=Math.hypot(dx,dy);
      if(d<md&&d>.01){const pu=(md-d)*.5,ux=dx/d,uy=dy/d;a.x+=ux*pu*.25;b.x-=ux*pu*.25;a.y+=uy*pu*.5;b.y-=uy*pu*.5;}
      else if(d<=.01)a.y+=.5;}}
}

/* ===================== PLAYER STEP ===================== */
function stepPlayer(p,dt){
  if(p.alive&&!p.rev&&p.mv)p.ty=clamp(p.ty+p.mv*MV_SPEED*dt,YMIN,YMAX);
  p.x+=(p.tx-p.x)*Math.min(1,dt*5);p.y+=(p.ty-p.y)*Math.min(1,dt*5);
  if(p.flash>0)p.flash-=dt;if(p.castAnim>0)p.castAnim-=dt;if(p.recoil>0)p.recoil-=dt;
  if(!p.alive)return;
  if(p.hpBuff&&T>=p.hpBuffUntil){p.hpBuff=0;p.hp=Math.min(p.hp,maxHp(p));}
  p.mana=Math.min(maxMp(p),p.mana+C(p).regen*dt);
  for(let i=0;i<4;i++)if(p.cd[i]>0)p.cd[i]=Math.max(0,p.cd[i]-dt);
  if(p.rev){stepRevive(p,dt);return;}
  p.atkT-=dt;
  if(p.atkT<=0){
    const c=C(p),e=nearestEnemy(p.x,p.y-28,c.range);
    if(e){const a=Math.atan2(ecy(e)-(p.y-28),e.x-p.x);shoot(p,a,{dmg:c.dmg*dm(p),spd:c.spd,r:c.pr,splash:c.splash||0,col:c.col,kind:c.pk});p.recoil=.1;p.atkT=c.rate*(T<p.rapidUntil?.5:1);}
    else p.atkT=.1;
  }
  if(p.bot||((p!==players[ctl]||botAll)&&botsOn))botThink(p,dt);
}
function stepProjs(dt){
  for(const b of projs){
    b.life-=dt;
    const sp=Math.hypot(b.vx,b.vy),n=Math.max(1,Math.ceil(sp*dt/12)),h=dt/n;
    for(let s=0;s<n&&!b.dead;s++){
      b.px=b.x;b.py=b.y;b.x+=b.vx*h;b.y+=b.vy*h;
      if(b.x>1400||b.x<-50||b.y<-60||b.y>800){b.dead=true;break;}
      for(const m of enemies){
        if(m.dead||b.hit.includes(m))continue;
        if(hyp(b.x-m.x,b.y-ecy(m))<m.size+b.r){
          b.hit.push(m);const own=players[b.own];
          if(b.splash){aoe(m.x,m.y,b.splash,b.dmg,own,{burn:b.burn});fx.push({k:'boom',x:b.x,y:b.y,r:b.splash,col:b.col,t:0,dur:.3});b.dead=true;break;}
          hurt(m,b.dmg,b.own,{burn:b.burn,burnT:3,kb:b.kb,slow:b.slow,slowT:2});
          if(b.pierce>0)b.pierce--;else{b.dead=true;break;}
        }
      }
    }
    if(b.life<=0)b.dead=true;
  }
  projs=projs.filter(b=>!b.dead);
}

/* ===================== WAVES / FLOW ===================== */
function advance(){const w=wave+1;if(w===CFG.classWave&&!classChosen){openClassSelect();return;}startWave(w);}
function startWave(w){
  wave=w;state='wave';waveClock=0;
  const def=waveDef(w);spawnQ=[];
  const dur=w<=10?8+w*.6:12+w*.8;
  for(const e of def.list){const c=waveCount(w,e[1]);for(let i=0;i<c;i++)spawnQ.push({t:e[0],at:rnd(0,dur)});}
  if(def.boss)spawnQ.push({t:def.boss,at:1.5});
  spawnQ.sort((a,b)=>a.at-b.at);
  announce('คลื่นที่ '+w,def.boss?'บอส '+EN[def.boss].n+' มาแล้ว!':'ผีกำลังมาจากทางขวา',3);
}
function waveCleared(){
  if(wave>=CFG.waves){endGame(true);return;}
  state='intermission';interT=CFG.intermission;
  churchHp=Math.min(churchMax,churchHp+churchMax*.1);
  for(const p of players){
    if(!p.alive&&CFG.reviveBetween){p.alive=true;p.hp=maxHp(p)*CFG.reviveBetweenHp;p.invuln=T+2;ring(p.x,p.y,0x9fffb0,90);}
    else if(p.alive)p.hp=Math.min(maxHp(p),p.hp+maxHp(p)*.35);
    p.mana=maxMp(p);p.rev=null;
  }
  announce('คลื่นที่ '+wave+' ผ่านแล้ว','โบสถ์ซ่อมแซม +10% · ทุกคนฟื้นตัว',3.5);
}
function endGame(win,reason){
  if(state==='over')return;
  state='over';targeting=-1;
  HK.onEnd(win,reason);
}
function step(dt){
  T+=dt;
  if(sched.length){const due=sched.filter(s=>s.at<=T);if(due.length){sched=sched.filter(s=>s.at>T);for(const s of due)s.fn();}}
  if(state==='over')return;
  if(state==='intermission'){interT-=dt;if(interT<=0){interT=0;advance();return;}}
  else if(state==='wave'){
    waveClock+=dt;
    while(spawnQ.length&&spawnQ[0].at<=waveClock)spawn(spawnQ.shift().t);
  }
  for(const p of players)stepPlayer(p,dt);
  for(const m of enemies)if(!m.dead)stepEnemy(m,dt);
  separate();
  stepProjs(dt);
  for(const z of zones){
    if(T>=z.until){z.dead=true;continue;}
    z.tick-=dt;
    if(z.kind==='fire'&&z.tick<=0){z.tick=.5;aoe(z.x,z.y,z.r,z.dmg,players[z.own],{quiet:Math.random()<.7});}
    else if(z.kind==='heal'&&z.tick<=0){z.tick=1;for(const q of players)if(q.alive&&hyp(q.x-z.x,(q.y-z.y)*1.7)<z.r)healP(q,z.heal,players[z.own]);}
  }
  zones=zones.filter(z=>!z.dead);
  for(const w of walls){if(T>=w.until||w.hp<=0){w.dead=true;ring(w.x,GY1-40,0xb08a5a,50);}}
  walls=walls.filter(w=>!w.dead);
  for(const f of fx)f.t+=dt;fx=fx.filter(f=>f.t<f.dur);
  for(const q of popups)q.t+=dt;popups=popups.filter(q=>q.t<q.dur);
  if(churchFlash>0)churchFlash-=dt;
  enemies=enemies.filter(m=>!m.dead);
  if(state==='wave'&&!spawnQ.length&&!enemies.length)waveCleared();
}
function assignSlots(){
  const order=[...players].sort((a,b)=>PRI[a.cls]-PRI[b.cls]);
  order.forEach((p,k)=>{p.slot=FRONT[nP][k];const s=SLOT[nP][p.slot];p.tx=s[0];p.ty=s[1];});
}
function startGame(n,bots){
  nP=n;botsOn=bots;T=0;speed=1;wave=0;classChosen=false;ctl=0;targeting=-1;paused=false;ann=null;shakeAmt=0;
  players=[];enemies=[];projs=[];zones=[];walls=[];fx=[];popups=[];sched=[];spawnQ=[];bossRef=null;chosen=[];
  for(let i=0;i<n;i++){const p=makePlayer(i);const s=SLOT[n][i];p.tx=s[0];p.ty=s[1];p.x=s[0]-120;p.y=s[1];p.hp=maxHp(p);p.mana=maxMp(p);players.push(p);}
  churchMax=churchHp=CFG.churchHp(n);
  state='intermission';interT=CFG.firstDelay;
  announce('ป้องกันโบสถ์ให้ได้ 20 คลื่น','กด 1–4 ร่ายสกิลที่ตำแหน่งเมาส์',6);
  HK.onStart();
}

/* ---- เลือกสายอาชีพ (ตรรกะ) ---- */
function openClassSelect(){state='classSelect';chosen=new Array(nP).fill(null);targeting=-1;HK.onClassOpen();}
function setChoice(i,c){chosen[i]=c;HK.onPick();checkAllChosen();}
function checkAllChosen(){if(HK.autoConfirm()&&state==='classSelect'&&chosen.length&&chosen.every(Boolean))confirmClasses();}
function confirmClasses(){
  if(chosen.some(c=>!c))return;
  players.forEach((p,i)=>{
    p.cls=chosen[i];p.skillLv=[1,1,1,1];p.cd=[0,0,0,0];p.sp=p.lvl-1;p.hp=maxHp(p);p.mana=maxMp(p);p.atkT=.4;
    ring(p.x,p.y,C(p).col,100);
  });
  classChosen=true;assignSlots();
  HK.onClassConfirm();
  startWave(CFG.classWave);
}

/* ---- คำสั่งจากผู้เล่น (ใช้ทั้งฝั่งโฮสต์ P2P และเซิร์ฟเวอร์) ---- */
function applyCommand(idx,m){
  if(!m||typeof m!=='object')return;
  const p=players[idx];if(!p)return;
  const num=v=>typeof v==='number'&&isFinite(v);
  switch(m.t){
    case 'cast':{
      if(!(m.i>=0&&m.i<4)||!num(m.x)||!num(m.y))return;
      const s=SKILLS[p.cls][m.i|0],t=makeTarget(p,s,m.x,m.y);
      if(s.k==='ally'){const q=players[m.a];if(q&&q.alive)t.ally=q;}
      tryCast(p,m.i|0,t);break;}
    case 'upg':if(m.i>=0&&m.i<4)upgrade(p,m.i|0);break;
    case 'mv':p.mv=m.d>0?1:(m.d<0?-1:0);break;
    case 'rev':startRevive(p,players[m.q]);break;
    case 'revc':p.rev=null;break;
    case 'cls':if(state==='classSelect'&&['mage','gunner','support','tank'].includes(m.c))setChoice(idx,m.c);break;
  }
}
function playerGone(idx){
  const p=players[idx];if(!p)return;
  p.bot=true;gtoast('ผู้เล่น '+(idx+1)+' หลุดการเชื่อมต่อ — บอทคุมแทน');
  if(state==='classSelect'&&!chosen[idx]){chosen[idx]='gunner';HK.onPick();checkAllChosen();}
}

/* ---- สร้างข้อความ snapshot (S = สถานะ, E = ผี, V = เอฟเฟกต์) ข้อความละไม่เกิน 4 KiB ---- */
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
const ENK=Object.keys(EN);
let snapSeq=0;
function chunkBy(arr,limit){
  const out=[];let cur=[],len=0;
  for(const it of arr){const l=JSON.stringify(it).length+1;if(len+l>limit&&cur.length){out.push(cur);cur=[];len=0;}cur.push(it);len+=l;}
  out.push(cur);return out;
}
function encEnemy(m){
  const fl=(T<m.slowUntil?1:0)|(T<m.burnUntil?2:0)|(T<m.dazeUntil&&T>=m.reverseUntil?4:0)|(m.enraged?8:0)|(T<m.reverseUntil?16:0)|(m.phase<<5);
  const a=[m.id,ENK.indexOf(m.type),r1(m.x),r1(m.y),Math.max(0,Math.round(m.hp/m.maxHp*100)),fl];
  if(m.boss){a.push(Math.round(m.hp),Math.round(m.maxHp));}
  return a;
}
function buildSnaps(){
  const q=++snapSeq,out=[];
  out.push({t:'S',T:r2(T),s:state,w:wave,it:r1(interT),l:enemies.length+spawnQ.length,ch:Math.ceil(churchHp),cm:churchMax,sh:r1(shakeEvt),sp:netSpeed,cf:r2(churchFlash),
    an:ann&&T<ann.until?{t:ann.t,s:ann.s,r:r1(ann.until-T)}:null,
    p:players.map(p=>({x:r1(p.x),y:r1(p.y),cls:p.cls,hp:r1(p.hp),mana:r1(p.mana),lvl:p.lvl,exp:r1(p.exp),sp:p.sp,sl:p.skillLv,cd:p.cd.map(r1),al:p.alive?1:0,
      hb:p.hpBuff,hbu:r1(p.hpBuffUntil),bm:r2(p.buffMul),bu:r1(p.buffUntil),ru:r1(p.rapidUntil),iv:r1(p.invuln),fl:r2(p.flash),ca:r2(p.castAnim),rc:r2(p.recoil),
      rv:p.rev?[p.rev.target.i,r1(p.rev.t),p.rev.dur]:null,k:p.kills,d:Math.round(p.dealt),h:Math.round(p.healed),dt:p.deaths,sl2:p.slot})),
    z:zones.map(z=>({k:z.kind,x:r1(z.x),y:r1(z.y),r:z.r,u:r1(z.until),sd:r2(z.sd||0)})),
    wl:walls.map(w=>({x:w.x,hp:Math.round(w.hp),m:w.max,u:r1(w.until)}))});
  const parts=chunkBy(enemies.map(encEnemy),3300);
  parts.forEach((a,i)=>out.push({t:'E',q,i,c:parts.length,a}));
  let pr=projs.slice(0,40).map(b=>[r1(b.x),r1(b.y),Math.round(b.vx),Math.round(b.vy),b.kind,b.col,b.r]);
  let fl=fx.slice(-12).map(f=>{const o={};for(const k in f)o[k]=typeof f[k]==='number'?r2(f[k]):f[k];return o;});
  let po=popups.slice(-10).map(a=>[r1(a.x),r1(a.y),a.txt,a.col,a.sz,r2(a.t)]);
  const mkV=()=>({t:'V',b:pr,f:fl,po});
  let guard=0;
  while(new TextEncoder().encode(JSON.stringify(mkV())).length>3700&&guard++<30){
    if(pr.length>6)pr=pr.slice(0,pr.length-6);else if(fl.length>3)fl=fl.slice(1);else if(po.length>2)po=po.slice(1);else break;
  }
  out.push(mkV());
  shakeEvt=0;
  return out;
}

const API={startGame,step,applyCommand,playerGone,buildSnaps,
  setBots(v,all){botsOn=v;botAll=!!all;},setNetSpeed(v){netSpeed=v;},autoPick(list){chosen=players.map((p,i)=>list[i%list.length]);confirmClasses();},
  get state(){return state;},get wave(){return wave;},get players(){return players;},get enemies(){return enemies;},
  get churchHp(){return churchHp;},get T(){return T;},get nP(){return nP;},get CFG(){return CFG;}};
