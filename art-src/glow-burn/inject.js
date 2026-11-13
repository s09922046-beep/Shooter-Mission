// 子彈光暈與火焰剪影預覽(11/14):注入 preview/glow-burn.html 的控制列程式。只覆寫繪製函式,不碰判定。
// 子彈光暈 B:0 現行 v0.33 八角環(泛光)、1 v0.32 方框(泛光)、2 像素光暈(不走泛光,畫在遊戲畫面)、3 平滑光暈(不走泛光,畫在輸出畫布)、4 無光暈
// 火焰 F:0 現行 v0.34(火團碰到才剪影、其餘外框)、1 整個回 v0.28(連續火舌、錐內全剪影)、2 火團不變但錐內全剪影、3 火團加寬到接近判定錐(碰到才剪影)
(function(){
const $=id=>document.getElementById(id);
const HAR=!!navigator.webdriver;                       // harness 截圖時:不自動開局、不自動開火,改讀 PVDEF
const DEF=window.PVDEF||{b:0,f:0};
let BM=DEF.b,FM=DEF.f,inv=!HAR,autoF=!HAR,spd=1,fc=0,wSel='flame',lvSel=2;
/* ---- 子彈光暈 ---- */
const _glB=glBul;
function glB32(x,y,r,c){const o=r+3,X=x-o,Y=y-o,S=o*2,t=3,a=FX.core;   // v0.32 原樣
  gl(X,Y,S,t,c,a);gl(X,Y+S-t,S,t,c,a);gl(X,Y+t,t,S-2*t,c,a);gl(X+S-t,Y+t,t,S-2*t,c,a);}
glBul=function(x,y,r,c){if(BM===0)_glB(x,y,r,c);else if(BM===1)glB32(x,y,r,c);
  else if(BM===2)pxHalo(x,y,r,c);};                    // 3、4 不登記泛光(3 改在輸出畫布另畫)
const PXC={};                                          // 2 像素光暈:預先烘焙,三圈圓盤由外到內 0.14/0.26/0.40 疊加,像素邊緣
function pxSpr(c,r){const k=c+'|'+r;if(PXC[k])return PXC[k];const R=r+3,S=R*2+1,cv_=document.createElement('canvas');cv_.width=S;cv_.height=S;
  const g=cv_.getContext('2d');g.fillStyle=c;
  for(const [rr,a] of [[R,0.14],[R-1,0.16],[R-2,0.18]]){g.globalAlpha=a;
    for(let j=-rr;j<=rr;j++){const w=Math.floor(Math.sqrt(rr*rr-j*j)+0.35);if(w>0)g.fillRect(R-w,R+j,w*2+1,1);}}
  return PXC[k]=cv_;}
function pxHalo(x,y,r,c){const s=pxSpr(c,Math.round(r));ctx.drawImage(s,Math.round(x)-(s.width>>1),Math.round(y)-(s.width>>1));}
const _dpb=drawPlayerBullets;                          // 2:己方子彈光暈要墊在彈頭下面,先畫光暈再畫彈頭
drawPlayerBullets=function(){if(BM!==2)return _dpb();for(const b of bul)pxHalo(b.x,b.y,b.r,b.c);for(const b of bul)drawBulletV(b);};
const SMC={};                                          // 3 平滑光暈:每色一張 64×64 徑向漸層,以「加亮」貼在輸出畫布、位置不取整
function smSpr(c){if(SMC[c])return SMC[c];const cv_=document.createElement('canvas');cv_.width=cv_.height=64;const g=cv_.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,c);gr.addColorStop(0.35,c);gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,64,64);return SMC[c]=cv_;}
const _ebt=drawEBulTop;
drawEBulTop=function(ox,oy){
  if(BM===3){const k=PW/W,kh=PH/H,dx=ox-cam.x,dy=oy-cam.y;octx.globalCompositeOperation='lighter';octx.globalAlpha=0.5;
    const one=(b,r)=>{const R=r+4.5;octx.drawImage(smSpr(b.c),(b.x+dx-R)*k,(b.y+dy-R)*kh,R*2*k,R*2*kh);};
    for(const b of bul)one(b,b.r);for(const b of ebul)one(b,b.vk==='b10h'?b.r+2:b.r);
    octx.globalAlpha=1;octx.globalCompositeOperation='source-over';}
  _ebt(ox,oy);};
