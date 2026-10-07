/* ===== เสียง: สังเคราะห์สดด้วย WebAudio (ไม่ใช้ไฟล์เสียง) ===== */
const AUD={ctx:null,mode:2,sfxG:null,musG:null,echo:null,noise:null,last:{},voices:0,timer:null,next:0,step:0,drone:null};
try{const m=localStorage.getItem('ls_snd');if(m!==null&&/^[012]$/.test(m))AUD.mode=+m;}catch(e){}
const SND_NAME=['ปิด','เอฟเฟกต์','ทั้งหมด'];
function audApply(){
  if(!AUD.ctx)return;
  AUD.sfxG.gain.value=AUD.mode>=1?.55:0;
  AUD.musG.gain.value=AUD.mode>=2?.22:0;
}
function audInit(){
  if(!AUD.ctx){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      const c=new AC();AUD.ctx=c;
      const comp=c.createDynamicsCompressor();comp.connect(c.destination);
      AUD.sfxG=c.createGain();AUD.sfxG.connect(comp);
      AUD.musG=c.createGain();AUD.musG.connect(comp);
      AUD.echo=c.createDelay(1);AUD.echo.delayTime.value=.34;
      const fb=c.createGain();fb.gain.value=.38;AUD.echo.connect(fb);fb.connect(AUD.echo);
      const ef=c.createGain();ef.gain.value=.55;AUD.echo.connect(ef);ef.connect(AUD.musG);
      const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      AUD.noise=nb;
      musicStart();
    }catch(e){AUD.ctx=null;return;}
  }
  if(AUD.ctx.state==='suspended')AUD.ctx.resume();
  audApply();
}
function audToggle(){AUD.mode=(AUD.mode+2)%3;try{localStorage.setItem('ls_snd',String(AUD.mode));}catch(e){}audApply();return AUD.mode;}

function tone(f,d,type,v,slide,delay,dest){
  const c=AUD.ctx,t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+Math.min(.01,d/3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest||AUD.sfxG);o.start(t);o.stop(t+d+.03);
}
function noiseHit(d,v,fq,q,delay,type,dest){
  const c=AUD.ctx,t=c.currentTime+(delay||0),s=c.createBufferSource();
  s.buffer=AUD.noise;const f=c.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=fq;f.Q.value=q||1;
  const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f);f.connect(g);g.connect(dest||AUD.sfxG);s.start(t);s.stop(t+d+.03);
}
const SFXD={
  shoot:{min:90,f:()=>{tone(700+Math.random()*120,.07,'triangle',.06,300);noiseHit(.05,.04,2200,1.2);}},
  bullet:{min:70,f:()=>{noiseHit(.04,.06,3000,2);tone(900,.04,'square',.025,500);}},
  fire:{min:110,f:()=>{noiseHit(.18,.08,900,.8);tone(300,.18,'sawtooth',.04,150);}},
  shield:{min:120,f:()=>{tone(200,.15,'square',.05,120);noiseHit(.1,.05,600,1);}},
  kill:{min:50,f:()=>{tone(260+Math.random()*80,.09,'sine',.08,90);noiseHit(.06,.04,1200,1);}},
  hurt:{min:140,f:()=>{tone(110,.16,'sawtooth',.11,60);noiseHit(.1,.07,500,1);}},
  church:{min:300,f:()=>{tone(70,.9,'sine',.24,45);tone(140,.7,'triangle',.09);tone(210,.5,'sine',.05);noiseHit(.3,.09,300,.7);}},
  cast:{min:80,f:()=>{tone(520,.18,'sine',.07,980);tone(780,.18,'triangle',.035,1300,.03);}},
  boom:{min:120,f:()=>{noiseHit(.35,.18,250,.6);tone(90,.4,'sine',.2,35);}},
  heal:{min:200,f:()=>{tone(660,.25,'sine',.05);tone(990,.3,'sine',.04,0,.07);}},
  levelup:{min:400,f:()=>{[523,659,784,1047].forEach((q,i)=>tone(q,.3,'triangle',.09,0,i*.08));}},
  pot:{min:150,f:()=>{tone(300,.12,'sine',.09,500);tone(420,.12,'sine',.09,650,.12);}},
  buy:{min:100,f:()=>{tone(1200,.1,'square',.04);tone(1600,.18,'square',.04,0,.07);}},
  drop:{min:200,f:()=>{tone(880,.4,'sine',.06);tone(1320,.5,'sine',.045,0,.1);}},
  loot:{min:100,f:()=>{[784,988,1319].forEach((q,i)=>tone(q,.2,'triangle',.07,0,i*.05));}},
  wave:{min:600,f:()=>{tone(110,.6,'sawtooth',.13,90);tone(165,.6,'sawtooth',.07,130);noiseHit(.25,.09,400,1);}},
  boss:{min:1000,f:()=>{tone(55,1.6,'sawtooth',.2,40);tone(82,1.4,'square',.06,60);noiseHit(.8,.12,200,.7);}},
  ebolt:{min:150,f:()=>{tone(900,.25,'sine',.045,400);}},
  death:{min:200,f:()=>{tone(400,.5,'sawtooth',.09,60);}},
  revive:{min:300,f:()=>{[440,554,659,880].forEach((q,i)=>tone(q,.25,'sine',.07,0,i*.07));}},
  clear:{min:600,f:()=>{[392,494,587,784].forEach((q,i)=>tone(q,.4,'triangle',.07,0,i*.1));}},
  wolf:{min:300,f:()=>{tone(300,.5,'sawtooth',.1,520);tone(450,.4,'triangle',.06,700,.1);noiseHit(.2,.05,800,1);}},
  tree:{min:200,f:()=>{tone(120,.35,'sine',.14,60);noiseHit(.25,.08,350,.9);tone(240,.3,'triangle',.05,360,.05);}},
  howl:{min:600,f:()=>{tone(330,1.2,'sine',.12,520);tone(500,1.2,'triangle',.05,760,.1);}},
  stampede:{min:800,f:()=>{for(let i=0;i<8;i++){tone(70,.18,'sine',.2,40,i*.2);noiseHit(.12,.1,200,.8,i*.2);}tone(180,.8,'sawtooth',.09,260,.1);}},
  boar:{min:300,f:()=>{noiseHit(.5,.14,300,.8);tone(160,.6,'sawtooth',.09,90);tone(100,.4,'square',.05,70,.1);}},
  elephant:{min:500,f:()=>{tone(180,.9,'sawtooth',.14,320);tone(260,.7,'triangle',.07,480,.15);noiseHit(.3,.07,500,.8);}},
  win:{min:1000,f:()=>{[392,523,659,784,1047].forEach((q,i)=>tone(q,.5,'triangle',.1,0,i*.14));}},
  lose:{min:1000,f:()=>{[392,330,262,196].forEach((q,i)=>tone(q,.6,'sawtooth',.08,0,i*.22));}}
};
function sfxPlay(name){
  if(!AUD.ctx||AUD.mode<1)return;
  const d=SFXD[name];if(!d)return;
  const now=performance.now();if(now-(AUD.last[name]||0)<d.min)return;AUD.last[name]=now;
  if(AUD.voices>14)return;AUD.voices++;setTimeout(()=>{AUD.voices--;},220);
  try{d.f();}catch(e){}
}
const PERSONAL={buy:1,pot:1,loot:1,hurt:1,levelup:1};
function playSfxSets(g,p,me){
  if(!AUD.ctx||AUD.mode<1)return;
  for(const k in g)sfxPlay(k);
  for(const k in p){const [n,pi]=k.split(':');if(+pi===me)sfxPlay(n);}
}

