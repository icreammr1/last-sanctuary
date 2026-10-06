/* ===== ส่วนเสริมฝั่งเบราว์เซอร์ (UI) ===== */
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString('en-US');
let scene,gfx,canvas,popPool=[],RS=1;
const mouse={x:760,y:520};
const net={role:null,tp:null,started:false,conns:[],hostConn:null,peer:null,left:0,emap:new Map(),acc:0,code:'',idx:0,lobbyHost:false,lobbyN:0,names:[]};
const embers=[],fogs=[];
let toastTimer=0;
const SHAKE_MUL=[0,.35,1],SHAKE_NAME=['ปิด','น้อย','ปกติ'];let shakeLvl=1;
function uiToast(msg){const e=$('toast');e.textContent=msg;e.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('on'),2400);}
function showEnd(win,reason){
  sfxPlay(win?'win':'lose');clearSess();
  let h='<div class="sheet"><h2>'+(win?'โบสถ์ยังตั้งอยู่!':'โบสถ์สุดท้ายล่มสลาย')+'</h2>';
  h+='<p class="sub">'+(win?'ป้องกันครบ 20 คลื่น มนุษยชาติยังมีแสงสว่าง':(reason+' · ไปถึงคลื่นที่ '+wave))+'</p>';
  h+='<table class="res"><tr><th>ผู้เล่น</th><th>สาย</th><th>เลเวล</th><th>ฆ่าได้</th><th>ดาเมจ</th><th>ฮีล</th><th>ล้ม</th></tr>';
  for(const p of players)h+='<tr><td>'+String(p.name).replace(/[<>&]/g,'')+'</td><td>'+CLS[p.cls].name+'</td><td>'+p.lvl+'</td><td>'+p.kills+'</td><td>'+fmt(p.dealt)+'</td><td>'+fmt(p.healed)+'</td><td>'+p.deaths+'</td></tr>';
  h+='</table><button class="cta" id="againBtn">กลับเมนู</button></div>';
  const m=$('mEnd');m.innerHTML=h;m.classList.remove('hide');
  $('againBtn').onclick=()=>{m.classList.add('hide');$('mMenu').classList.remove('hide');state='menu';if(net.role||net.tp)netLeave(true);};
}
function guestEnd(win,reason){if(state==='over')return;state='over';targeting=-1;showEnd(win,reason);}
const HK={
  localSfx:true,
  toast:m=>uiToast(m),
  gtoast:m=>{uiToast(m);if(net.role==='host')netSend({t:'toast',m});},
  onEnd:(win,reason)=>{if(net.role==='host'){netSnap();netSend({t:'end',win,reason});}showEnd(win,reason);},
  onChurchHit:()=>{const h=$('hurt');h.classList.add('on');setTimeout(()=>h.classList.remove('on'),180);},
  onStart:()=>{$('mMenu').classList.add('hide');$('mEnd').classList.add('hide');$('mClass').classList.add('hide');$('mPause').classList.add('hide');buildParty();skillKey='';$('bSpeed').textContent='ความเร็ว ×1';},
  onClassOpen:()=>showClassSelect(),
  onPick:()=>classWaitRender(),
  onClassConfirm:()=>{skillKey='';$('mClass').classList.add('hide');},
  autoConfirm:()=>net.role==='host'
};