/* ---- 火焰 ---- */
const _fl=drawFlame,_fp=flamePuffs,_bd=burnDraw;
function flame28(){                                    // 1:v0.28 drawFlame 原樣(連續火舌)
  const run=G.state==='play'&&!G.paused&&!G.modal;
  const on=P.flameT>0,lv=wlvl===4?4:(wlvl===3?3:1),H_=HOT[lv];
  let a=null,m=null,L=0;
  if(on){a=aimVec();m=muzzle();L=flameRange();}
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
  if(on){
    const a0=a[0],a1=a[1],st=3,n=Math.floor(L/st),t=G.t,pts=[];
    for(let k=0;k<=n;k++){const d=k*st,f=d/L,fl=vHash(k*7+lv,t/3|0);
      if(f>0.82&&fl<0.35)continue;
      let hw=(2.5+d*0.15)*(0.78+0.4*fl);if(f>0.85)hw*=1-(f-0.85)/0.15*0.55;
      const wob=Math.sin(t*0.25-d*0.09)*Math.min(d,60)*0.06;
      pts.push({x:m[0]+a0*d-a1*wob,y:m[1]+a1*d+a0*wob,hw,f,k});}
    for(let i=pts.length-1;i>=0;i--){const q=pts[i];if(q.f>0.3&&(q.k+(t>>2))%2)continue;
      const c=q.f<0.35?H_[1]:(q.f<0.72?H_[2]:H_[3]),o=q.hw*0.5,j=(vHash(q.k,t>>2)-0.5)*q.hw*0.4;
      ctx.globalAlpha=0.55*(1-0.35*q.f);fSq(q.x-a1*(o+j),q.y+a0*(o+j),q.hw*0.5,c);fSq(q.x+a1*(o-j),q.y-a0*(o-j),q.hw*0.5,c);}
    ctx.globalAlpha=1;
    for(let i=pts.length-1;i>=0;i--){const q=pts[i];if(q.f<=0.75)fSq(q.x,q.y,q.hw*0.45,q.f<0.4?H_[0]:H_[1]);}
    for(const q of pts)if(q.f<=0.3)fSq(q.x,q.y,q.hw*0.2,'#ffffff');
    for(const q of pts)if(q.k%3===0&&q.f<=0.34)gl(q.x-q.hw-2,q.y-q.hw-2,q.hw*2+4,q.hw*2+4,H_[1],FX.core*0.7);
  }
  for(const q of FLV.sp){const k=1-q.t/q.life;ctx.globalAlpha=k;px(q.x,q.y,q.t<4?2:1,1,q.c);}
  ctx.globalAlpha=1;
}
/* 3:火團加寬。現行視覺半寬 2.5+0.15d(約判定錐 10+0.34d 的一半),改 5+0.27d(約判定錐 0.75 倍);
   火團側向初速放大 2.5 倍,讓火團真的散到錐的兩側;火團大小沿用現行公式(隨半寬變大)。其餘與現行 drawFlame 相同 */
/* 4~8(11/14 使用者:火團把錐內剪影蓋住,v0.28 火舌外層 0.55 半透明、實心芯只到 3/4 才看得到):判定錐內一律剪影,另加:
   4 剪影改畫在火焰上層(各等級都照 Lv4 做法)、5 火團離槍口 1/3 以外整層半透明 0.55(同 v0.28 外層)、6 同 5 但 0.35、9 尾段火團縮小 0.55 倍、
   7 剪影照常在下層,另把剪影的 1 像素外框疊在火焰上層、8 = 5 加 7。火團形狀與半寬沿用現行 */
