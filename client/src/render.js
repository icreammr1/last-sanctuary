
/* ===================== RENDER ===================== */
function band(g,x,y,w,h,c1,c2,n){const bh=h/n;for(let i=0;i<n;i++){g.fillStyle(lerpC(c1,c2,i/(n-1)),1);g.fillRect(x,y+i*bh,w,bh+1);}}
function poly(g,pts,col,a){g.fillStyle(col,a===undefined?1:a);g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fillPath();}
function polyLine(g,pts,col,w,a){g.lineStyle(w,col,a===undefined?1:a);g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.strokePath();}
let LOD=0;
function glow(g,x,y,r,col,a){
  if(LOD>=1){g.fillStyle(col,a*.35);g.fillCircle(x,y,r*.7);return;}
  g.fillStyle(col,a*.3);g.fillCircle(x,y,r);g.fillStyle(col,a*.3);g.fillCircle(x,y,r*.66);g.fillStyle(col,a*.5);g.fillCircle(x,y,r*.36);}
function shadow(g,x,y,w){g.fillStyle(0x000000,.38);g.fillEllipse(x,y,w,w*.3);}

function prang(g,x,b,h,col){
  const w=h*.3;g.fillStyle(col,1);g.fillRect(x-w*.95,b-h*.1,w*1.9,h*.1);
  const tiers=6;let y=b-h*.1;
  for(let i=0;i<tiers;i++){
    const t=i/tiers,t2=(i+1)/tiers,w0=w*(.8-.55*t),w1=w*(.8-.55*t2),th=h*.7/tiers;
    poly(g,[x-w0,y,x+w0,y,x+w1+2,y-th,x-w1-2,y-th],col);
    g.fillStyle(col,1);g.fillTriangle(x-w0-5,y,x-w0+3,y,x-w0,y-10);g.fillTriangle(x+w0-3,y,x+w0+5,y,x+w0,y-10);
    y-=th;
  }
  poly(g,[x-w*.14,y,x+w*.14,y,x,b-h],col);
}
function chedi(g,x,b,h,col){
  g.fillStyle(col,1);g.fillRect(x-h*.3,b-h*.12,h*.6,h*.12);g.fillRect(x-h*.24,b-h*.2,h*.48,h*.09);
  g.fillEllipse(x,b-h*.38,h*.44,h*.4);g.fillRect(x-h*.22,b-h*.38,h*.44,h*.18);
  g.fillRect(x-h*.05,b-h*.62,h*.1,h*.22);g.fillTriangle(x-h*.05,b-h*.6,x+h*.05,b-h*.6,x,b-h);
}
function ruinWall(g,x0,x1,b,h,col,R){
  const pts=[x0,b];let x=x0;
  while(x<x1){pts.push(x,b-h*(.35+R()*.65));x+=14+R()*18;pts.push(x,b-h*(.35+R()*.65));}
  pts.push(x1,b);poly(g,pts,col);
}
function palm(g,x,b,h,col,R){
  g.lineStyle(5,col,1);g.beginPath();g.moveTo(x,b);g.lineTo(x+h*.08,b-h*.5);g.lineTo(x+h*.02,b-h);g.strokePath();
  const tx=x+h*.02,ty=b-h;g.lineStyle(3,col,1);
  for(let i=0;i<7;i++){const a=-Math.PI*(.05+.9*i/6),L=h*.42;g.beginPath();g.moveTo(tx,ty);g.lineTo(tx+Math.cos(a)*L*.55,ty+Math.sin(a)*L*.55-4);g.lineTo(tx+Math.cos(a)*L,ty+Math.sin(a)*L*.5+L*.35);g.strokePath();}
}
function makeBg(sc){
  const g=sc.make.graphics({x:0,y:0,add:false});
  let sd=11;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  band(g,0,0,W,470,0x0e0408,0x93301a,64);
  for(let i=0;i<7;i++){g.fillStyle(0xff7a2a,.045);g.fillEllipse(760,462,1900-i*230,300-i*38);}
  for(let r=210;r>66;r-=12){g.fillStyle(0xff3a1c,.022);g.fillCircle(910,135,r);}
  g.fillStyle(0xd8402a,1);g.fillCircle(910,135,60);
  g.fillStyle(0x2e0d0d,1);g.fillCircle(926,124,53);
  for(let i=0;i<18;i++){g.fillStyle(0x1a0709,.28);g.fillEllipse(R()*W,40+R()*340,260+R()*420,26+R()*40);}
  // fires behind ruins
  for(const fx0 of[520,760,1040,1210]){for(let r=130;r>20;r-=22){g.fillStyle(0xff6a1f,.05);g.fillCircle(fx0,452,r);}}
  // far skyline
  const far=0x2d0e10;
  chedi(g,380,462,120,far);prang(g,560,462,200,far);chedi(g,690,462,92,far);prang(g,780,462,150,far);
  prang(g,1010,462,185,far);chedi(g,1110,462,100,far);prang(g,1215,462,125,far);
  ruinWall(g,300,470,462,46,far,R);ruinWall(g,820,980,462,56,far,R);ruinWall(g,1130,1290,462,50,far,R);
  // near layer
  const near=0x1a0708;
  ruinWall(g,240,420,470,38,near,R);ruinWall(g,600,760,470,44,near,R);ruinWall(g,930,1100,470,36,near,R);
  palm(g,470,472,150,near,R);palm(g,880,472,130,near,R);palm(g,1160,474,160,near,R);palm(g,330,474,120,near,R);
  // ground
  band(g,0,455,W,265,0x2b130f,0x080303,44);
  g.fillStyle(0x5a2a1a,.28);g.fillRect(0,GY0-4,W,GY1-GY0+34);
  for(let i=0;i<7;i++){g.fillStyle(0xd0602a,.05);g.fillEllipse(640,458,1500-i*150,44-i*4);}
  for(let i=0;i<120;i++){g.fillStyle(0x120605,.45);g.fillEllipse(220+R()*1060,GY0+R()*(GY1-GY0+20),6+R()*14,3+R()*4);}
  for(let i=0;i<26;i++){const x=240+R()*1000,y=GY0+10+R()*170;g.lineStyle(1,0x0d0403,.55);g.beginPath();g.moveTo(x,y);g.lineTo(x+14,y+4);g.lineTo(x+22,y-3);g.strokePath();}
  for(let i=0;i<22;i++){g.fillStyle(0x3a1d17,.7);g.fillRect(260+R()*980,GY0+10+R()*170,5+R()*8,3+R()*4);}
  band(g,0,640,W,80,0x0a0404,0x040101,10);
  church(g);
  g.generateTexture('bg',W,H);g.destroy();
}
function church(g){
  const gold=0xe8b85a;
  for(let r=230;r>60;r-=20){g.fillStyle(0xff9a3a,.03);g.fillCircle(105,470,r);}
  g.fillStyle(0x2a1a14,1);g.fillRect(0,586,225,16);g.fillStyle(0x3b2820,1);g.fillRect(8,568,205,18);
  g.fillStyle(0x7a604a,1);g.fillRect(28,470,160,98);
  g.fillStyle(0x93785e,1);g.fillRect(28,470,160,12);
  for(const cx of[34,70,134,172]){g.fillStyle(0xa68a68,1);g.fillRect(cx,474,9,94);g.fillStyle(gold,.8);g.fillRect(cx-1,474,11,4);}
  g.fillStyle(0x2a1408,1);g.fillRect(84,492,48,76);g.fillStyle(0xffb347,.9);g.fillRect(88,496,40,72);
  g.fillStyle(0xffe3a3,.8);g.fillRect(100,504,16,64);
  for(const wx of[48,152]){g.fillStyle(0xffb347,.85);g.fillRect(wx,496,14,26);}
  poly(g,[8,472,208,472,176,424,40,424],0x7a1e1a);polyLine(g,[8,472,40,424,176,424,208,472],gold,2.5,.9);
  poly(g,[48,424,168,424,144,378,72,378],0x8a2420);polyLine(g,[48,424,72,378,144,378,168,424],gold,2.5,.9);
  poly(g,[78,378,138,378,108,334],0x992a24);polyLine(g,[78,378,108,334,138,378],gold,2.5,.9);
  g.lineStyle(3,gold,1);g.beginPath();g.moveTo(108,334);g.lineTo(108,316);g.strokePath();g.fillStyle(gold,1);g.fillTriangle(104,322,112,322,108,306);
  for(const [x,d] of[[8,-1],[208,1],[40,-1],[176,1],[72,-1],[144,1]]){const y=x===8||x===208?472:(x===40||x===176?424:378);g.fillStyle(gold,1);g.fillTriangle(x,y,x+d*12,y-14,x+d*3,y-2);}
  g.fillStyle(0x000000,.25);g.fillRect(28,470,160,10);
}
function drawChurchFx(g){
  const f=1+Math.sin(T*7)*.08+Math.sin(T*13.3)*.05;
  glow(g,108,530,150*f,0xffa04a,.2);
  const hp=churchHp/churchMax,n=hp<.33?7:(hp<.66?3:0);
  for(let i=0;i<n;i++){
    const fxp=30+i*28+(i%2)*6,fh=24+Math.sin(T*9+i*2)*8+(1-hp)*22;
    glow(g,fxp,456,30,0xff6a1f,.35);
    g.fillStyle(0xff7a1f,.85);g.fillTriangle(fxp-9,462,fxp+9,462,fxp+Math.sin(T*8+i)*3,462-fh);
    g.fillStyle(0xffd27a,.9);g.fillTriangle(fxp-4,462,fxp+4,462,fxp,462-fh*.6);
    g.fillStyle(0x1a0a0a,.3);g.fillCircle(fxp+Math.sin(T*2+i)*10,420-((T*30+i*40)%80),10);
  }
  if(churchFlash>0){g.fillStyle(0xff3030,Math.min(.5,churchFlash*1.6));g.fillRect(0,320,225,280);}
}

