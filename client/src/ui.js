
/* ===================== HUD / UI ===================== */
let skillKey='',hudShown=false,partyEls=[],skEls=[];
const PLAYER_LABEL=i=>(players[i]&&players[i].name)||('ผู้เล่น '+(i+1));
function sT(el,v){if(el._t!==v){el._t=v;el.textContent=v;}}
function sF(el,v){v=Math.round(clamp(v,0,1)*1000)/1000;if(el._f!==v){el._f=v;el.style.transform='scaleX('+v+')';}}
function sD(el,v){if(el._d!==v){el._d=v;el.style.display=v;}}

function buildParty(){
  const box=$('party');box.innerHTML='';partyEls=[];
  players.forEach((p,i)=>{
    const d=document.createElement('div');d.className='card panel ia';
    d.innerHTML='<div class="nm"><span class="n"></span><small class="lv"></small></div><div class="bar"><i class="hp"></i></div><div class="st"></div>';
    d.onclick=()=>{if(net.role)return;ctl=i;targeting=-1;};
    box.appendChild(d);
    partyEls.push({d,n:d.querySelector('.n'),lv:d.querySelector('.lv'),hp:d.querySelector('.hp'),st:d.querySelector('.st')});
  });
}
function buildSkillBar(){
  const p=players[ctl];if(!p)return;
  const box=$('skills');box.innerHTML='';skEls=[];
  const keys=['1','2','3','4'];
  SKILLS[p.cls].forEach((s,i)=>{
    const b=document.createElement('button');b.className='sk';b.title=s.n+' — '+s.d;
    b.innerHTML='<span class="key">'+keys[i]+'</span><span class="mp">'+s.mp+'</span><span class="ic">'+s.ic+'</span><span class="nm">'+s.n+'</span><span class="pips"></span><u class="cdo"></u><span class="cdt"></span><span class="up">+</span>';
    b.onclick=()=>onSkillClick(i);
    const up=b.querySelector('.up');up.onclick=e=>{e.stopPropagation();upgCmd(i);};
    box.appendChild(b);
    skEls.push({b,pips:b.querySelector('.pips'),cdo:b.querySelector('.cdo'),cdt:b.querySelector('.cdt'),up});
  });
  skillKey=ctl+p.cls;
}
function renderGear(p){
  const el=$('gear');
  if(!el._b){el._b=[];for(let i=0;i<3;i++){const d=document.createElement('div');d.className='gslot';d.textContent=SLOTS[i].ic;el.appendChild(d);el._b.push(d);}}
  for(let i=0;i<3;i++){
    const it=p.gear[i],d=el._b[i],sig=it?(it.n+it.r+JSON.stringify(it.af)):'';
    if(d._sig===sig)continue;d._sig=sig;
    if(it){d.classList.add('has');d.style.setProperty('--rc',RAR[it.r].c);d.style.borderColor=RAR[it.r].c;d.title=it.n+' ('+RAR[it.r].n+')\n'+it.af.map(afxText).join('\n');}
    else{d.classList.remove('has');d.style.borderColor='';d.title=SLOTS[i].n+' (ว่าง)';}
  }
}
function renderDropTip(){
  const t=$('dtip');let best=null,bd=46;
  for(const d of drops){const dd=hyp(mouse.x-d.x,mouse.y-(d.y-14));if(dd<bd){bd=dd;best=d;}}
  if(!best||paused){if(t._v!==0){t._v=0;t.style.display='none';}return;}
  const R=RAR[best.it.r];
  const html='<b style="color:'+R.c+'">'+SLOTS[best.it.s].ic+' '+best.it.n+' · '+R.n+'</b>'+best.it.af.map(afxText).join('<br>')+'<br><small>คลิกเพื่อเก็บ</small>';
  if(t._h!==html){t._h=html;t.innerHTML=html;}
  t._v=1;t.style.display='block';t.style.left=(mouse.x/W*100)+'%';t.style.top=(mouse.y/H*100)+'%';
}
function sOrb(el,f,html){
  f=Math.round(clamp(f,0,1)*100)/100;
  if(el._f!==f){el._f=f;el.querySelector('.fill').style.transform='scaleY('+f+')';}
  const v=el.querySelector('.val');if(v._h!==html){v._h=html;v.innerHTML=html;}
}
let shopOpen=false,shopSig='';
function toggleShop(){shopOpen=!shopOpen;$('shop').style.display=shopOpen?'block':'none';shopSig='';}
function renderShop(p){
  if(!shopOpen)return;
  const sig=Math.floor(p.gold)+'|'+p.pots.hp+p.pots.mp+'|'+p.buffs.hp+p.buffs.mp+p.buffs.dmg+p.buffs.regen;
  if(sig===shopSig)return;shopSig=sig;
  let h='<div class="hd"><b>ร้านค้า (B ปิด)</b><span>🪙 '+Math.floor(p.gold)+'</span></div>';
  for(const id of SHOP_IDS){
    const s=SHOP[id],c=shopCost(p,id),pot=id==='hpPot'||id==='mpPot';
    const cur=pot?p.pots[id==='hpPot'?'hp':'mp']:p.buffs[id],mx=pot?s.cap:s.max,maxed=cur>=mx;
    h+='<div class="srow"><span class="si">'+s.ic+'</span><span class="st2">'+s.n+' <small>'+s.d+' · '+cur+'/'+mx+'</small></span><button data-id="'+id+'"'+(maxed||p.gold<c?' disabled':'')+'>'+(maxed?'เต็ม':'🪙 '+c)+'</button></div>';
  }
  const el=$('shop');el.innerHTML=h;
  el.querySelectorAll('button[data-id]').forEach(b=>{b.onclick=()=>buyCmd(b.dataset.id);});
}
function onSkillClick(i){
  const p=players[ctl];if(!p||paused||state==='over'||state==='classSelect'||state==='menu')return;
  const s=SKILLS[p.cls][i];
  if(s.k==='point'||s.k==='aim'||s.k==='ally'||s.k==='wall'){
    if(p.cd[i]>0||p.mana<s.mp||!p.alive){if(p.mana<s.mp)toast('มานาไม่พอ');return;}
    targeting=targeting===i?-1:i;
  }else castCmd(i,makeTarget(p,s,null,null));
}
function quickCast(i){
  const p=players[ctl];if(!p)return;const s=SKILLS[p.cls][i];
  castCmd(i,makeTarget(p,s,mouse.x,mouse.y));
}
function waveText(w){
  const def=waveDef(w),cm=CFG.countMul[nP];
  const parts=def.list.map(e=>EN[e[0]].n+' ×'+waveCount(w,e[1]));
  if(def.boss)parts.unshift('บอส '+EN[def.boss].n);
  return parts.join(' · ');
}
function updateHud(){
  const show=players.length>0&&state!=='menu';
  if(hudShown!==show){$('hud').style.visibility=show?'visible':'hidden';hudShown=show;}
  if(!show)return;
  const p=players[ctl];
  // top
  sT($('wN'),String(wave));
  const left=net.role==='guest'?net.left:enemies.length+spawnQ.length;
  sT($('wLeft'),state==='wave'?('ผีที่เหลือ '+left):(state==='intermission'?'พักก่อนคลื่น '+(wave+1):'—'));
  sF($('chBar'),churchHp/churchMax);sT($('chTxt'),Math.ceil(churchHp)+' / '+churchMax);
  // boss
  if(bossRef&&!bossRef.dead){sD($('boss'),'block');sT($('bossName'),bossRef.name);sT($('bossTxt'),Math.ceil(bossRef.hp)+' / '+Math.ceil(bossRef.maxHp));sF($('bossBar'),bossRef.hp/bossRef.maxHp);}
  else sD($('boss'),'none');
  // party
  players.forEach((q,i)=>{
    const e=partyEls[i];if(!e)return;
    sT(e.n,CLS[q.cls].icon+' '+PLAYER_LABEL(i));sT(e.lv,'Lv'+q.lvl);
    sF(e.hp,q.hp/maxHp(q));
    e.d.classList.toggle('ctl',i===ctl);e.d.classList.toggle('dead',!q.alive);
    let st='';if(!q.alive){st=players.some(o=>o.rev&&o.rev.target===q)?'กำลังถูกชุบ…':'ล้ม — กด F ชุบ';}
    else if(q.rev)st='ชุบ '+PLAYER_LABEL(q.rev.target.i)+'…';
    sT(e.st,st);
  });
  // skills
  if(skillKey!==ctl+p.cls)buildSkillBar();
  const sk=SKILLS[p.cls];
  for(let i=0;i<4;i++){
    const s=sk[i],e=skEls[i];if(!e)continue;
    const f=p.cd[i]>0?p.cd[i]/s.cd:0;
    const tr='scaleY('+Math.round(f*100)/100+')';if(e.cdo._t!==tr){e.cdo._t=tr;e.cdo.style.transform=tr;}
    sT(e.cdt,p.cd[i]>0.05?String(Math.ceil(p.cd[i])):'');
    e.b.classList.toggle('nomp',p.mana<s.mp);e.b.classList.toggle('sel',targeting===i);
    sT(e.pips,'●'.repeat(p.skillLv[i])+'○'.repeat(CFG.maxSkill-p.skillLv[i]));
    e.up.classList.toggle('on',p.sp>0&&p.skillLv[i]<CFG.maxSkill);
  }
  // orbs / pots / shop / me
  const mh=maxHp(p),mm=maxMp(p);
  sOrb($('orbHp'),p.hp/mh,String(Math.ceil(p.hp)));
  sOrb($('orbMp'),p.mana/mm,String(Math.floor(p.mana)));
  for(const [id,k] of [['potHp','hp'],['potMp','mp']]){
    const b=$(id),n=p.pots[k],cd=Math.max(0,p.potCd[k]-T);
    sT(b.querySelector('.cnt'),String(n));b.classList.toggle('empty',n<=0);
    const tr='scaleY('+Math.round(Math.min(1,cd/CFG.potCd)*100)/100+')',o=b.querySelector('.cdo');if(o._t!==tr){o._t=tr;o.style.transform=tr;}
  }
  sT($('me'),PLAYER_LABEL(ctl)+' · '+CLS[p.cls].name+' · Lv '+p.lvl+(p.sp>0?' · แต้มสกิล '+p.sp:'')+' · 🪙 '+Math.floor(p.gold));
  sF($('xpBar'),p.lvl>=CFG.maxLvl?1:p.exp/expNeed(p.lvl));
  renderShop(p);renderGear(p);renderDropTip();
  sT($('hint'),net.role?'1–4 สกิล · W/S เดิน · Q/E ขวดยา · B ร้านค้า · Shift+1–4 อัพ · F ชุบ':(nP>1?'1–4 สกิล · W/S เดิน · Q/E ยา · B ร้านค้า · Shift+1–4 อัพ · F ชุบ · TAB สลับตัว · Space เริ่มคลื่น · P พัก':'1–4 สกิล · W/S เดิน · Q/E ยา · B ร้านค้า · Shift+1–4 อัพ · F ชุบ · Space เริ่มคลื่น · P พัก'));
  // banner
  const b=$('banner');let html='';
  if(state==='intermission'){
    const w=wave+1;
    html='<div class="b1">'+(w===CFG.classWave?'คลื่นที่ 5 · เลือกสายอาชีพ':'คลื่นที่ '+w+' ใน '+Math.ceil(interT)+'')+'</div><div class="b2">'+waveText(w)+'</div>'+(net.role==='guest'?'':'<button class="btn" id="goBtn">เริ่มเลย (Space)</button>');
  }else if(ann&&T<ann.until){html='<div class="b1">'+ann.t+'</div><div class="b2">'+ann.s+'</div>';}
  if(b._h!==html){b._h=html;b.innerHTML=html;const gb=$('goBtn');if(gb)gb.onclick=()=>{interT=0;};}
  else if(state==='intermission'){const t=b.querySelector('.b1');if(t&&wave+1!==CFG.classWave)sT(t,'คลื่นที่ '+(wave+1)+' ใน '+Math.ceil(interT));}
  const cur=targeting>=0?'crosshair':'default';if(canvas&&canvas.style.cursor!==cur)canvas.style.cursor=cur;
}