const [FLc,FLx]=mkCv(W,H);FLx.imageSmoothingEnabled=false;
const HW3=d=>FM===3?5+d*0.27:2.5+d*0.15,SM=()=>FM===3?2.5:1,TA=()=>FM===5||FM===8?0.55:FM===6?0.35:0;
function flameWide(){
  const run=G.state==='play'&&!G.paused&&!G.modal;
  const on=P.flameT>0,lv=wlvl===4?4:(wlvl===3?3:1),H_=HOT[lv];
  let a=null,m=null,L=0;
  if(on){a=aimVec();m=muzzle();L=flameRange();}
  if(run){
    if(on){const n=Math.random()<0.5?2:1;
      for(let i=0;i<n;i++){const d=rnd(0.2,0.95)*L,sd=rnd(-1,1)*HW3(d);
        FLV.sp.push({x:m[0]+a[0]*d-a[1]*sd,y:m[1]+a[1]*d+a[0]*sd,vx:a[0]*rnd(0.8,1.8)-a[1]*sd*0.05,vy:a[1]*rnd(0.8,1.8)+a[0]*sd*0.05-0.3,t:0,life:ri(10,20),c:H_[0]});}
      if((G.t&1)===0){const d=rnd(0.75,1)*L;
        FLV.sm.push({x:m[0]+a[0]*d,y:m[1]+a[1]*d,vx:a[0]*0.5,vy:a[1]*0.5-0.35,t:0,life:ri(24,40),c:lv===1?'#2c2630':'#3a4258'});}}
    for(let i=FLV.sp.length-1;i>=0;i--){const q=FLV.sp[i];q.x+=q.vx;q.y+=q.vy;q.vy-=0.02;if(++q.t>=q.life)FLV.sp.splice(i,1);}
    for(let i=FLV.sm.length-1;i>=0;i--){const q=FLV.sm[i];q.x+=q.vx;q.y+=q.vy;if(++q.t>=q.life)FLV.sm.splice(i,1);}
  }
  for(const q of FLV.sm){const k=q.t/q.life,z=3+k*5;ctx.globalAlpha=0.45*(1-k);px(q.x-z/2,q.y-z/2,z,z,q.c);}
  ctx.globalAlpha=1;
  const pf=FLV.pf;
  if(run){
    if(on)for(let j=0;j<2;j++){const h=vHash(G.t*2+j,lv*31);
      pf.push({d:j*3,s:(h-0.5)*2*(SM()>1?2:1),v:L/(16+h*6),vs:(vHash(G.t,j+7)-0.5)*0.35*SM(),t:0,life:20+Math.floor(h*5),sd:(G.t*2+j)&1023});}
    for(let i=pf.length-1;i>=0;i--){const q=pf[i];if(!on&&!q.cut){q.cut=1;q.life=Math.min(q.life,q.t+6);}
      q.d+=q.v;q.s+=q.vs;const lim=HW3(q.d)*0.9;if(q.s>lim){q.s=lim;q.vs*=-0.3;}else if(q.s<-lim){q.s=-lim;q.vs*=-0.3;}
      if(++q.t>=q.life||(on&&q.d>L))pf.splice(i,1);}
  }
  if(pf.length){const A=on?a:aimVec(),M=on?m:muzzle(),nx=-A[1],ny=A[0],Ln=on?L:flameRange(),ta=TA(),main=ctx;
    // 5、6、8:尾段(離槍口 1/3 以外)火團先以原本不透明度畫進一張整層小畫布,整層再以 ta 疊回(逐團半透明會互相疊回不透明,沒效果)
    if(ta){const T=main.getTransform();FLx.setTransform(1,0,0,1,0,0);FLx.clearRect(0,0,W,H);FLx.setTransform(T);}
    for(let pass=ta?0:1;pass<2;pass++){ctx=pass===0?FLx:main;
    for(let i=0;i<pf.length;i++){const q=pf[i];if(q.d>Ln)continue;if(ta&&(pass===0)!==(q.d>Ln/3))continue;
      const k=q.t/q.life,h=vHash(q.sd,3),r=pR(q)*(FM===9&&q.d>Ln/3?0.55:1);   // 9:尾段火團縮成 0.55 倍,讓出縫隙
      const x=M[0]+A[0]*q.d+nx*q.s,y=M[1]+A[1]*q.d+ny*q.s,c=k<0.15?H_[0]:k<0.4?H_[1]:k<0.7?H_[2]:H_[3],an=h*6.283+q.t*0.15;
      ctx.globalAlpha=k>0.5?0.6:1;
      fSq(x,y,r*0.7,c);fSq(x+Math.cos(an)*r*0.55,y+Math.sin(an)*r*0.55,r*0.5,c);fSq(x-Math.cos(an+1.3)*r*0.5,y-Math.sin(an+1.3)*r*0.5,r*0.42,k<0.4?H_[0]:c);
      if(k<0.3){ctx.globalAlpha=1;fSq(x,y,r*0.3,k<0.12?'#ffffff':H_[0]);}
      if(q.d<Ln/3&&(i&1))gl(x-r-2,y-r-2,r*2+4,r*2+4,H_[1],FX.core*0.7);}
    ctx.globalAlpha=1;
    if(pass===0){ctx=main;const T=main.getTransform();main.setTransform(1,0,0,1,0,0);main.globalAlpha=ta;main.drawImage(FLc,0,0);main.globalAlpha=1;main.setTransform(T);}}
    ctx=main;}
  if(on)fSq(m[0]+a[0]*2,m[1]+a[1]*2,2,'#ffffff');
  for(const q of FLV.sp){const k=1-q.t/q.life;ctx.globalAlpha=k;px(q.x,q.y,q.t<4?2:1,1,q.c);}
  ctx.globalAlpha=1;
}
const pR=q=>{const k=q.t/q.life;return (1.2+HW3(q.d)*0.62)*(0.8+0.4*vHash(q.sd,3))*(k>0.8?1-(k-0.8)*2:1);};
drawFlame=function(){if(FM===1)return flame28();if(FM>=3)return flameWide();return _fl();};
const FPW={t:-1,L:[]};
flamePuffs=function(){if(FM<3)return _fp();if(FPW.t===G.t)return FPW.L;FPW.t=G.t;const L=FPW.L;L.length=0;const pf=FLV.pf;if(!pf.length)return L;
  const A=aimVec(),M=muzzle(),Ln=flameRange(),nx=-A[1],ny=A[0];
  for(const q of pf){if(q.d>Ln)continue;L.push(M[0]+A[0]*q.d+nx*q.s,M[1]+A[1]*q.d+ny*q.s,pR(q));}
  return L;};