/* ---- enemies ---- */
function drawPret(g,m,X,k,fl){
  const y=m.y,a=m.age,bob=Math.sin(a*3+m.ph)*2*k,tn=c=>fl?0xffffff:c;
  g.lineStyle(5*k,tn(0x4b2e20),1);g.beginPath();g.moveTo(X-8*k,y-40*k);g.lineTo(X-13*k,y);g.moveTo(X+8*k,y-40*k);g.lineTo(X+14*k,y);g.strokePath();
  g.fillStyle(tn(0xb57a52),1);g.fillEllipse(X,y-56*k,44*k,54*k);
  g.lineStyle(2*k,tn(0x7a4a30),1);for(let i=0;i<4;i++){g.beginPath();g.moveTo(X-14*k,y-66*k+i*8*k);g.lineTo(X+10*k,y-64*k+i*8*k);g.strokePath();}
  g.lineStyle(4*k,tn(0xb57a52),1);
  g.beginPath();g.moveTo(X-14*k,y-76*k);g.lineTo(X-40*k,y-54*k+bob);g.lineTo(X-52*k,y-24*k+bob);g.strokePath();
  g.beginPath();g.moveTo(X-8*k,y-78*k);g.lineTo(X-30*k,y-60*k-bob);g.lineTo(X-44*k,y-34*k-bob);g.strokePath();
  g.fillStyle(tn(0xd8b894),1);g.fillCircle(X-4*k,y-92*k,12*k);
  g.fillStyle(0x201008,1);g.fillCircle(X-8*k,y-94*k,2.6*k);g.fillCircle(X-1*k,y-94*k,2.6*k);
  g.fillStyle(0xffd24a,1);g.fillCircle(X-8*k,y-94*k,1.2*k);g.fillCircle(X-1*k,y-94*k,1.2*k);
  g.fillStyle(0xff3a2a,1);g.fillRect(X-10*k,y-87*k,9*k,1.6*k);
}
function drawEnemyLite(g,m){
  const x=m.x,y=m.y,s=m.size,fl=m.flash>0,col=fl?0xffffff:m.col;
  g.fillStyle(0x000000,.3);g.fillEllipse(x,y,s*1.6,s*.5);
  if(m.fly){g.fillStyle(col,.9);g.fillCircle(x,y,s*.8);g.fillStyle(0xff2a2a,1);g.fillCircle(x-s*.25,y-2,2);return;}
  const h=Math.min(m.h*.8,s*2.4);
  g.fillStyle(col,.9);g.fillEllipse(x,y-h*.5,s*1.3,h);
  g.fillStyle(0x111111,1);g.fillCircle(x-s*.25,y-h*.7,Math.max(1.6,s*.1));g.fillCircle(x+s*.05,y-h*.7,Math.max(1.6,s*.1));
}
function drawEnemy(g,m){
  if(LOD>=2&&!m.boss){drawEnemyLite(g,m);return;}
  const x=m.x,y=m.y,s=m.size,a=m.age,fl=m.flash>0,tn=c=>fl?0xffffff:c;
  let dx=0;if(m.atkAnim>0)dx=-Math.sin(m.atkAnim/.22*Math.PI)*8;
  const X=x+dx,bob=Math.sin(a*5+m.ph)*2;
  if(m.fly)shadow(g,x,clamp(y+120,GY0+20,GY1),22);
  switch(m.type){
  case 'khamot':{shadow(g,x,y,26);const cy=y-18+bob*2;
    glow(g,X,cy,30,0x6dff8a,.55);
    g.fillStyle(tn(0x57e07a),.55);g.fillTriangle(X+6,cy-7,X+34+Math.sin(a*9)*4,cy+Math.sin(a*7)*6,X+6,cy+7);
    g.fillStyle(tn(0xcfffd6),1);g.fillCircle(X,cy,10);
    g.fillStyle(0x0b2a14,1);g.fillCircle(X-4,cy-2,2.4);g.fillCircle(X+1,cy-2,2.4);g.fillRect(X-5,cy+3,7,2);break;}
  case 'krahang':{const hop=Math.abs(Math.sin(a*3.2+m.ph))*14,cy=y-24-hop;shadow(g,x,y,30-hop*.6);
    const wf=Math.sin(a*12)*5;
    g.fillStyle(tn(0x8a6a3a),1);g.fillEllipse(X+9,cy-8-wf,24,12);g.fillEllipse(X+13,cy+2+wf,22,10);
    g.fillStyle(tn(0x2b1d17),1);g.fillEllipse(X,cy+2,22,28);
    g.fillStyle(tn(0xe6d9b8),1);g.fillCircle(X-2,cy-14,9);
    glow(g,X-3,cy-15,11,0xff3b2f,.35);
    g.fillStyle(0xff3b2f,1);g.fillCircle(X-5,cy-15,2);g.fillCircle(X,cy-15,2);break;}
  case 'taihong':{shadow(g,x,y,36);const cy=y-34+bob;
    glow(g,X,cy,38,0xb48cff,.35);
    g.fillStyle(tn(0xd9d2ee),.93);g.fillTriangle(X-16,y-3,X+16,y-3,X,cy-10);
    for(let i=0;i<4;i++)g.fillCircle(X-12+i*8,y-3+Math.sin(a*6+i)*2,4.5);
    g.fillCircle(X,cy-12,10);
    g.lineStyle(2,0x1a1024,1);for(let i=0;i<5;i++){g.beginPath();g.moveTo(X-8+i*4,cy-19);g.lineTo(X-10+i*4+Math.sin(a*4+i)*3,cy+8);g.strokePath();}
    g.fillStyle(0x1a0a22,1);g.fillCircle(X-3.5,cy-12,2.8);g.fillCircle(X+3.5,cy-12,2.8);
    g.fillStyle(0xff5555,1);g.fillCircle(X-3.5,cy-12,1.2);g.fillCircle(X+3.5,cy-12,1.2);
    g.fillStyle(0xd0334a,1);g.fillRect(X-1.5,cy-6,3,7+Math.sin(a*5)*3);break;}
  case 'pret':{shadow(g,x,y,78);drawPret(g,m,X,1,fl);break;}
  case 'krasue':{const cy=y+Math.sin(a*3+m.ph)*5;
    glow(g,X,cy,38,0xff6a7a,.35);
    g.lineStyle(3,tn(0xb3162d),.9);
    for(let i=0;i<3;i++){g.beginPath();g.moveTo(X+4+i*3,cy+9);for(let j=1;j<=8;j++)g.lineTo(X+4+i*3+j*4,cy+9+j*4+Math.sin(a*6+j*.8+i)*5);g.strokePath();}
    g.fillStyle(tn(0xe9dccb),1);g.fillCircle(X,cy,14);
    g.lineStyle(2,0x120a10,1);for(let i=0;i<6;i++){g.beginPath();g.moveTo(X-10+i*4,cy-12);g.lineTo(X-15+i*5+Math.sin(a*5+i)*2,cy+4);g.strokePath();}
    g.fillStyle(0xff2a2a,1);g.fillCircle(X-5,cy-2,2.8);g.fillCircle(X+3,cy-2,2.8);
    g.fillStyle(0xffffff,1);g.fillTriangle(X-4,cy+5,X-2,cy+5,X-3,cy+10);g.fillTriangle(X+1,cy+5,X+3,cy+5,X+2,cy+10);break;}
  case 'pop':{shadow(g,x,y,92);glow(g,X,y-s,s*1.3,0x9a2438,.28);
    g.fillStyle(tn(0x1a0b10),1);g.fillEllipse(X,y-s*.9,s*1.5,s*1.7);
    g.fillEllipse(X-4,y-s*1.5,s*1.9,s*.75);
    g.lineStyle(8,tn(0x25101a),1);g.beginPath();g.moveTo(X-14,y-s*1.4);g.lineTo(X-s*.95,y-s*.55+bob);g.strokePath();
    g.beginPath();g.moveTo(X+2,y-s*1.4);g.lineTo(X-s*.75,y-s*.3-bob);g.strokePath();
    g.fillStyle(0xe8e0d0,1);for(let i=0;i<3;i++)g.fillTriangle(X-s*.95-4+i*4,y-s*.55+bob,X-s*.95+i*4,y-s*.55+bob,X-s*.95-3+i*4,y-s*.55+bob+10);
    g.fillStyle(tn(0x2a1218),1);g.fillCircle(X-8,y-s*1.8,s*.38);
    g.fillStyle(0x8a6a4a,1);g.fillTriangle(X-22,y-s*1.95,X-14,y-s*2.0,X-24,y-s*2.4);g.fillTriangle(X+4,y-s*1.95,X-2,y-s*2.0,X+8,y-s*2.4);
    glow(g,X-14,y-s*1.82,10,0xff2a3a,.5);g.fillStyle(0xff2a3a,1);g.fillCircle(X-14,y-s*1.82,3);g.fillCircle(X-4,y-s*1.82,3);
    g.fillStyle(0xffffff,1);g.fillTriangle(X-14,y-s*1.6,X-11,y-s*1.6,X-12.5,y-s*1.6+9);g.fillTriangle(X-6,y-s*1.6,X-3,y-s*1.6,X-4.5,y-s*1.6+9);break;}
  case 'phrai':{shadow(g,x,y,30);const cy=y-30+bob*2;
    glow(g,X,cy,34,0x6fe3ff,.5);
    g.fillStyle(tn(0x8ff0ff),.85);g.fillTriangle(X-12,y-3,X+12,y-3,X,cy-6);
    g.fillStyle(tn(0xd8fbff),1);g.fillCircle(X,cy-10,9);
    g.fillStyle(0x0a3a4a,1);g.fillCircle(X-3,cy-11,2.2);g.fillCircle(X+3,cy-11,2.2);
    g.lineStyle(2.5,0xcfe9ff,1);g.beginPath();g.arc(X-14,cy,12,-1.2,1.2,false);g.strokePath();
    g.lineStyle(1,0xffffff,.8);g.lineBetween(X-14+Math.cos(-1.2)*12,cy+Math.sin(-1.2)*12,X-14+Math.cos(1.2)*12,cy+Math.sin(1.2)*12);
    if(m.atkAnim>0)glow(g,X-22,cy,12,0x6fe3ff,.9);break;}
  case 'phantom':{shadow(g,x,y,34);const cy=y-34+bob*2;
    glow(g,X,cy,38,0xc7b8ff,.3);
    g.fillStyle(tn(0x9d90d8),.78);g.fillTriangle(X-15,y-2,X+15,y-2,X,cy-14);
    for(let i=0;i<4;i++)g.fillCircle(X-11+i*7.5,y-3+Math.sin(a*7+i)*2.5,4.5);
    g.fillStyle(tn(0xf1ecff),.95);g.fillCircle(X-1,cy-14,10);
    g.fillStyle(0x1a1030,1);g.fillEllipse(X-4,cy-14,5,7);g.fillEllipse(X+3,cy-14,5,7);g.fillRect(X-4,cy-8,8,2);
    g.lineStyle(3,tn(0xcdbfff),.9);g.beginPath();g.moveTo(X-8,cy-4);g.lineTo(X-30,cy+6+Math.sin(a*8)*5);g.moveTo(X-8,cy+2);g.lineTo(X-28,cy+18+Math.sin(a*8+1)*5);g.strokePath();break;}
  case 'yak':{shadow(g,x,y,110);glow(g,X,y-s,s*1.4,0x6a8f5a,.2);
    g.lineStyle(14,tn(0x2f4a28),1);g.beginPath();g.moveTo(X-12,y-s*.8);g.lineTo(X-14,y);g.moveTo(X+14,y-s*.8);g.lineTo(X+16,y);g.strokePath();
    g.fillStyle(tn(0x4f7a3f),1);g.fillEllipse(X,y-s*1.25,s*1.6,s*1.5);
    g.fillStyle(tn(0x6aa052),1);g.fillEllipse(X-4,y-s*1.5,s*1.9,s*.7);
    g.lineStyle(10,tn(0x4f7a3f),1);g.beginPath();g.moveTo(X-18,y-s*1.5);g.lineTo(X-s*1.0,y-s*.9+bob);g.lineTo(X-s*1.1,y-s*.35+bob);g.strokePath();
    g.fillStyle(tn(0x6aa052),1);g.fillCircle(X-8,y-s*1.95,s*.4);
    g.fillStyle(0xf2e6c4,1);g.fillTriangle(X-22,y-s*2.05,X-16,y-s*2.0,X-26,y-s*2.5);g.fillTriangle(X-2,y-s*2.05,X+4,y-s*2.0,X+8,y-s*2.5);
    glow(g,X-14,y-s*1.97,9,0xffd24a,.6);g.fillStyle(0xffd24a,1);g.fillCircle(X-14,y-s*1.97,3);g.fillCircle(X-3,y-s*1.97,3);
    g.fillStyle(0xffffff,1);g.fillTriangle(X-16,y-s*1.75,X-12,y-s*1.75,X-14,y-s*1.75+10);g.fillTriangle(X-7,y-s*1.75,X-3,y-s*1.75,X-5,y-s*1.75+10);break;}
  case 'boss1':{const k=s/34;shadow(g,x,y,170);
    glow(g,X,y-s*1.2,s*1.9,m.enraged?0xff3a1a:0xff9a3a,.3);
    drawPret(g,m,X,k,fl);
    g.lineStyle(4,0xe8b85a,1);g.beginPath();g.moveTo(X-24*k,y-70*k);g.lineTo(X+18*k,y-48*k);g.moveTo(X-24*k,y-48*k);g.lineTo(X+18*k,y-70*k);g.strokePath();
    g.fillStyle(0xe8b85a,1);for(let i=0;i<5;i++){const cx=X-4*k-20*k+i*10*k;g.fillTriangle(cx-5*k,y-102*k,cx+5*k,y-102*k,cx,y-102*k-(i%2?14:22)*k);}
    g.fillRect(X-26*k,y-104*k,44*k,5*k);break;}
  case 'boss2':{shadow(g,x,y,200);const cy=y-s*1.1+Math.sin(a*2)*6;
    glow(g,X,cy,s*2.3,0x7a2cff,.3);
    g.lineStyle(3,0xe8b85a,.5);g.strokeCircle(X,cy,s*1.25+Math.sin(a*3)*4);g.strokeCircle(X,cy,s*1.55+Math.sin(a*2)*5);
    g.fillStyle(tn(0x2a1050),.96);g.fillTriangle(X-s*.95,y-4,X+s*.95,y-4,X,cy-s*.6);
    g.fillStyle(tn(0x4a2090),.9);g.fillTriangle(X-s*.55,y-4,X+s*.55,y-4,X,cy-s*.2);
    for(let i=0;i<6;i++)g.fillCircle(X-s*.8+i*s*.32,y-4+Math.sin(a*4+i)*4,s*.14);
    for(let i=0;i<4;i++){g.lineStyle(6-i,0x9a6bff,.7);g.beginPath();g.moveTo(X-8,cy-12+i*9);g.lineTo(X-s*.7-i*10,cy+4+i*16+Math.sin(a*3+i)*10);g.lineTo(X-s*1.15-i*8,cy+26+i*22+Math.sin(a*2+i)*10);g.strokePath();}
    g.fillStyle(tn(0xe8dcff),1);g.fillCircle(X-4,cy-s*.72,s*.27);
    g.fillStyle(0xe8b85a,1);g.fillRect(X-s*.3,cy-s*.98,s*.62,5);g.fillTriangle(X-s*.22,cy-s*.98,X+s*.2,cy-s*.98,X-2,cy-s*1.55);g.fillTriangle(X-s*.32,cy-s*.98,X-s*.14,cy-s*.98,X-s*.28,cy-s*1.25);g.fillTriangle(X+s*.1,cy-s*.98,X+s*.3,cy-s*.98,X+s*.26,cy-s*1.25);
    for(const ex of[-.14,.08])for(const ey of[-.78,-.66]){glow(g,X+ex*s,cy+ey*s,8,0xff3a5a,.5);g.fillStyle(0xff3a5a,1);g.fillCircle(X+ex*s,cy+ey*s,2.4);}
    break;}
  }
  // status
  if(LOD>=2)return;
  if(T<m.slowUntil){g.lineStyle(2,0x7fe0d4,.8);g.strokeEllipse(x,y,s*1.8,s*.6);}
  if(T<m.burnUntil){const fy=m.fly?y-s-8:y-m.h-6;g.fillStyle(0xff7a1f,.9);g.fillTriangle(x-6,fy+8,x+6,fy+8,x+Math.sin(a*14)*2,fy-6);}
  if(T<m.dazeUntil&&T>=m.reverseUntil){const sy=(m.fly?y-s-14:y-m.h-8);for(let i=0;i<3;i++){const an=T*5+i*2.1;g.fillStyle(0xffe08a,1);g.fillCircle(x+Math.cos(an)*14,sy+Math.sin(an)*4,2.6);}}
  if(!m.boss&&m.hp<m.maxHp){const bw=Math.max(24,s*1.6),by=m.fly?y-s-16:y-m.h-8;g.fillStyle(0,.6);g.fillRect(x-bw/2,by,bw,4);g.fillStyle(0xd8473b,1);g.fillRect(x-bw/2,by,bw*Math.max(0,m.hp/m.maxHp),4);}
}