/* ---- class select (คลื่นที่ 5) ---- */
let myPick=false;
function classWaitRender(){
  const e=$('clsWait');if(!e)return;
  if(net.role==='host')e.textContent=players.map((p,i)=>PLAYER_LABEL(i)+': '+(chosen[i]?'พร้อม':'กำลังเลือก…')).join('  ·  ');
  else e.textContent=myPick?'เลือกแล้ว รอเพื่อนคนอื่น…':'';
}
function pickClass(i,c){
  if(net.role==='guest'){myPick=true;netToHost({t:'cls',c});}
  else{setChoice(i,c);}
  classWaitRender();
}
function showClassSelect(){
  myPick=false;
  const rows=net.role?[ctl]:players.map((p,i)=>i);
  let h='<div class="sheet"><h2>เลือกสายอาชีพ</h2><p class="sub">คลื่นที่ 5 · ทุกคนเลือกพร้อมกัน · แต้มสกิลที่เคยอัพจะคืนให้ทั้งหมด</p>';
  for(const i of rows){
    h+='<div class="prow"><div class="pname">'+PLAYER_LABEL(i)+'<small>Lv '+players[i].lvl+'</small></div><div class="copts">';
    for(const k of['mage','gunner','summoner','support','tank']){const c=CLS[k];
      h+='<button class="copt" data-p="'+i+'" data-c="'+k+'" style="--c:'+c.css+'"><b>'+c.icon+' '+c.name+'</b><em>'+c.role+'</em><small>'+SKILLS[k].map(s=>s.n).join(' · ')+'</small></button>';}
    h+='</div></div>';
  }
  h+=net.role?'<div id="clsWait" class="sub"></div></div>':'<button id="clsGo" class="cta" disabled>ยืนยันและเริ่มคลื่นที่ 5</button></div>';
  const m=$('mClass');m.innerHTML=h;m.classList.remove('hide');
  m.onclick=e=>{
    const o=e.target.closest('.copt');
    if(o){const i=+o.dataset.p;m.querySelectorAll('.copt[data-p="'+i+'"]').forEach(x=>x.classList.toggle('on',x===o));pickClass(i,o.dataset.c);if(!net.role)$('clsGo').disabled=chosen.some(c=>!c);}
  };
  if(net.role)classWaitRender();else $('clsGo').onclick=confirmClasses;
}
/* ---- input ---- */
function togglePause(){
  if(state==='menu'||state==='over'||state==='classSelect')return;
  paused=!paused;$('mPause').classList.toggle('hide',!paused);$('bPause').textContent=paused?'เล่นต่อ':'พัก';
}
function switchCtl(){if(players.length<2)return;ctl=(ctl+1)%players.length;targeting=-1;}
function skipWave(){
  if(state==='intermission'){interT=0;return;}
  if(state!=='wave')return;
  spawnQ=[];for(const m of enemies){m.dead=true;}
}
function updMouse(e){
  const r=canvas.getBoundingClientRect();
  mouse.x=(e.clientX-r.left)/r.width*W;mouse.y=(e.clientY-r.top)/r.height*H;
}
/* ---- เดินขึ้น/ลง (W/S หรือลูกศร หรือปุ่มบนจอ) ---- */
const held={up:false,down:false};let lastMv=0;
function applyMove(){
  let d=(held.down?1:0)-(held.up?1:0);
  if(paused||state==='menu'||state==='over'||state==='classSelect')d=0;
  if(d!==lastMv){
    lastMv=d;
    if(net.role==='guest')netToHost({t:'mv',d});
  }
  if(net.role!=='guest')for(const p of players)p.mv=(p===players[ctl]?d:0);
}
function bindMove(){
  window.addEventListener('keydown',e=>{
    if(e.code==='KeyW'||e.code==='ArrowUp'){held.up=true;e.preventDefault();}
    else if(e.code==='KeyS'||e.code==='ArrowDown'){held.down=true;e.preventDefault();}
  });
  window.addEventListener('keyup',e=>{
    if(e.code==='KeyW'||e.code==='ArrowUp')held.up=false;
    else if(e.code==='KeyS'||e.code==='ArrowDown')held.down=false;
  });
  window.addEventListener('blur',()=>{held.up=held.down=false;});
  const hold=(id,k)=>{const b=$(id);const on=e=>{held[k]=true;e.preventDefault();},off=()=>{held[k]=false;};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);};
  hold('mvUp','up');hold('mvDown','down');
  $('bSound').onclick=()=>{audInit();audToggle();$('bSound').textContent='เสียง: '+SND_NAME[AUD.mode];};
  $('bSound').textContent='เสียง: '+SND_NAME[AUD.mode];
}
function bindInput(){
  bindMove();
  ['pointerdown','keydown'].forEach(ev=>window.addEventListener(ev,()=>audInit(),{passive:true}));
  canvas.addEventListener('pointermove',updMouse);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
    updMouse(e);
    if(paused||state==='menu'||state==='over'||state==='classSelect')return;
    if(e.button===2){targeting=-1;return;}
    const p=players[ctl];if(!p)return;
    if(targeting>=0){const s=SKILLS[p.cls][targeting];castCmd(targeting,makeTarget(p,s,mouse.x,mouse.y));targeting=-1;return;}
    {let best=null,bd=46;for(const d of drops){const dd=hyp(mouse.x-d.x,mouse.y-(d.y-14));if(dd<bd){bd=dd;best=d;}}if(best){pickCmd(best.id);return;}}
    for(const q of players){if(!q.alive&&hyp(mouse.x-q.x,mouse.y-(q.y-20))<38){if(p.alive&&!p.rev)reviveCmd(q);return;}}
    for(const q of players){if(q.alive&&hyp(mouse.x-q.x,mouse.y-(q.y-28))<32){if(!net.role)ctl=q.i;return;}}
  });
  window.addEventListener('keydown',e=>{
    if(state==='menu'||state==='over')return;
    const c=e.code;
    if(net.role&&(c==='KeyP'||c==='KeyN'||c==='Tab'||(c==='Escape'&&targeting<0)))return;
    if(c==='KeyP'||(c==='Escape'&&targeting<0)){e.preventDefault();togglePause();return;}
    if(c==='Escape'){targeting=-1;return;}
    if(paused||state==='classSelect')return;
    const idx={Digit1:0,Digit2:1,Digit3:2,Digit4:3}[c];
    if(idx!==undefined){e.preventDefault();if(e.shiftKey)upgCmd(idx);else if(!e.repeat)quickCast(idx);return;}
    if(c==='Tab'){e.preventDefault();switchCtl();return;}
    if(c==='KeyF'){e.preventDefault();reviveCmd(null);return;}
    if(c==='Space'){e.preventDefault();if(state==='intermission'&&net.role!=='guest')interT=0;return;}
    if(c==='KeyN'){skipWave();return;}
    if(c==='KeyB'){toggleShop();return;}
    if(c==='KeyQ'){potCmd('hp');return;}
    if(c==='KeyE'){potCmd('mp');return;}
  });
  window.addEventListener('blur',()=>{if(!net.role&&!paused&&(state==='wave'||state==='intermission'))togglePause();});
  $('potHp').onclick=()=>potCmd('hp');$('potMp').onclick=()=>potCmd('mp');$('shopBtn').onclick=toggleShop;
  $('bPause').onclick=togglePause;$('resumeBtn').onclick=togglePause;
  $('bSpeed').onclick=()=>{speed=speed%3+1;$('bSpeed').textContent='ความเร็ว ×'+speed;};
  let menuN=1;const chips=$('chips');
  for(let n=1;n<=4;n++){const b=document.createElement('button');b.className='chip'+(n===1?' on':'');b.innerHTML='<b>'+n+'</b>คน';b.onclick=()=>{menuN=n;chips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));};chips.appendChild(b);}
  const ni=$('nameIn');try{ni.value=localStorage.getItem('ls_name')||'';}catch(e){}
  {const sess=readSess();if(sess&&wsUrl()){const b=$('resumeBtn2');b.classList.remove('hide');b.textContent='กลับเข้าห้องเดิม ('+sess.code+')';b.onclick=resumeRoom;}}
  $('startBtn').onclick=()=>{saveName();startGame(menuN,$('botChk').checked,[getName()]);};
  $('onlineBtn').onclick=()=>{$('mMenu').classList.add('hide');$('mLobby').classList.remove('hide');lobbyRender();};
}

