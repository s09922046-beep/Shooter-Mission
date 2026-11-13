// 抓蟲 c、d 預覽(11/13):注入 preview/fix-cd.html 的控制列程式。只覆寫繪製函式,不碰判定。
// c 第 10 大關一般小關配色:A 背景退後、B 地面前推、C 深色外緣(可疊加)
// d 火焰槍:0 現行、1 火團流、2 撕裂舌焰、3 短噴流加舔焰
(function(){
const $=id=>document.getElementById(id);
const HAR=!!navigator.webdriver;                       // harness 截圖時:不自動開局、不自動噴火,改讀 FX.pvc / FX.pvf
const C10={A:0,B:0,C:0};let FS=0,inv=!HAR,autoF=!HAR,spd=1,fc=0;
const cOn=k=>C10[k]||(FX.pvc&&String(FX.pvc).indexOf(k)>=0);
const fSt=()=>FX.pvf!==undefined?+FX.pvf:FS;
const is10=()=>G.world===10&&G.sub<5;
/* ---- c:配色 ---- */
const A_FAR='#2e2a36',A_MID='#26222e';                  // A:遠景、中景改成霧灰(比天空下緣略深、比地面亮且不帶紫),地面維持
const _bg=drawBG;drawBG=function(){
  if(!(is10()&&cOn('A')))return _bg();
  const t=THEME[9],f=t.far,m=t.mid;t.far=A_FAR;t.mid=A_MID;try{_bg();}finally{t.far=f;t.mid=m;}};
const _mc=matCfg;matCfg=function(){const r=_mc();       // B:地面本體與表層提亮(本體明度 0.85→1)
  if(is10()&&cOn('B')){r.gr='#7a4a94';r.gr2='#43285a';r.dim=1;}return r;};
const OC='#050308';
const _dt=drawTiles;drawTiles=function(){              // C:實心地形外露的左右兩側各 2 像素、頂面 1 像素深色外緣(畫在地形之外,先畫,地表裝飾蓋在上面)
  if(is10()&&cOn('C')){const x0=Math.max(0,Math.floor(cam.x/TS)-1),x1=Math.min(map.w-1,Math.floor((cam.x+W)/TS)+1);
    for(let y=0;y<GH;y++)for(let x=x0;x<=x1;x++){if(T(x,y)!==1)continue;const sx=x*TS,sy=y*TS;
      if(!isSolid(T(x-1,y)))px(sx-2,sy,2,TS,OC);if(!isSolid(T(x+1,y)))px(sx+TS,sy,2,TS,OC);
      if(!isSolid(T(x,y-1)))px(sx-(isSolid(T(x-1,y))?0:2),sy-1,TS+(isSolid(T(x-1,y))?0:2)+(isSolid(T(x+1,y))?0:2),1,OC);}}
  _dt();};
const reMat=()=>{MAT.map=null;};
/* ---- d:火焰 ---- */
const _fl=drawFlame;
const hwv=d=>2.5+d*0.15;                                // 視覺半寬上限(與現行相同,約判定錐一半)
FLV.pf=[];FLV.lk=[];
const ageC=(H_,k)=>k<0.15?H_[0]:k<0.4?H_[1]:k<0.7?H_[2]:H_[3];
function common(run,on,a,m,L,lv,H_){                    // 火星與煙:沿用現行
  if(run){
    if(on){const n=Math.random()<0.5?2:1;
      for(let i=0;i<n;i++){const d=rnd(0.2,0.95)*L,sd=rnd(-1,1)*(2.5+d*0.15);
        FLV.sp.push({x:m[0]+a[0]*d-a[1]*sd,y:m[1]+a[1]*d+a[0]*sd,vx:a[0]*rnd(0.8,1.8)-a[1]*sd*0.05,vy:a[1]*rnd(0.8,1.8)+a[0]*sd*0.05-0.3,t:0,life:ri(10,20),c:H_[0]});}
      if((G.t&1)===0){const d=rnd(0.75,1)*L;
        FLV.sm.push({x:m[0]+a[0]*d,y:m[1]+a[1]*d,vx:a[0]*0.5,vy:a[1]*0.5-0.35,t:0,life:ri(24,40),c:lv===1?'#2c2630':'#3a4258'});}}
    for(let i=FLV.sp.length-1;i>=0;i--){const q=FLV.sp[i];q.x+=q.vx;q.y+=q.vy;q.vy-=0.02;if(++q.t>=q.life)FLV.sp.splice(i,1);}
    for(let i=FLV.sm.length-1;i>=0;i--){const q=FLV.sm[i];q.x+=q.vx;q.y+=q.vy;if(++q.t>=q.life)FLV.sm.splice(i,1);}
  }
  for(const q of FLV.sm){const k=q.t/q.life,z=3+k*5;ctx.globalAlpha=0.45*(1-k);px(q.x-z/2,q.y-z/2,z,z,q.c);}
  ctx.globalAlpha=1;
}
function sparks(){for(const q of FLV.sp){const k=1-q.t/q.life;ctx.globalAlpha=k;px(q.x,q.y,q.t<4?2:1,1,q.c);}ctx.globalAlpha=1;}
function tick(arr,run,on,L){                            // 火團/舔焰:相對槍口前進;停火時剩餘的 6 幀內淡出
  if(!run)return;
  for(let i=arr.length-1;i>=0;i--){const q=arr[i];if(!on&&!q.cut){q.cut=1;q.life=Math.min(q.life,q.t+6);}
    q.d+=q.v;q.s+=q.vs;if(q.up!==undefined)q.vs+=q.up*0.11+(vHash(q.sd,q.t)-0.5)*0.18;
    const lim=hwv(q.d)*0.9;if(q.s>lim){q.s=lim;q.vs*=-0.3;}else if(q.s<-lim){q.s=-lim;q.vs*=-0.3;}
    if(++q.t>=q.life||q.d>L)arr.splice(i,1);}
}
const flame1=(run,on,a,m,L,lv,H_)=>{                    // 1 火團流:一團團不規則火球自槍口滾出,邊走邊脹大、由白熱轉暗
  const nx=-a[1],ny=a[0],arr=FLV.pf;
  if(run&&on)for(let j=0;j<2;j++){const h=vHash(G.t*2+j,lv*31);
    arr.push({d:j*3,s:(h-0.5)*2,v:L/(16+h*6),vs:(vHash(G.t,j+7)-0.5)*0.35,t:0,life:20+Math.floor(h*5),sd:(G.t*2+j)&1023});}
  tick(arr,run,on,L);
  for(let i=0;i<arr.length;i++){const q=arr[i],k=q.t/q.life,h=vHash(q.sd,3),r=(1.2+hwv(q.d)*0.62)*(0.8+0.4*h)*(k>0.8?1-(k-0.8)*2:1);
    const x=m[0]+a[0]*q.d+nx*q.s,y=m[1]+a[1]*q.d+ny*q.s,c=ageC(H_,k),an=h*6.283+q.t*0.15;
    ctx.globalAlpha=k>0.5?0.6:1;
    fSq(x,y,r*0.7,c);fSq(x+Math.cos(an)*r*0.55,y+Math.sin(an)*r*0.55,r*0.5,c);fSq(x-Math.cos(an+1.3)*r*0.5,y-Math.sin(an+1.3)*r*0.5,r*0.42,k<0.4?H_[0]:c);
    if(k<0.3){ctx.globalAlpha=1;fSq(x,y,r*0.3,k<0.12?'#ffffff':H_[0]);}
    if(q.d<L/3&&(i&1))gl(x-r-2,y-r-2,r*2+4,r*2+4,H_[1],FX.core*0.7);}
  ctx.globalAlpha=1;
  if(on){fSq(m[0]+a[0]*2,m[1]+a[1]*2,2,'#ffffff');}
};
const flame2=(run,on,a,m,L,lv,H_)=>{                    // 2 撕裂舌焰:4 條細長舌焰各自長短伸縮、蛇行,尾端撕成兩岔
  if(!on)return;
  const nx=-a[1],ny=a[0],t=G.t,sd=t>>1,st=3;
  const P_=(d,s)=>[m[0]+a[0]*d+nx*s,m[1]+a[1]*d+ny*s];
  for(let pass=0;pass<2;pass++)for(let j=0;j<4;j++){
    const len=L*(0.55+0.45*vHash(j*13+lv,sd)),bias=(j-1.5)/1.5*0.55,ph=j*2.1+vHash(j,sd>>2)*3;
    for(let d=3;d<=len;d+=st){const f=d/len,hw=hwv(d);
      let s=hw*(bias*Math.min(1,d/20)+0.3*Math.sin(d*0.11+t*0.38+ph));s=clamp(s,-hw,hw);
      const w=(1.1+d*0.055)*Math.pow(1-f,0.55)+0.5;
      if(pass===0){if(f<0.3)continue;ctx.globalAlpha=0.6;const c=f<0.55?H_[1]:f<0.8?H_[2]:H_[3];
        if(f>0.72&&((d/st+t)&1)===0){const sp=(d-len*0.72)*0.35,[x1,y1]=P_(d,clamp(s+sp,-hw,hw)),[x2,y2]=P_(d,clamp(s-sp,-hw,hw));fSq(x1,y1,w*0.8,c);fSq(x2,y2,w*0.8,c);}
        else{const [x,y]=P_(d,s);fSq(x,y,w*1.25,c);}}
      else{if(f>0.72)continue;const [x,y]=P_(d,s);ctx.globalAlpha=1;fSq(x,y,w*0.6,f<0.3?H_[0]:H_[1]);
        if(j===1&&d<L/3&&(d/st|0)%3===0)gl(x-hw-2,y-hw-2,hw*2+4,hw*2+4,H_[1],FX.core*0.7);}}}
  ctx.globalAlpha=1;
  for(let d=2;d<L*0.22;d+=2){const [x,y]=P_(d,0);fSq(x,y,1+d*0.03,d<L*0.12?'#ffffff':H_[0]);}   // 根部白熱芯
};
const flame3=(run,on,a,m,L,lv,H_)=>{                    // 3 短噴流加舔焰:前 4 成是筆直高壓噴流,之後散成一片片往上舔的火舌
  const nx=-a[1],ny=a[0],J=L*0.4,arr=FLV.lk;
  const upS=-ny;                                       // 世界「上」在法線方向的分量
  if(run&&on){const h=vHash(G.t,lv*17+5);
    arr.push({d:J*(0.85+h*0.2),s:(h-0.5)*hwv(J)*0.8,v:L/(22+h*8),vs:0,up:upS,t:0,life:14+Math.floor(h*8),sd:G.t&1023});}
  tick(arr,run,on,L);
  for(const q of arr){const k=q.t/q.life,h=vHash(q.sd,5),r=(1+hwv(q.d)*0.45)*(0.8+0.4*h)*(k>0.75?1-(k-0.75)*2.4:1);
    const x=m[0]+a[0]*q.d+nx*q.s,y=m[1]+a[1]*q.d+ny*q.s;
    let dx=a[0]*q.v+nx*q.vs*1.6,dy=a[1]*q.v+ny*q.vs*1.6;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
    const c=ageC(H_,0.15+k*0.85);ctx.globalAlpha=k>0.5?0.65:0.9;
    fSq(x,y,r,c);fSq(x+dx*r*0.9,y+dy*r*0.9,r*0.6,c);fSq(x+dx*r*1.6,y+dy*r*1.6,r*0.3,k<0.4?H_[1]:c);}
  ctx.globalAlpha=1;
  if(!on)return;
  for(let d=2;d<=J;d+=2){const f=d/J,hw=1.4+d*0.07,j=(vHash(d,G.t>>1)-0.5)*0.6,x=m[0]+a[0]*d+nx*j,y=m[1]+a[1]*d+ny*j;
    ctx.globalAlpha=0.85;fSq(x,y,hw,f<0.5?H_[0]:H_[1]);ctx.globalAlpha=1;fSq(x,y,hw*0.55,f<0.6?'#ffffff':H_[0]);
    if((d&7)===0&&d<L/3)gl(x-hw-2,y-hw-2,hw*2+4,hw*2+4,H_[1],FX.core*0.7);}
};
const FN=[null,flame1,flame2,flame3];
drawFlame=function(){const s=fSt();if(!s)return _fl();
  const run=G.state==='play'&&!G.paused&&!G.modal,on=P.flameT>0,lv=wlvl===4?4:(wlvl===3?3:1),H_=HOT[lv];
  const a=aimVec(),m=muzzle(),L=flameRange();
  common(run,on,a,m,L,lv,H_);FN[s](run,on,a,m,L,lv,H_);sparks();};
/* ---- 控制列 ---- */
const into=s=>{resetRun();G.world=10;G.sub=s;hudEl.style.display='flex';startLevel();G.modal=null;G.state='play';wep='flame';wlvl=Math.max(1,lvSel);reMat();};
let lvSel=3;
const _u=update;update=function(){
  if(spd>1&&(fc++%spd))return;
  if(inv&&P){P.inv=Math.max(P.inv,2);if(P.lives<3)P.lives=3;}
  if(!HAR&&G.state==='play'&&!G.modal){if(wep!=='flame'||wlvl!==lvSel){wep='flame';wlvl=lvSel;}if(autoF)K.f=1;}
  _u();
  if(!HAR)$('pvSt').textContent='第 10 關配色:'+(['A','B','C'].filter(k=>C10[k]).join('+')||'現行')+'|火焰:'+['0 現行','1 火團流','2 撕裂舌焰','3 短噴流加舔焰'][FS]+' Lv'+lvSel;
};
if(HAR)return;
const hl=()=>{document.querySelectorAll('[data-c]').forEach(b=>b.style.background=C10[b.dataset.c]?'#2a6':'');
  document.querySelectorAll('[data-f]').forEach(b=>b.style.background=+b.dataset.f===FS?'#2a6':'');
  document.querySelectorAll('[data-l]').forEach(b=>b.style.background=+b.dataset.l===lvSel?'#2a6':'');
  document.querySelectorAll('[data-sp]').forEach(b=>b.style.background=+b.dataset.sp===spd?'#2a6':'');
  $('pvAuto').textContent='自動噴火:'+(autoF?'開':'關');$('pvInv').textContent='主角無敵:'+(inv?'開':'關');};
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{into(+b.dataset.s);b.blur();});
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{C10[b.dataset.c]^=1;reMat();hl();b.blur();});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{FS=+b.dataset.f;FLV.pf.length=0;FLV.lk.length=0;hl();b.blur();});
document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{lvSel=+b.dataset.l;hl();b.blur();});
document.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{spd=+b.dataset.sp;hl();b.blur();});
$('pvAuto').onclick=e=>{autoF=!autoF;if(!autoF)K.f=0;hl();e.target.blur();};
$('pvInv').onclick=e=>{inv=!inv;hl();e.target.blur();};
$('pvQ').onclick=e=>{toggleQuality();e.target.blur();};
into(3);hl();
})();