burnDraw=function(e){if(FM!==0&&FM!==3){drawSil(e);return;}_bd(e);};   // 1、2、4~8:判定錐內一律剪影(v0.28 規則)
const _bt=burnTop;burnTop=function(){return FM===4||_bt();};           // 4:剪影各等級都畫在火焰上層
const OLA={src:null,c:null};                                          // 7、8:只有外框的圖集(把剪影本體色 SIL_C 挖空),每大關圖集換掉時重做
function olAtlas(){const A=EB.atlas;if(OLA.src===A)return OLA.c;const c=document.createElement('canvas');c.width=A.width;c.height=A.height;
  const g=c.getContext('2d');g.drawImage(A,0,0);const im=g.getImageData(0,0,c.width,c.height),D=im.data,s=vRgb(SIL_C);
  for(let i=0;i<D.length;i+=4)if(D[i]===s[0]&&D[i+1]===s[1]&&D[i+2]===s[2])D[i+3]=0;
  g.putImageData(im,0,0);OLA.src=A;return OLA.c=c;}
const _dbt=drawBurnTop;
drawBurnTop=function(){_dbt();if((FM!==7&&FM!==8)||P.flameT<=0||burnTop())return;
  const A=EB.atlas;if(!A)return;EB.atlas=olAtlas();
  try{for(const e of ens)if(flameHit(e)){const q=eSpr(e);if(q)eDraw(e,q,wlvl>=3?'y':'c');}}finally{EB.atlas=A;}};