/* ===================== PHASER ===================== */
function create(){
  scene=this;
  makeBg(this);
  this.add.image(0,0,'bg').setOrigin(0,0).setDepth(0);
  makeFg(this);this.add.image(0,0,'fg').setOrigin(0,0).setDepth(3);
  gfx=this.add.graphics().setDepth(2);
  for(let i=0;i<60;i++){
    const t=this.add.text(0,0,'',{fontFamily:'Arial, sans-serif',fontSize:'16px',fontStyle:'bold',color:'#ffffff',stroke:'#000000',strokeThickness:3}).setDepth(5).setOrigin(.5,1).setVisible(false).setResolution(RS);
    popPool.push(t);
  }
  for(let i=0;i<70;i++)embers.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-22,-6),vy:rnd(-46,-12),s:rnd(1,2.6),ph:rnd(0,6.28)});
  for(let i=0;i<6;i++)fogs.push({x:rnd(0,W),y:rnd(540,660),w:rnd(500,900),h:rnd(50,90),a:.05,v:rnd(-14,14)});
  canvas=this.game.canvas;
  this.cameras.main.setZoom(RS);this.cameras.main.centerOn(W/2,H/2);
  bindInput();
}
function update(time,delta){
  const dt=Math.min(delta/1000,.05);
  if(net.role==='guest'){if(net.started)guestStep(dt);}
  else{
    if(!paused&&(state==='intermission'||state==='wave')){for(let k=0;k<speed;k++)step(dt);}
    if(net.role==='host'&&net.started&&state!=='over'){net.acc+=dt;if(net.acc>=1/(net.tp==='room'?8:15)){net.acc=0;netSnap();}}
  }
  applyMove();
  if(net.role!=='guest'){const sl=drainLocalSfx();playSfxSets(sl[0],sl[1],ctl);}
  ambient(dt);
  render();
  updateHud();
}
function boot(){
  const sc=window.Phaser;
  RS=($('stage').clientWidth*(window.devicePixelRatio||1)>1500)?1.5:1;
  new sc.Game({type:sc.AUTO,parent:'game',width:W*RS,height:H*RS,backgroundColor:'#000000',
    scale:{mode:sc.Scale.FIT,autoCenter:sc.Scale.CENTER_BOTH},render:{antialias:true},
    scene:{create,update}});
}
/* ===================== ONLINE (PeerJS · โฮสต์เป็นผู้ตัดสินเกม) ===================== */
const NETPFX='lsanct-';
let lobMsg='';
function netSend(m){
  if(net.role!=='host')return;
  if(net.tp==='room'){net.room.emit('h',m).catch(()=>{});return;}
  for(const c of net.conns)if(c&&c.open)c.send(m);
}
function netToHost(m){if(net.hostConn&&net.hostConn.open)net.hostConn.send(m);}
function setOnlineUi(on){$('bSpeed').style.display=on?'none':'';$('bPause').style.display=on?'none':'';}