/* ---- players ---- */
function drawPlayer(g,p){
  const x=p.x,y=p.y,c=C(p),col=c.col,bob=Math.sin(T*2.4+p.i*1.7)*1.5,fl=p.flash>0;
  if(!p.alive){
    shadow(g,x,y,34);g.fillStyle(0x3a3a46,1);g.fillRect(x-9,y-28,18,28);g.fillCircle(x,y-28,9);
    g.lineStyle(2,0x8a8a99,1);g.beginPath();g.moveTo(x,y-34);g.lineTo(x,y-18);g.moveTo(x-5,y-28);g.lineTo(x+5,y-28);g.strokePath();
    glow(g,x+16,y-6,12,0xffc86b,.5+Math.sin(T*8+p.i)*.1);
    const rv=players.find(o=>o.rev&&o.rev.target===p);
    if(rv){const pr=rv.rev.t/rv.rev.dur;g.lineStyle(4,0x9fffb0,1);g.beginPath();g.arc(x,y-30,24,-Math.PI/2,-Math.PI/2+pr*Math.PI*2,false);g.strokePath();
      g.lineStyle(2,0x9fffb0,.5);g.lineBetween(rv.x,rv.y-30,x,y-30);}
    return;
  }
  shadow(g,x,y,40);
  if(p===players[ctl]){g.lineStyle(2,0xffe08a,.9);g.strokeEllipse(x,y,48+Math.sin(T*4)*3,15);}
  if(T<p.invuln){g.lineStyle(2,0x9fffb0,.6);g.strokeCircle(x,y-28,26);}
  const cloak=fl?0xffffff:lerpC(col,0x1a0d0d,.55),trim=fl?0xffffff:col,wd=p.cls==='tank'?3:0,rc=p.recoil>0?-3:0;
  g.lineStyle(4,0x2a1a14,1);g.lineBetween(x-5,y-14,x-6,y);g.lineBetween(x+5,y-14,x+6,y);
  poly(g,[x-9-wd,y-14,x+9+wd,y-14,x+15+wd,y-2,x-15-wd,y-2],cloak);
  g.fillStyle(cloak,1);g.fillRoundedRect(x-9-wd,y-42+bob,18+wd*2,30,5);
  g.fillStyle(trim,1);g.fillRect(x-9-wd,y-24+bob,18+wd*2,3);
  g.fillStyle(fl?0xffffff:0xe8c9a0,1);g.fillCircle(x,y-50+bob,8);
  g.fillStyle(0x1a0f0c,1);g.fillRect(x-8,y-56+bob,16,5);
  switch(p.cls){
  case 'archer':
    poly(g,[x-15,y-52+bob,x+15,y-52+bob,x,y-70+bob],0xb89a5a);
    g.lineStyle(3,0xd9b36a,1);g.beginPath();g.arc(x+14+rc,y-30,18,-1.15,1.15,false);g.strokePath();
    g.lineStyle(1,0xeeeeee,.8);g.lineBetween(x+14+rc+Math.cos(-1.15)*18,y-30+Math.sin(-1.15)*18,x+14+rc+Math.cos(1.15)*18,y-30+Math.sin(1.15)*18);break;
  case 'mage':
    poly(g,[x-11,y-56+bob,x+11,y-56+bob,x+3,y-82+bob],0x5a1f7a);g.fillStyle(0xe8b85a,1);g.fillRect(x-11,y-57+bob,22,3);
    g.lineStyle(3,0x8a5a2a,1);g.lineBetween(x+14,y-4,x+14,y-62);glow(g,x+14,y-66,13,0xff7a3c,.8);g.fillStyle(0xffd27a,1);g.fillCircle(x+14,y-66,5);break;
  case 'gunner':
    g.fillStyle(0x2a1a14,1);g.fillRect(x-13,y-57+bob,26,4);g.fillRect(x-7,y-66+bob,14,10);g.fillStyle(0xe8c46a,1);g.fillRect(x-7,y-59+bob,14,2);
    g.fillStyle(0x3a3a3a,1);g.fillRect(x+4+rc,y-34,32,4);g.fillStyle(0x6a4a2a,1);g.fillRect(x+2+rc,y-32,12,8);g.fillStyle(0xe8c46a,1);g.fillRect(x+30+rc,y-35,3,6);break;
  case 'support':
    glow(g,x,y-52+bob,18,0x7fe0d4,.55);g.lineStyle(2,0xbffff6,.9);g.strokeCircle(x,y-62+bob,9);
    g.lineStyle(3,0xd8c8a0,1);g.lineBetween(x+14,y-4,x+14,y-58);glow(g,x+14,y-62,12,0x7fe0d4,.7);g.fillStyle(0xe8fffb,1);g.fillCircle(x+14,y-62,4.5);break;
  case 'tank':
    g.fillStyle(0x9aa6c0,1);g.fillRect(x-9,y-60+bob,18,9);g.fillStyle(0xd8473b,1);g.fillTriangle(x-3,y-60+bob,x+3,y-60+bob,x,y-72+bob);
    g.fillStyle(0x8aa4d6,1);g.fillEllipse(x+16+rc,y-26,18,38);g.lineStyle(2.5,0xe8b85a,1);g.strokeEllipse(x+16+rc,y-26,18,38);g.fillStyle(0xe8b85a,1);g.fillCircle(x+16+rc,y-26,4);break;
  }
  if(p.castAnim>0)glow(g,x+14,y-32,20,col,.55);
  if(p.rev){const r=p.rev.target;g.lineStyle(2,0x9fffb0,.6);g.lineBetween(x,y-30,r.x,r.y-30);}
  const mh=maxHp(p),bw=34;g.fillStyle(0,.6);g.fillRect(x-bw/2,y-88,bw,4);g.fillStyle(p.hp/mh<.3?0xff5a4a:0x5ad06a,1);g.fillRect(x-bw/2,y-88,bw*Math.max(0,p.hp/mh),4);
}
function drawWall(g,w){
  const fade=Math.min(1,(w.until-T)/.6),x=w.x;
  g.fillStyle(0xffd27a,.1*fade);g.fillRect(x-26,380,52,250);
  for(let y=GY0-24;y<GY1+16;y+=24){const off=(((y/24)|0)%2)*5;g.fillStyle(0x8a6a4a,fade);g.fillRect(x-12+off*.4,y,24,22);g.lineStyle(1.5,0xe8b85a,.85*fade);g.strokeRect(x-12+off*.4,y,24,22);}
  g.fillStyle(0xe8b85a,.9*fade);g.fillRect(x-15,GY0-32,30,6);
  g.fillStyle(0,.6);g.fillRect(x-20,GY0-48,40,5);g.fillStyle(0x7fe0d4,1);g.fillRect(x-20,GY0-48,40*Math.max(0,w.hp/w.max),5);
}
function drawZone(g,z){
  const fade=Math.min(1,(z.until-T)/.5);
  if(z.kind==='fire'){
    g.fillStyle(0xff4a1a,.16*fade);g.fillEllipse(z.x,z.y,z.r*2,z.r*1.18);g.lineStyle(2,0xff8a3a,.6*fade);g.strokeEllipse(z.x,z.y,z.r*2,z.r*1.18);
    for(let i=0;i<9;i++){const an=z.sd+i*2.4,rr=z.r*.8*Math.abs(Math.sin(an*1.7)),fx0=z.x+Math.cos(an)*rr,fy0=z.y+Math.sin(an)*rr*.58,fh=16+Math.sin(T*10+i*3)*7;
      g.fillStyle(0xff7a1f,.85*fade);g.fillTriangle(fx0-7,fy0,fx0+7,fy0,fx0,fy0-fh);g.fillStyle(0xffd27a,.9*fade);g.fillTriangle(fx0-3,fy0,fx0+3,fy0,fx0,fy0-fh*.55);}
  }else{
    g.fillStyle(0x6fe0a0,.13*fade);g.fillEllipse(z.x,z.y,z.r*2,z.r*1.18);g.lineStyle(2,0xb8ffd0,.8*fade);g.strokeEllipse(z.x,z.y,z.r*2,z.r*1.18);
    for(let i=0;i<7;i++){const an=z.sd+i*2.7,px=z.x+Math.cos(an)*z.r*.7*Math.abs(Math.sin(an*1.3)),py=z.y-((T*34+i*23)%60)+8;g.lineStyle(2,0xb8ffd0,.8*fade);g.lineBetween(px-4,py,px+4,py);g.lineBetween(px,py-4,px,py+4);}
  }
}
function drawProj(g,b){
  const tx=b.x-b.vx*.05,ty=b.y-b.vy*.05;
  switch(b.kind){
    case 'arrow':g.lineStyle(2.5,b.col,1);g.lineBetween(b.x-b.vx*.03,b.y-b.vy*.03,b.x,b.y);g.fillStyle(0xffffff,1);g.fillCircle(b.x,b.y,2);break;
    case 'pierce':g.lineStyle(10,b.col,.25);g.lineBetween(b.x-b.vx*.12,b.y-b.vy*.12,b.x,b.y);g.lineStyle(4,0xffffff,.95);g.lineBetween(b.x-b.vx*.09,b.y-b.vy*.09,b.x,b.y);break;
    case 'bullet':g.lineStyle(2.5,b.col,.95);g.lineBetween(b.x-b.vx*.02,b.y-b.vy*.02,b.x,b.y);break;
    case 'fire':g.lineStyle(7,b.col,.35);g.lineBetween(tx,ty,b.x,b.y);glow(g,b.x,b.y,b.r*2.2,b.col,.8);g.fillStyle(0xffe6a8,1);g.fillCircle(b.x,b.y,b.r*.6);break;
    case 'orb':glow(g,b.x,b.y,b.r*2.4,b.col,.8);g.fillStyle(0xffffff,1);g.fillCircle(b.x,b.y,b.r*.5);break;
    case 'shield':glow(g,b.x,b.y,b.r*2,b.col,.6);g.fillStyle(0x8aa4d6,1);g.fillEllipse(b.x,b.y,b.r*1.2,b.r*2.2);g.lineStyle(2,0xe8b85a,1);g.strokeEllipse(b.x,b.y,b.r*1.2,b.r*2.2);break;
    default:glow(g,b.x,b.y,b.r*2,b.col,.7);g.fillStyle(0xffffff,.9);g.fillCircle(b.x,b.y,b.r*.5);
  }
}
function drawFx(g,f){
  const p=f.t/f.dur;
  switch(f.k){
  case 'ring':{const r=f.r0+(f.r1-f.r0)*p;g.lineStyle(3,f.col,1-p);g.strokeEllipse(f.x,f.y,r*2,r*.9);break;}
  case 'boom':{const r=f.r*(.5+p*.6);g.fillStyle(f.col,(1-p)*.55);g.fillCircle(f.x,f.y-f.r*.15,r);g.fillStyle(0xffffff,(1-p)*.5);g.fillCircle(f.x,f.y-f.r*.15,r*.45);
    g.lineStyle(3,f.col,1-p);g.strokeEllipse(f.x,f.y,r*2.2,r*1.1);break;}
  case 'rain':{g.lineStyle(2,0xd9f2a8,.35*Math.min(1,(1-p)*3));g.strokeEllipse(f.x,f.y,f.r*2,f.r*1.18);
    for(let i=0;i<11;i++){const q=(f.t*4.5+i*.37)%1,ax=f.x+Math.sin(f.sd+i*12.9+Math.floor(f.t*4.5+i*.37)*7.1)*f.r*.9,ay=f.y+Math.cos(f.sd+i*7.3+Math.floor(f.t*4.5+i*.37)*3.3)*f.r*.4,yy=ay-300*(1-q);
      g.lineStyle(2,0xd9f2a8,.9*(1-p*.6));g.lineBetween(ax,yy-22,ax,yy);if(q>.9){g.fillStyle(0xffffff,.8);g.fillCircle(ax,ay,3);}}break;}
  case 'meteor':{g.lineStyle(3,0xff4a2a,.4+.4*p);g.strokeEllipse(f.x,f.y,f.r*2,f.r*1.18);g.fillStyle(0xff4a2a,.12*p);g.fillEllipse(f.x,f.y,f.r*2*p,f.r*1.18*p);
    const mx=f.x+280*(1-p),my=f.y-620*(1-p);g.lineStyle(14,0xff7a2a,.4);g.lineBetween(mx+90*(1-p)*.3+40,my-130,mx,my);glow(g,mx,my,34,0xff7a2a,.9);g.fillStyle(0xffe6a8,1);g.fillCircle(mx,my,12);break;}
  case 'shell':{const x=f.x0+(f.x1-f.x0)*p,y=f.y0+(f.y1-f.y0)*p-Math.sin(p*Math.PI)*170;g.fillStyle(0x222222,1);g.fillCircle(x,y,6);glow(g,x,y,10,0xffa040,.6);break;}
  case 'orb':{const x=f.x0+(f.x1-f.x0)*p,y=f.y0+(f.y1-f.y0)*p-Math.sin(p*Math.PI)*60;glow(g,x,y,16,f.col,.9);g.fillStyle(0xffffff,1);g.fillCircle(x,y,5);break;}
  case 'beam':{const w=40*(1-p);g.lineStyle(w*1.8,f.col,.25*(1-p));g.lineBetween(f.x0,f.y0,f.x1,f.y1);g.lineStyle(w,f.col,.7*(1-p*.5));g.lineBetween(f.x0,f.y0,f.x1,f.y1);g.lineStyle(w*.35,0xffffff,1-p);g.lineBetween(f.x0,f.y0,f.x1,f.y1);break;}
  case 'bolt':{if(p<.8){const r=10+p*30;glow(g,f.x0,f.y0,r*1.6,0x9a6bff,.8);g.fillStyle(0xffffff,.8);g.fillCircle(f.x0,f.y0,r*.3);g.lineStyle(2,0x9a6bff,.35);g.lineBetween(f.x0,f.y0,f.x1,f.y1);}
    else{const a=(p-.8)/.2;g.lineStyle(16*(1-a),0x9a6bff,.7);g.lineBetween(f.x0,f.y0,f.x1,f.y1);g.lineStyle(5*(1-a),0xffffff,1);g.lineBetween(f.x0,f.y0,f.x1,f.y1);}break;}
  case 'heal':{for(let i=0;i<4;i++){const px=f.x-14+i*9,py=f.y-20-p*50+i*5;g.lineStyle(2.5,0x9fffb0,1-p);g.lineBetween(px-4,py,px+4,py);g.lineBetween(px,py-4,px,py+4);}break;}
  case 'soul':{g.fillStyle(f.col,(1-p)*.7);g.fillCircle(f.x,f.y-p*46,Math.max(2,f.sz*.4*(1-p*.5)));g.fillStyle(0xffffff,(1-p)*.5);g.fillCircle(f.x,f.y-p*46,Math.max(1,f.sz*.15));break;}
  }
}
const drawList=[];
function render(){
  const g=gfx;g.clear();
  LOD=enemies.length>90?2:(enemies.length>45?1:0);
  drawChurchFx(g);
  for(const z of zones)drawZone(g,z);
  for(const w of walls)drawWall(g,w);
  drawList.length=0;
  for(const p of players)drawList.push({y:p.y,o:p,e:0});
  for(const m of enemies)drawList.push({y:m.y,o:m,e:1});
  drawList.sort((a,b)=>a.y-b.y);
  for(const it of drawList){if(it.e)drawEnemy(g,it.o);else drawPlayer(g,it.o);}
  for(const b of projs)drawProj(g,b);
  for(const b of ebolts){glow(g,b.x,b.y,13,b.col,.9);g.fillStyle(0xffffff,.95);g.fillCircle(b.x,b.y,3.2);g.lineStyle(3,b.col,.5);g.lineBetween(b.x,b.y,b.x-b.vx*.05,b.y-b.vy*.05);}
  for(const f of fx)drawFx(g,f);
  // targeting reticle
  if(targeting>=0&&players[ctl]&&state!=='menu'){
    const p=players[ctl],s=SKILLS[p.cls][targeting],mx=mouse.x,my=mouse.y;
    g.lineStyle(2,0xffe08a,.9);
    if(s.k==='point'){const ty=clamp(my,GY0+10,GY1);g.strokeEllipse(mx,ty,s.r*2,s.r*1.18);g.fillStyle(0xffe08a,.1);g.fillEllipse(mx,ty,s.r*2,s.r*1.18);}
    else if(s.k==='wall'){const wx=clamp(mx,380,1100);g.lineBetween(wx,380,wx,630);g.strokeRect(wx-14,GY0-24,28,200);}
    else if(s.k==='aim'){g.lineBetween(p.x+12,p.y-28,mx,my);g.strokeCircle(mx,my,10);}
    else if(s.k==='ally'){const q=pickAlly(p,mx,my,true);if(q)g.strokeCircle(q.x,q.y-28,30);}
  }
  // foreground fog + embers
  for(const f of fogs){g.fillStyle(0x6a3a38,f.a);g.fillEllipse(f.x,f.y,f.w,f.h);}
  for(const e of embers){const a=.35+.45*Math.abs(Math.sin(e.ph));g.fillStyle(0xffa040,a);g.fillCircle(e.x,e.y,e.s);}
  // popups (อัปเดตข้อความ/สีเฉพาะเมื่อเปลี่ยน — Phaser Text แพงมากถ้าสั่งทุกเฟรม)
  for(let i=0;i<popPool.length;i++){
    const t=popPool[i],q=popups[i];
    if(!q){if(t.visible)t.setVisible(false);continue;}
    const pr=q.t/q.dur;
    if(!t.visible)t.setVisible(true);
    if(t._tx!==q.txt){t._tx=q.txt;t.setText(q.txt);}
    if(t._co!==q.col){t._co=q.col;t.setColor(q.col);}
    if(t._sz!==q.sz){t._sz=q.sz;t.setFontSize(q.sz);}
    t.setPosition(q.x,q.y-pr*34);t.setAlpha(1-Math.max(0,pr-.55)/.45);
  }
}
function ambient(dt){
  for(const e of embers){e.x+=e.vx*dt;e.y+=e.vy*dt;e.ph+=dt*3;if(e.y<-10||e.x<-10){e.x=rnd(W*.3,W+40);e.y=H+10;}}
  for(const f of fogs){f.x+=f.v*dt;if(f.x>W+300)f.x=-300;if(f.x<-300)f.x=W+300;}
  if(shakeAmt>.2){const a=Math.min(5,shakeAmt)*SHAKE_MUL[shakeLvl];scene.cameras.main.centerOn(W/2+rnd(-a,a),H/2+rnd(-a,a));shakeAmt*=.88;}
  else if(shakeAmt!==0){shakeAmt=0;scene.cameras.main.centerOn(W/2,H/2);}
}