/* ---- ดนตรีพื้นหลัง: เพนทาโทนิกสไตล์ระนาดเบาๆ + กลองเมื่อเข้าเวฟ ---- */
const ROOT=73.42,PENT=[0,2,5,7,9];
const nf=semi=>ROOT*Math.pow(2,semi/12);
function musicStart(){
  const c=AUD.ctx;
  const o1=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
  o1.type='sawtooth';o2.type='sawtooth';o1.frequency.value=55;o2.frequency.value=55.35;
  f.type='lowpass';f.frequency.value=170;g.gain.value=.45;
  o1.connect(f);o2.connect(f);f.connect(g);g.connect(AUD.musG);o1.start();o2.start();
  AUD.drone={f};AUD.next=c.currentTime+.2;AUD.step=0;
  AUD.timer=setInterval(musicTick,120);
}
function pluck(f,t,d,v){
  const c=AUD.ctx,o=c.createOscillator(),g=c.createGain();
  o.type='triangle';o.frequency.value=f;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(AUD.musG);g.connect(AUD.echo);o.start(t);o.stop(t+d+.05);
}
function kick(t,v){
  const c=AUD.ctx,o=c.createOscillator(),g=c.createGain();
  o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);
  g.gain.setValueAtTime(v||.9,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);
  o.connect(g);g.connect(AUD.musG);o.start(t);o.stop(t+.35);
}
function hat(t){
  const c=AUD.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=AUD.noise;f.type='highpass';f.frequency.value=6500;
  g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.0001,t+.05);
  s.connect(f);f.connect(g);g.connect(AUD.musG);s.start(t);s.stop(t+.08);
}
function bass(f,t,d){
  const c=AUD.ctx,o=c.createOscillator(),fl=c.createBiquadFilter(),g=c.createGain();
  o.type='sawtooth';o.frequency.value=f;fl.type='lowpass';fl.frequency.value=320;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(fl);fl.connect(g);g.connect(AUD.musG);o.start(t);o.stop(t+d+.05);
}
function playStep(s,t,inten){
  const beat=s%8;
  if(Math.random()<(inten?.5:.33)){
    const deg=PENT[Math.floor(Math.random()*PENT.length)]+(Math.random()<.4?12:0)+12;
    pluck(nf(deg),t,.6+Math.random()*.4,.085);
  }
  if(inten>=1){
    if(beat===0||beat===4)kick(t,.9);
    if(beat%2===1)hat(t);
    if(beat===0)bass(nf([0,0,5,7][(s>>3)%4]-12),t,.9);
  }
  if(inten>=2&&(beat===2||beat===6))kick(t,.6);
  if(inten>=2&&beat===3)bass(nf(6-12),t,.4);
}
function musicTick(){
  const c=AUD.ctx;if(!c||AUD.mode<2)return;
  if(AUD.next<c.currentTime)AUD.next=c.currentTime+.05;
  const inten=state==='wave'?(bossRef?2:1):0,spb=60/[64,90,116][inten]/2;
  while(AUD.next<c.currentTime+.5){playStep(AUD.step++,AUD.next,inten);AUD.next+=spb;}
  AUD.drone.f.frequency.setTargetAtTime(inten?250:160,c.currentTime,.6);
}
