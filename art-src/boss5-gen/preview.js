// 5 王預覽頁產生器(11/7 第 3 回):複製 index.html 並加控制列 → preview/boss5.html(不提交)
// 控制列:進場(含登場/跳過登場)、主角無敵、自動出招、指定出招、顯示判定、速度 1、1/2、1/4、配色、血量、一鍵打死、畫質
// 用法:node art-src/boss5-gen/preview.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bar=`
<div id="pv" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18ee;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>5 王預覽(工作版)</b>
 <button id="pvIn">進場(含登場)</button><button id="pvGo">直接開打</button><button id="pvInv">主角無敵:開</button><button id="pvAuto">自動出招:開</button>
 <button id="pvDbg" style="background:#2a4">顯示判定:關</button><span>速度:</span><button data-s="1">正常</button><button data-s="2">1/2</button><button data-s="4">1/4</button>
 <span>出招:</span><button data-f="bee">召喚小蜂</button><button data-f="chg">衝撞</button><button data-f="scan">環狀掃描</button><button data-f="can">無限大砲</button>
 <span>血量:</span><button data-h="1">100%</button><button data-h="0.4">40%</button><button data-h="0.2">20%</button>
 <button id="pvKill">一鍵打死</button><button id="pvQ">畫質切換</button>
 <span id="pvSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">顯示判定:紅框=本體碰撞、紅細線=雷射環扣血帶(主角中心落在兩線之間就扣血)、綠半圓=安全區(主角中心在內才安全)、白虛框=衝撞實際落點、黃框=主角判定與中心點</div>
</div>
<script>
(function(){
const $=id=>document.getElementById(id);let inv=true,auto=true,dbg=false,spd=1,fc=0,forceT=0;
const into=skip=>{resetRun();G.world=5;G.sub=5;hudEl.style.display='flex';startLevel();G.modal=null;G.state='play';if(skip){for(let i=0;i<300;i++){P.inv=999;update();}}};
$('pvIn').onclick=()=>into(0);$('pvGo').onclick=()=>into(1);
$('pvInv').onclick=()=>{inv=!inv;$('pvInv').textContent='主角無敵:'+(inv?'開':'關');};
$('pvAuto').onclick=()=>{auto=!auto;$('pvAuto').textContent='自動出招:'+(auto?'開':'關');};
$('pvDbg').onclick=()=>{dbg=!dbg;$('pvDbg').textContent='顯示判定:'+(dbg?'開':'關');};
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{spd=+b.dataset.s;});
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{B5PI=+b.dataset.p;B5C=null;});
document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{if(boss&&boss.alive)boss.hp=Math.max(1,Math.round(boss.max*+b.dataset.h));});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0||B.cannonPhase||B.ring>=0||B.ringWarn>0||B.st==='charge')return;forceT=500;
  const f=b.dataset.f;if(f==='bee'){B.ai=0;B.cd=26;}else if(f==='chg'){B.ai=1;B.cd=32;}else if(f==='scan'){B.ringCd=122;}else{B.cannonCd=1;}});
$('pvKill').onclick=()=>{if(!boss||!boss.alive)return;boss.introT=0;bossDamage(bossParts()[0],1e8);};
$('pvQ').onclick=()=>toggleQuality();
const _u=update;update=function(){
  if(spd>1&&(fc++%spd))return;
  if(inv&&P){P.inv=Math.max(P.inv,2);if(P.lives<3)P.lives=3;}
  const B=boss;if(B&&B.alive&&G.world===5&&B.introT<=0&&!auto&&forceT<=0){B.cd=Math.max(B.cd,40);if(B.ringCd>121)B.ringCd=Math.max(B.ringCd,200);B.cannonCd=Math.max(B.cannonCd,200);}
  if(forceT>0)forceT--;
  _u();
  if(B&&G.world===5)$('pvSt').textContent='血量 '+Math.round(B.hp/B.max*100)+'% / 平台 '+B.plats.length+' 塊 / '+(G.state==='win'?'死亡第 '+G.sT+' 幀':B.introT>0?'登場第 '+(300-B.introT)+' 幀':'戰鬥中');
};
const _d=drawEBulTop;drawEBulTop=function(ox,oy){_d(ox,oy);const B=boss;if(!dbg||!B||G.world!==5)return;
  const k=PW/W,kh=PH/H,X=v=>(v+ox-cam.x)*k,Y=v=>(v+oy-cam.y)*kh,c=octx;c.save();c.lineWidth=2;
  const rect=(x,y,w,h,col,dash)=>{c.strokeStyle=col;c.setLineDash(dash?[6,4]:[]);c.strokeRect(X(x),Y(y),w*k,h*kh);c.setLineDash([]);};
  if(B.alive){rect(B.x,B.y,B.w,B.h,'#ff3030');
    const cx=B.x+B.w/2,cy=B.y+B.h/2,R=B.ring>=0?B.ring:(B.cannonPhase==='fire1'||B.cannonPhase==='fire2')?B.fireRing:-1;
    if(R>=0){c.strokeStyle='#ff3030';for(const r of[R-11,R+11])if(r>0){c.beginPath();c.arc(X(cx),Y(cy),r*k,0,6.2832);c.stroke();}}
    const sp=[];if(B.shieldPlats)for(const i of B.shieldPlats)sp.push(B.plats[i]);if(B.extraPlat)sp.push(B.extraPlat);
    c.strokeStyle='#3fff6a';c.setLineDash([5,3]);for(const p of sp){const q=b5Dq(p);c.beginPath();c.arc(X(q.cx),Y(q.cy),q.r*k,Math.PI,0);c.closePath();c.stroke();}c.setLineDash([]);
    if(b5Tele(B)){const q=b5Pred(B);rect(q.x,q.y,B.w,B.h,'#ffffff',1);}}
  for(const e of ens)rect(e.x,e.y,e.w,e.h,'#ff3030');
  rect(P.x,P.y,P.w,P.h,'#ffe040');c.fillStyle='#ffe040';c.fillRect(X(P.x+5)-2,Y(P.y+7)-2,4,4);c.restore();};
into(0);
})();
</script>
`;
s=s.replace('</body>',bar+'</body>');
fs.mkdirSync(path.join(root,'preview'),{recursive:true});fs.writeFileSync(path.join(root,'preview/boss5.html'),s);console.log('已存 preview/boss5.html');
