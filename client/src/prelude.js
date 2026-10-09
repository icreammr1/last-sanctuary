/* ===== ส่วนเสริมฝั่งเบราว์เซอร์ (UI) ===== */
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString('en-US');
let scene,gfx,canvas,popPool=[],RS=1;
const mouse={x:760,y:520,sx:640,in:false};
let camX=0;
const net={role:null,tp:null,started:false,conns:[],hostConn:null,peer:null,left:0,emap:new Map(),acc:0,code:'',idx:0,lobbyHost:false,lobbyN:0,names:[],mmap:new Map()};
const embers=[],fogs=[];
let toastTimer=0;
const SHAKE_MUL=[0,.35,1],SHAKE_NAME=['ปิด','น้อย','ปกติ'];let shakeLvl=1;
function uiToast(msg){const e=$('toast');e.textContent=msg;e.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('on'),2400);}
function fmtTime(t){t=Math.floor(t);return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function showEnd(win,reason){
  sfxPlay(win?'win':'lose');clearSess();
  const esc=s=>String(s).replace(/[<>&"]/g,'');
  const best=k=>{let b=null,bv=0;for(const p of players)if((p[k]||0)>bv){bv=p[k];b=p;}return b;};
  const aw=[['🏆','ดาเมจสูงสุด',best('dealt')],['💚','ฮีลสูงสุด',best('healed')],['⚔️','ฆ่าได้มากสุด',best('kills')],['🛡️','รับดาเมจมากสุด',best('taken')]].filter(a=>a[2]);
  let h='<div class="sheet"><h2>'+(win?'โบสถ์ยังตั้งอยู่!':'โบสถ์สุดท้ายล่มสลาย')+'</h2>';
  h+='<p class="sub">'+(win?'ป้องกันครบ 20 คลื่น มนุษยชาติยังมีแสงสว่าง':esc(reason))+'</p>';
  h+='<div class="sumrow"><div><b>คลื่นที่ไปถึง</b>'+wave+' / 20</div><div><b>เวลาเล่น</b>'+fmtTime(T)+'</div><div><b>โบสถ์เหลือ</b>'+Math.round(churchHp/Math.max(1,churchMax)*100)+'%</div><div><b>ผู้เล่น</b>'+players.length+' คน</div></div>';
  if(aw.length)h+='<div class="awards">'+aw.map(a=>'<span>'+a[0]+' '+a[1]+': <b>'+esc(a[2].name)+'</b></span>').join('')+'</div>';
  h+='<table class="res"><tr><th>ชื่อ</th><th>สาย</th><th>เลเวล</th><th>ฆ่า</th><th>ดาเมจ</th><th>ฮีล</th><th>รับดาเมจ</th><th>ล้ม</th></tr>';
  for(const p of players)h+='<tr><td>'+esc(p.name)+'</td><td>'+CLS[p.cls].icon+' '+CLS[p.cls].name+'</td><td>'+p.lvl+'</td><td>'+p.kills+'</td><td>'+fmt(p.dealt)+'</td><td>'+fmt(p.healed)+'</td><td>'+fmt(p.taken||0)+'</td><td>'+p.deaths+'</td></tr>';
  h+='</table><div class="lobrow">';
  if(net.tp==='ws')h+='<button class="cta" id="lobbyBtn">กลับล็อบบี้ (เล่นต่อ)</button><button class="btn" id="againBtn">ออกจากห้อง</button>';
  else if(!net.role)h+='<button class="cta" id="replayBtn">เล่นอีกครั้ง</button><button class="btn" id="againBtn">กลับเมนู</button>';
  else h+='<button class="cta" id="againBtn">กลับเมนู</button>';
  h+='</div></div>';
  const m=$('mEnd');m.innerHTML=h;m.classList.remove('hide');
  $('againBtn').onclick=()=>{m.classList.add('hide');$('mMenu').classList.remove('hide');state='menu';if(net.role||net.tp)netLeave(true);};
  const lb=$('lobbyBtn');
  if(lb)lb.onclick=goLobby;
  const rp=$('replayBtn');
  if(rp)rp.onclick=()=>{m.classList.add('hide');startGame(nP,botsOn,[getName()]);};
}
function goLobby(){net.endShown=false;$('mEnd').classList.add('hide');net.started=false;state='menu';lobMsg='';net.lobbyN=0;net.names=[];$('mLobby').classList.remove('hide');lobbyRender();netToHost({t:'lobby'});}
function guestEnd(win,reason){if(net.endShown)return;net.endShown=true;state='over';targeting=-1;showEnd(win,reason);}
const HK={
  localSfx:true,
  toast:m=>uiToast(m),
  gtoast:m=>{uiToast(m);if(net.role==='host')netSend({t:'toast',m});},
  onEnd:(win,reason)=>{if(net.role==='host'){netSnap();netSend({t:'end',win,reason});}showEnd(win,reason);},
  onChurchHit:()=>{const h=$('hurt');h.classList.add('on');setTimeout(()=>h.classList.remove('on'),180);},
  onStart:()=>{camX=0;net.endShown=false;$('mMenu').classList.add('hide');$('mEnd').classList.add('hide');$('mClass').classList.add('hide');$('mPause').classList.add('hide');buildParty();skillKey='';$('bSpeed').textContent='ความเร็ว ×1';},
  onClassOpen:()=>showClassSelect(),
  onPick:()=>classWaitRender(),
  onClassConfirm:()=>{skillKey='';$('mClass').classList.add('hide');},
  autoConfirm:()=>net.role==='host'
};