/* ---- คำสั่งจากผู้เล่น (ฝั่งโฮสต์เล่นตรง ฝั่งเพื่อนส่งไปให้โฮสต์) ---- */
function castCmd(i,t){
  const p=players[ctl];if(!p)return false;
  if(net.role==='guest'){
    const s=SKILLS[p.cls][i];
    if(!p.alive||p.rev||p.cd[i]>.35)return false;
    if(p.mana<s.mp-2){toast('มานาไม่พอ');return false;}
    netToHost({t:'cast',i,x:Math.round(t.x),y:Math.round(t.y),a:t.ally?t.ally.i:-1});
    p.cd[i]=.25;return true;
  }
  return tryCast(p,i,t);
}
function pickCmd(id){if(net.role==='guest'){netToHost({t:'pick',id});}else pickDrop(players[ctl],id);}
function buyCmd(id){if(net.role==='guest'){netToHost({t:'buy',id});}else buyItem(players[ctl],id);}
function potCmd(k){if(net.role==='guest'){netToHost({t:'pot',k});}else usePot(players[ctl],k);}
function upgCmd(i){
  if(net.role==='guest'){const p=players[ctl];if(p&&p.sp>0&&p.skillLv[i]<CFG.maxSkill){netToHost({t:'upg',i});p.sp--;p.skillLv[i]++;}}
  else upgrade(players[ctl],i);
}
function reviveCmd(q){
  const p=players[ctl];if(!p)return;
  if(net.role==='guest'){if(p.rev)netToHost({t:'revc'});else netToHost({t:'rev',q:q?q.i:-1});return;}
  if(p.rev){p.rev=null;return;}
  startRevive(p,q||undefined);
}