/* ---- 控制列 ---- */
const into=(w,s)=>{resetRun();G.world=w;G.sub=s;hudEl.style.display='flex';startLevel();G.modal=null;wep=wSel;wlvl=lvSel;FLV.pf.length=0;};
let wCur=3,sCur=2;
const _u=update;update=function(){
  if(spd>1&&(fc++%spd))return;
  if(inv&&P){P.inv=Math.max(P.inv,2);if(P.lives<3)P.lives=3;}
  if(!HAR&&G.state==='play'&&!G.modal){if(wep!==wSel||wlvl!==lvSel){wep=wSel;wlvl=lvSel;}if(autoF)K.f=1;}
  _u();
  if(!HAR)$('pvSt').textContent='光暈:'+BN[BM]+'|火焰:'+FN[FM]+'|'+WN[wSel]+' Lv'+lvSel+'|畫質 '+(FX.q==='high'?'高':'低');
};
const BN=['0 現行','1 v0.32 方框','2 像素光暈','3 平滑光暈','4 無光暈'],FN=['0 現行','1 回 v0.28','2 火團+錐內全剪影','3 火團加寬','4 剪影上層','5 尾段半透明 0.55','6 尾段半透明 0.35','7 外框上層','8 半透明 0.55+外框上層','9 尾段火團縮小'],WN={smg:'衝鋒槍',shot:'散彈',flame:'火焰'};
if(HAR)return;
const hl=()=>{const on=(sel,f)=>document.querySelectorAll(sel).forEach(b=>b.style.background=f(b)?'#2a6':'');
  on('[data-b]',b=>+b.dataset.b===BM);on('[data-f]',b=>+b.dataset.f===FM);on('[data-l]',b=>+b.dataset.l===lvSel);
  on('[data-wp]',b=>b.dataset.wp===wSel);on('[data-sp]',b=>+b.dataset.sp===spd);
  $('pvAuto').textContent='自動開火:'+(autoF?'開':'關');$('pvInv').textContent='主角無敵:'+(inv?'開':'關');};
$('pvW').onchange=e=>{wCur=+e.target.value;into(wCur,sCur);e.target.blur();};
$('pvS').onchange=e=>{sCur=+e.target.value;into(wCur,sCur);e.target.blur();};
document.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{BM=+b.dataset.b;hl();b.blur();});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{FM=+b.dataset.f;FLV.pf.length=0;hl();b.blur();});
document.querySelectorAll('[data-wp]').forEach(b=>b.onclick=()=>{wSel=b.dataset.wp;hl();b.blur();});
document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{lvSel=+b.dataset.l;hl();b.blur();});
document.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{spd=+b.dataset.sp;hl();b.blur();});
$('pvAuto').onclick=e=>{autoF=!autoF;if(!autoF)K.f=0;hl();e.target.blur();};
$('pvInv').onclick=e=>{inv=!inv;hl();e.target.blur();};
$('pvQ').onclick=e=>{toggleQuality();e.target.blur();};
$('pvRe').onclick=e=>{into(wCur,sCur);e.target.blur();};
addEventListener('keydown',e=>{if(e.code==='F4'){e.preventDefault();const s=$('pv').style;s.display=s.display==='none'?'flex':'none';}
  else if(/^Digit[0-4]$/.test(e.code)&&!e.shiftKey){BM=+e.code[5];hl();}
  else if(/^Digit[0-9]$/.test(e.code)&&e.shiftKey){FM=+e.code[5];FLV.pf.length=0;hl();}});
into(wCur,sCur);hl();
})();