/* ---- ล็อบบี้ ---- */
function lobStatus(s){lobMsg=s;const e=$('lobMsg');if(e)e.textContent=s;}
function lobbyRender(){
  const m=$('mLobby');let h='<div class="sheet"><h2>เล่นกับเพื่อน</h2>';
  if(!net.role){
    h+='<p class="sub">คนหนึ่งสร้างห้อง แล้วส่งรหัส 4 ตัวอักษรให้เพื่อน (สูงสุด 4 คน)</p>'
      +'<div class="lobrow"><button class="cta" id="lobCreate">สร้างห้อง</button></div>'
      +'<div class="lobrow"><input id="lobCode" class="codein" maxlength="4" placeholder="รหัส" autocomplete="off"><button class="cta ghost" id="lobJoin">เข้าห้อง</button></div>';
  }else if(net.tp==='ws'){
    h+='<p class="sub">'+(net.lobbyHost?'ส่งรหัสนี้ให้เพื่อน':'เชื่อมต่อแล้ว รอผู้สร้างห้องกดเริ่มเกม')+'</p><div class="code">'+net.code+'</div><p>ผู้เล่นในห้อง <b>'+net.lobbyN+' / 4</b></p><p class="sub">'+(net.names||[]).map((n,i)=>(i===net.idx?'⭐ ':'')+String(n).replace(/[<>&]/g,'')).join(' · ')+'</p>'+(net.lobbyHost?'<button class="cta" id="lobStart">เริ่มเกม ('+net.lobbyN+' คน)</button>':'');
  }else if(net.role==='host'){
    const n=1+net.conns.filter(c=>c&&c.open).length;
    h+='<p class="sub">ส่งรหัสนี้ให้เพื่อน</p><div class="code">'+net.code+'</div><p>ผู้เล่นในห้อง <b>'+n+' / 4</b> (คุณคือผู้เล่น 1)</p><button class="cta" id="lobStart">เริ่มเกม ('+n+' คน)</button>';
  }else h+='<p class="sub">เชื่อมต่อแล้ว รอโฮสต์กดเริ่มเกม</p><p>คุณคือผู้เล่น '+(net.idx+1)+'</p>';
  h+='<div id="lobMsg" class="sub" style="margin-top:1cqw">'+lobMsg+'</div><button class="btn" id="lobBack" style="margin-top:.8cqw">ย้อนกลับ</button></div>';
  m.innerHTML=h;
  const b=id=>$(id);
  if(b('lobCreate'))b('lobCreate').onclick=hostRoom;
  if(b('lobJoin'))b('lobJoin').onclick=()=>joinRoom(b('lobCode').value);
  if(b('lobStart'))b('lobStart').onclick=net.tp==='ws'?()=>netToHost({t:'start'}):hostStart;
  b('lobBack').onclick=()=>netLeave(true);
}
function netLeave(toMenu){
  try{if(net.peer)net.peer.destroy();}catch(e){}
  try{if(net.ws){const w=net.ws;net.ws=null;w.close();}}catch(e){}
  net.lobbyHost=false;net.lobbyN=0;
  try{if(net.unsub)net.unsub.forEach(f=>f());}catch(e){}
  try{if(net.room)net.room.leave();}catch(e){}
  clearInterval(net.helloTimer);
  net.tp=null;net.room=null;net.unsub=null;net.peerIdx=null;net.hostPeer=null;
  net.role=null;net.started=false;net.conns=[];net.hostConn=null;net.peer=null;net.emap=new Map();net.code='';lobMsg='';
  setOnlineUi(false);
  if(toMenu){$('mLobby').classList.add('hide');$('mMenu').classList.remove('hide');state='menu';}
}
function loadPeerLib(){
  if(window.Peer)return Promise.resolve();
  return new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
}
function randCode(){const A='ABCDEFGHJKMNPQRSTUVWXYZ';let s='';for(let i=0;i<4;i++)s+=A[Math.floor(Math.random()*A.length)];return s;}

/* ---- ฝั่งโฮสต์ ---- */
const inClaude=()=>!!(window.claude&&typeof window.claude.use==='function');
const NEED_ACCOUNT='ต้องเข้าสู่ระบบ Claude และได้รับเชิญแบบ Contributor จึงเล่นออนไลน์ผ่านลิงก์นี้ได้';
function getRoom(){return inClaude()?window.claude.use('room').catch(()=>null):Promise.resolve(null);}
function hostRoom(){
  if(wsUrl()){hostViaWs();return;}
  lobStatus('กำลังสร้างห้อง…');
  getRoom().then(room=>{
    if(room)return hostViaRoom(room);
    if(inClaude()){lobStatus(NEED_ACCOUNT);return;}
    return loadPeerLib().then(()=>tryCreate(0));
  }).catch(()=>lobStatus('สร้างห้องไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่'));
}
/* --- ผ่าน room ของ Claude (ลิงก์ที่เผยแพร่) --- */
async function hostViaRoom(room){
  const code=randCode(),nr=await room.join('lsanct-'+code.toLowerCase());
  net.tp='room';net.room=nr;net.role='host';net.code=code;net.conns=[null];net.started=false;net.peerIdx=new Map();
  net.unsub=[nr.on('g',onRoomG),nr.onPeers(ch=>{for(const p of ch.left){const idx=net.peerIdx&&net.peerIdx.get(p.peer);if(idx!==undefined&&net.conns[idx]&&net.conns[idx].open){net.conns[idx].open=false;onGuestGone(net.conns[idx]);}}})];
  lobMsg='';lobbyRender();
}
function roomConn(peer){return{open:true,_idx:-1,peer,send(m){net.room.emit('h',Object.assign({},m,{to:peer})).catch(()=>{});},close(){this.open=false;}};}
function onRoomG(msg){
  if(msg.isMe||net.role!=='host')return;
  const d=msg.data;if(!d||typeof d!=='object')return;
  if(d.t==='hello'){
    let idx=net.peerIdx.get(msg.peer);
    if(idx===undefined){
      const used=net.conns.filter(c=>c&&c.open).length;
      if(net.started||used>=3){roomConn(msg.peer).send({t:'full'});return;}
      idx=net.conns.findIndex((c,i)=>i>0&&!c);if(idx<0)idx=net.conns.length;
      const c=roomConn(msg.peer);c._idx=idx;net.conns[idx]=c;net.peerIdx.set(msg.peer,idx);lobbyRender();
    }
    if(net.conns[idx])net.conns[idx].send({t:'welcome',idx});
    return;
  }
  const idx=net.peerIdx.get(msg.peer);if(idx!==undefined)onGuestMsg(idx,d);
}
function tryCreate(n){
  const code=randCode(),peer=new window.Peer(NETPFX+code);
  peer.on('open',()=>{net.tp='peer';net.role='host';net.peer=peer;net.code=code;net.conns=[null];net.started=false;lobMsg='';lobbyRender();});
  peer.on('connection',acceptConn);
  peer.on('error',e=>{if(e.type==='unavailable-id'&&n<5){try{peer.destroy();}catch(x){}tryCreate(n+1);}else lobStatus('สร้างห้องไม่สำเร็จ ('+e.type+')');});
}
function acceptConn(conn){
  conn.on('open',()=>{
    const used=net.conns.filter(c=>c&&c.open).length;
    if(net.started||used>=3){conn.send({t:'full'});setTimeout(()=>{try{conn.close();}catch(e){}},300);return;}
    let idx=net.conns.findIndex((c,i)=>i>0&&!c);if(idx<0)idx=net.conns.length;
    net.conns[idx]=conn;conn._idx=idx;conn.send({t:'welcome',idx});
    if(!net.started)lobbyRender();
  });
  conn.on('data',m=>{if(conn._idx!==undefined)onGuestMsg(conn._idx,m);});
  conn.on('close',()=>onGuestGone(conn));
}
function hostStart(){
  if(net.role!=='host'||net.started)return;
  const live=net.conns.filter((c,i)=>i>0&&c&&c.open);
  net.conns=[null,...live];live.forEach((c,k)=>{c._idx=k+1;});
  if(net.peerIdx)net.peerIdx=new Map(live.map(c=>[c.peer,c._idx]));
  const n=1+live.length;net.started=true;
  $('mLobby').classList.add('hide');
  saveName();startGame(n,false,[getName()]);botsOn=false;botAll=false;speed=1;setOnlineUi(true);
  live.forEach(c=>c.send({t:'start',n,idx:c._idx}));
}
function onGuestGone(conn){
  if(!net.started){lobbyRender();return;}
  playerGone(conn._idx);
}
function onGuestMsg(idx,m){if(net.started)applyCommand(idx,m);}
function netSnap(){for(const m of buildSnaps())netSend(m);}

/* ---- ฝั่งเพื่อน (ไคลเอนต์) ---- */
function joinRoom(code){
  code=String(code||'').trim().toUpperCase();
  if(code.length!==4){lobStatus('ใส่รหัสห้อง 4 ตัวอักษร');return;}
  if(wsUrl()){joinViaWs(code);return;}
  lobStatus('กำลังเชื่อมต่อ…');
  getRoom().then(room=>{
    if(room)return joinViaRoom(room,code);
    if(inClaude()){lobStatus(NEED_ACCOUNT);return;}
    return loadPeerLib().then(()=>joinViaPeer(code));
  }).catch(()=>lobStatus('เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง'));
}

/* --- ผ่านเซิร์ฟเวอร์ของเราเอง (WebSocket · Render) --- */
const wsUrl=()=>String(window.LS_SERVER||'').trim().replace(/\/$/,'');
function wsConnect(first){
  lobStatus('กำลังเชื่อมต่อเซิร์ฟเวอร์… (ถ้าเซิร์ฟเวอร์เพิ่งตื่น อาจใช้เวลา 30–60 วินาที)');
  let ws;try{ws=new WebSocket(wsUrl());}catch(e){lobStatus('ที่อยู่เซิร์ฟเวอร์ไม่ถูกต้อง');return;}
  net.ws=ws;net.tp='ws';net.role=null;
  const to=setTimeout(()=>{if(ws.readyState!==1){lobStatus('เซิร์ฟเวอร์ไม่ตอบสนอง ลองใหม่อีกครั้ง');try{ws.close();}catch(e){}if(net.ws===ws){net.ws=null;net.tp=null;}}},70000);
  ws.onopen=()=>{clearTimeout(to);net.hostConn={open:true,send(m){if(ws.readyState===1)ws.send(JSON.stringify(m));}};first();};
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data);}catch(e){return;}onServerMsg(m);};
  ws.onclose=()=>{clearTimeout(to);onWsClose(ws);};
  ws.onerror=()=>{};
}
function getName(){const v=($('nameIn').value||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,12);return v||'';}
function saveName(){try{localStorage.setItem('ls_name',getName());}catch(e){}}
/* ---- กลับเข้าห้องเมื่อหลุด ---- */
let recActive=false,recTries=0,recTimer=0,recFresh=false;
function readSess(){try{const s=JSON.parse(localStorage.getItem('ls_sess')||'null');if(s&&s.code&&s.token&&Date.now()-s.t<10*60*1000)return s;}catch(e){}return null;}
function clearSess(){try{localStorage.removeItem('ls_sess');}catch(e){}}
function onWsClose(ws){
  if(net.ws!==ws)return;net.ws=null;net.hostConn=null;
  if(recActive)return;
  if(net.role==='guest'&&net.started&&state!=='over'&&net.tp==='ws'){startReconnect(false);return;}
  if(net.role==='guest')onHostGone();else lobStatus('การเชื่อมต่อถูกปิด');
}
function startReconnect(fresh){
  if(recActive)return;recActive=true;recFresh=!!fresh;recTries=0;
  $('conn').style.display='block';
  recTimer=setInterval(recAttempt,2000);recAttempt();
}
function recDone(){recActive=false;clearInterval(recTimer);$('conn').style.display='none';}
function recFail(msg){
  recDone();clearSess();net.ws=null;net.hostConn=null;
  if(recFresh){net.role=null;net.tp=null;state='menu';$('mMenu').classList.remove('hide');uiToast(msg);}
  else guestEnd(false,msg);
}
function recAttempt(){
  if(net.ws)return;
  const sess=readSess();if(!sess){recFail('ไม่พบข้อมูลห้องเดิม');return;}
  if(++recTries>30){recFail('เชื่อมต่อใหม่ไม่สำเร็จ');return;}
  let ws;try{ws=new WebSocket(wsUrl());}catch(e){return;}
  net.ws=ws;net.tp='ws';
  ws.onopen=()=>{net.hostConn={open:true,send(m){if(ws.readyState===1)ws.send(JSON.stringify(m));}};net.hostConn.send({t:'rejoin',code:sess.code,token:sess.token});};
  ws.onmessage=ev=>{
    let m;try{m=JSON.parse(ev.data);}catch(e){return;}
    if(m.t==='start'){recDone();ws.onclose=()=>onWsClose(ws);onServerMsg(m);}
    else if(m.t==='error'){recFail(String(m.m||'กลับเข้าห้องไม่ได้'));try{ws.close();}catch(e){}}
    else onServerMsg(m);
  };
  ws.onclose=()=>{if(net.ws===ws){net.ws=null;net.hostConn=null;}};
  ws.onerror=()=>{};
}
function resumeRoom(){
  if(!readSess()||!wsUrl())return;
  $('mMenu').classList.add('hide');net.tp='ws';net.role='guest';startReconnect(true);
}
function hostViaWs(){saveName();wsConnect(()=>netToHost({t:'create',name:getName()}));}
function joinViaWs(code){saveName();wsConnect(()=>netToHost({t:'join',code,name:getName()}));}
function onServerMsg(m){
  if(!m||typeof m!=='object')return;
  switch(m.t){
    case 'joined':try{localStorage.setItem('ls_sess',JSON.stringify({code:m.code,token:m.token,t:Date.now()}));}catch(e){}
      net.role='guest';net.idx=m.idx;net.code=m.code;net.lobbyN=m.n;net.names=m.names||[];net.lobbyHost=m.idx===0;lobMsg='';if(!net.started)lobbyRender();break;
    case 'lobby':net.lobbyN=m.n;net.names=m.names||net.names;if(!net.started&&net.role)lobbyRender();break;
    case 'error':lobMsg=String(m.m||'เกิดข้อผิดพลาด');$('mEnd').classList.add('hide');state='menu';netLeave(false);$('mLobby').classList.remove('hide');lobbyRender();break;
    default:onHostMsg(m);
  }
}
function onHostGone(){
  if(net.role!=='guest')return;
  if(net.started&&state!=='over')guestEnd(false,'ขาดการเชื่อมต่อ');
  else if(!net.started){lobMsg='โฮสต์ปิดห้องแล้ว';netLeave(false);lobbyRender();}
}
async function joinViaRoom(room,code){
  const nr=await room.join('lsanct-'+code.toLowerCase());
  net.tp='room';net.room=nr;net.role=null;
  net.hostConn={open:true,send(m){nr.emit('g',m).catch(()=>{});}};
  const me=()=>{const p=nr.peers().find(x=>x.isMe&&x.sameTab);return p&&p.peer;};
  net.unsub=[
    nr.on('h',msg=>{
      const d=msg.data;if(!d||typeof d!=='object'||net.room!==nr)return;
      if(d.to&&d.to!==me())return;
      if(!net.hostPeer&&(d.t==='welcome'||d.t==='full'))net.hostPeer=msg.peer;
      if(msg.peer!==net.hostPeer&&net.hostPeer)return;
      onHostMsg(d);
    }),
    nr.onPeers(ch=>{if(net.hostPeer&&ch.left.some(p=>p.peer===net.hostPeer))onHostGone();})
  ];
  const hello=()=>{nr.emit('g',{t:'hello'}).catch(()=>{});};
  hello();
  net.helloTimer=setInterval(()=>{if(net.role==='guest'||net.room!==nr){clearInterval(net.helloTimer);return;}hello();},1500);
  setTimeout(()=>{if(net.room===nr&&net.role!=='guest'){lobMsg='ไม่พบห้องนี้ ตรวจรหัสหรือให้โฮสต์สร้างห้องใหม่';netLeave(false);lobbyRender();}},9000);
}
function joinViaPeer(code){
  const peer=new window.Peer();net.peer=peer;net.tp='peer';
  peer.on('open',()=>{
    const conn=peer.connect(NETPFX+code,{reliable:true});net.hostConn=conn;
    const to=setTimeout(()=>{if(net.role!=='guest'){lobStatus('เชื่อมต่อไม่ได้ ตรวจรหัสห้องหรือให้โฮสต์สร้างห้องใหม่');try{peer.destroy();}catch(e){}net.peer=null;net.hostConn=null;}},12000);
    conn.on('open',()=>{clearTimeout(to);net.role='guest';lobMsg='';lobbyRender();});
    conn.on('data',onHostMsg);
    conn.on('close',onHostGone);
  });
  peer.on('error',e=>lobStatus(e.type==='peer-unavailable'?'ไม่พบห้องนี้ ตรวจรหัสอีกครั้ง':'เชื่อมต่อผิดพลาด ('+e.type+')'));
}
function guestStart(n,idx){
  nP=n;ctl=idx;net.idx=idx;net.started=true;net.emap=new Map();net.mmap=new Map();minions=[];trees=[];
  state='intermission';T=0;wave=0;players=[];enemies=[];projs=[];zones=[];walls=[];fx=[];popups=[];sched=[];spawnQ=[];bossRef=null;ann=null;
  classChosen=false;targeting=-1;paused=false;shakeAmt=0;skillKey='';
  $('mLobby').classList.add('hide');$('mMenu').classList.add('hide');$('mEnd').classList.add('hide');$('mClass').classList.add('hide');
  setOnlineUi(true);
}
function onHostMsg(m){
  if(!m||typeof m!=='object')return;
  switch(m.t){
    case 'welcome':if(!net.role)net.role='guest';net.idx=m.idx;lobMsg='';lobbyRender();break;
    case 'full':lobMsg='ห้องเต็มหรือเริ่มเกมไปแล้ว';netLeave(false);lobbyRender();break;
    case 'start':guestStart(m.n,m.idx);break;
    case 'S':if(net.started)applyS(m);break;
    case 'E':if(net.started)applyE(m);break;
    case 'V':if(net.started)applyV(m);break;
    case 'G':if(net.started)applyG(m);break;
    case 'toast':toast(m.m);break;
    case 'end':guestEnd(!!m.win,String(m.reason||''));break;
  }
}
function applyS(s){
  if(state==='over')return;
  playSfxSets(s.sf||{},s.sg||{},ctl);
  if(players.length!==s.p.length){players=s.p.map((_,i)=>makePlayer(i));buildParty();skillKey='';}
  s.p.forEach((a,i)=>{
    const p=players[i];
    p.name=a.n||p.name;p.gold=a.g||0;p.pots={hp:a.pt[0],mp:a.pt[1]};p.buffs={hp:a.bf[0],mp:a.bf[1],dmg:a.bf[2],regen:a.bf[3],cdr:a.bf[4]||0};p.potCd={hp:a.pc[0]+s.T,mp:a.pc[1]+s.T};
    p.taken=a.tk||0;
    p.cls=a.cls;p.hp=a.hp;p.mana=a.mana;p.lvl=a.lvl;p.exp=a.exp;p.sp=a.sp;p.skillLv=a.sl;p.cd=a.cd;p.alive=!!a.al;
    p.hpBuff=a.hb;p.hpBuffUntil=a.hbu;p.buffMul=a.bm;p.buffUntil=a.bu;p.rapidUntil=a.ru;p.invuln=a.iv;p.flash=a.fl;p.castAnim=a.ca;p.recoil=a.rc;
    p.kills=a.k;p.dealt=a.d;p.healed=a.h;p.deaths=a.dt;p.slot=a.sl2;p.sx=a.x;p.sy=a.y;
    if(!p._init){p.x=a.x;p.y=a.y;p._init=1;}
  });
  s.p.forEach((a,i)=>{players[i].rev=a.rv?{target:players[a.rv[0]],t:a.rv[1],dur:a.rv[2]}:null;});
  T=s.T;wave=s.w;interT=s.it;net.left=s.l;nP=players.length;
  if(s.ch<churchHp-.5){const h=$('hurt');h.classList.add('on');setTimeout(()=>h.classList.remove('on'),180);}
  churchHp=s.ch;churchMax=s.cm;churchFlash=s.cf;net.speed=s.sp||1;if(s.sh>0)shake(s.sh);
  ann=s.an?{t:s.an.t,s:s.an.s,until:T+s.an.r}:null;
  const prev=state;state=s.s;
  if(state==='classSelect'&&prev!=='classSelect')showClassSelect();
  if(prev==='classSelect'&&state!=='classSelect')$('mClass').classList.add('hide');
  zones=s.z.map(z=>({kind:z.k,x:z.x,y:z.y,r:z.r,until:z.u,sd:z.sd}));
  walls=s.wl.map(w=>({x:w.x,hp:w.hp,max:w.m,until:w.u}));
}
function applyE(m){
  if(state==='over')return;
  let ea=net.ea;
  if(!ea||ea.q!==m.q){ea=net.ea={q:m.q,c:m.c,parts:{}};}
  ea.parts[m.i]=m.a;
  for(let i=0;i<ea.c;i++)if(!ea.parts[i])return;
  const all=[];for(let i=0;i<ea.c;i++)for(const e of ea.parts[i])all.push(e);
  net.ea=null;
  const seen=new Set(),arr=[];
  for(const e of all){
    const key=ENK[e[1]],d=EN[key];if(!d)continue;
    let o=net.emap.get(e[0]);
    if(!o){o={id:e[0],type:key,x:e[2],y:e[3],tx:e[2],ty:e[3],size:d.size,col:d.col,fly:!!d.fly,hop:!!d.hop,boss:!!d.boss,name:d.n,h:d.h,ph:rnd(0,6.28),age:rnd(0,5),
      flash:0,atkAnim:0,slowUntil:0,burnUntil:0,dazeUntil:0,reverseUntil:0,enraged:false,phase:0,dead:false,hp:100,maxHp:100};net.emap.set(e[0],o);}
    o.tx=e[2];o.ty=e[3];
    const hp=e[6]!==undefined?e[6]:e[4],mh=e[7]!==undefined?e[7]:100;
    if(hp<o.hp)o.flash=.1;
    o.hp=hp;o.maxHp=mh;
    const f=e[5];
    o.slowUntil=f&1?T+.5:0;o.burnUntil=f&2?T+.5:0;o.dazeUntil=f&4?T+.5:0;o.reverseUntil=f&16?T+.5:0;o.enraged=!!(f&8);o.phase=(f>>5)&3;
    seen.add(e[0]);arr.push(o);
  }
  for(const id of [...net.emap.keys()])if(!seen.has(id))net.emap.delete(id);
  enemies=arr;bossRef=arr.find(x=>x.boss)||null;
}
function applyG(m){m.g.forEach((arr,i)=>{if(players[i])players[i].gear=arr.map(a=>a?{r:a[0],s:a[1],n:a[2],af:a[3]}:null);});}
function applyV(v){
  if(state==='over')return;
  drops=(v.dr||[]).map(a=>({id:a[0],x:a[1],y:a[2],it:{r:a[3],s:a[4],n:a[5],af:a[6]}}));
  projs=v.b.map(a=>({x:a[0],y:a[1],vx:a[2],vy:a[3],kind:a[4],col:a[5],r:a[6],dead:false}));
  ebolts=(v.eb||[]).map(a=>({x:a[0],y:a[1],vx:a[2],vy:a[3],col:a[4],dead:false}));
  {const seen=new Set();
   minions=(v.mn||[]).map(a=>{let w=net.mmap.get(a[0]);if(!w){w={id:a[0],own:a[1],x:a[2],y:a[3],age:rnd(0,3),isM:true,atkAnim:0};net.mmap.set(a[0],w);}
     w.tx=a[2];w.ty=a[3];w.hp=a[4];w.max=100;w.face=a[5];w.flash=a[6];w.kind=a[7]?'elephant':'wolf';seen.add(a[0]);return w;});
   for(const id of [...net.mmap.keys()])if(!seen.has(id))net.mmap.delete(id);}
  trees=(v.tr||[]).map(a=>({id:a[0],x:a[1],y:a[2],hp:a[3],max:100,until:T+a[4],age:0}));
  fx=v.f;popups=v.po.map(a=>({x:a[0],y:a[1],txt:a[2],col:a[3],sz:a[4],t:a[5],dur:.85}));
}
function guestStep(dt){
  const g=dt*(net.speed||1);
  T+=g;
  const k=Math.min(1,dt*12);
  for(const p of players){if(p.sx!==undefined){p.x+=(p.sx-p.x)*k;p.y+=(p.sy-p.y)*k;}}
  for(const m of enemies){m.x+=(m.tx-m.x)*k;m.y+=(m.ty-m.y)*k;m.age+=g;if(m.flash>0)m.flash-=dt;if(m.atkAnim>0)m.atkAnim-=dt;}
  for(const b of projs){b.x+=b.vx*g;b.y+=b.vy*g;}
  for(const b of ebolts){b.x+=b.vx*g;b.y+=b.vy*g;}
  for(const w of minions){w.x+=(w.tx-w.x)*k;w.y+=(w.ty-w.y)*k;w.age+=g;if(w.flash>0)w.flash-=dt;}
  for(const t of trees)t.age+=g;
  for(const f of fx)f.t+=g;fx=fx.filter(f=>f.t<f.dur);
  for(const q of popups)q.t+=dt;popups=popups.filter(q=>q.t<q.dur);
  if(churchFlash>0)churchFlash-=dt;
}

window.__boot=boot;
window.__dbg={startGame,step,get state(){return state;},get wave(){return wave;},get players(){return players;},get enemies(){return enemies;},
  get churchHp(){return churchHp;},get T(){return T;},setBotAll(v){botAll=v;botsOn=true;},confirmAuto(){API.autoPick(window.__cls||['tank','mage','gunner','support']);},
  upd:update,cr:create,net:{hostRoom,joinRoom,hostStart,pickClass,castCmd,upgCmd,lobbyStart(){netToHost({t:'start'});},holdKey(k,v){held[k]=v;},goLobby,get minions(){return minions;},get trees(){return trees;},get ws(){return net.ws;},get drops(){return drops;},pickCmd,potCmd,buyCmd,get gear(){return players[ctl]&&players[ctl].gear;},get code(){return net.code;},get tp(){return net.tp;},get role(){return net.role;},get ctl(){return ctl;}},get nP(){return nP;}};
