// 7 王預覽頁產生器(11/8 第 3 回):複製 index.html 並加控制列 → preview/boss7.html(不提交)
// 控制列:進場(含登場)、直接開打、主角無敵、自動出招、顯示判定、速度 1、1/2、1/4、指定出招、指定下一色、光柱白芯切換、血量、一鍵打死、畫質
// 用法:node art-src/boss7-gen/preview.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bar=`
<div id="pv" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18ee;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>7 王預覽(工作版)</b>
 <button id="pvIn">進場(含登場)</button><button id="pvGo">直接開打</button><button id="pvInv">主角無敵:開</button><button id="pvAuto">自動出招:開</button>
 <button id="pvDbg" style="background:#2a4">顯示判定:關</button><span>速度:</span><button data-s="1">正常</button><button data-s="2">1/2</button><button data-s="4">1/4</button>
 <span>出招:</span><button data-f="0">虹彩光柱</button><button data-f="1">假結晶</button><button data-f="2">方向錯亂</button><button data-f="3">12 方向彈</button><button id="pvRes">打中假結晶(共鳴)</button>
 <span>下一色(立刻預告):</span><button data-c="0">赤紅</button><button data-c="1">湛藍</button><button data-c="2">幻紫</button>
 <button id="pvWc">光柱:白芯</button>
 <span>血量:</span><button data-h="1">100%</button><button data-h="0.3">30%</button>
 <button id="pvKill">一鍵打死</button><button id="pvQ">畫質切換</button>
 <span id="pvSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">顯示判定:紅框=本體碰撞與受擊(22×22)、橘框=假結晶(打中扣特攻量 15% 並引爆共鳴)、紅填色=光柱生效扣血範圍、黃虛線=光柱預警(不扣血)、紅細框=灼燒格扣血帶(格頂上 1 到格頂下 9)、綠線=可站立平台、紅小框=子彈判定、黃框=主角判定</div>
</div>
<script>
(function(){
const $=id=>document.getElementById(id);let inv=true,auto=true,dbg=false,spd=1,fc=0,forceT=0;
const into=skip=>{resetRun();G.world=7;G.sub=5;hudEl.style.display='flex';startLevel();G.modal=null;G.state='play';if(skip){for(let i=0;i<300;i++){P.inv=999;update();}}};
$('pvIn').onclick=()=>into(0);$('pvGo').onclick=()=>into(1);
$('pvInv').onclick=()=>{inv=!inv;$('pvInv').textContent='主角無敵:'+(inv?'開':'關');};
$('pvAuto').onclick=()=>{auto=!auto;$('pvAuto').textContent='自動出招:'+(auto?'開':'關');};
$('pvDbg').onclick=()=>{dbg=!dbg;$('pvDbg').textContent='顯示判定:'+(dbg?'開':'關');};
$('pvWc').onclick=()=>{B7NOWC=B7NOWC?0:1;$('pvWc').textContent='光柱:'+(B7NOWC?'無白芯':'白芯');};
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{spd=+b.dataset.s;});
document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{if(boss&&boss.alive)boss.hp=Math.max(1,Math.round(boss.max*+b.dataset.h));});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0)return;forceT=400;B.ai=+b.dataset.f;B.cd=0;});
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0)return;const c=+b.dataset.c;if(c===B.col){$('pvSt').textContent='下一色不能與目前同色(授權規則)';return;}
  B.colT=90;B.nCol=c;G.msg=B7NM[c];G.msgT=90;});
$('pvRes').onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0)return;if(!B.decoys.length){B.ai=1;B.cd=0;update();}const d=B.decoys[0];if(d)bossDamage({x:d.x,y:d.y,w:22,h:22,key:'f0'},1);};
$('pvKill').onclick=()=>{if(!boss||!boss.alive)return;boss.introT=0;bossDamage(bossParts()[0],1e8);};
$('pvQ').onclick=()=>toggleQuality();
const _u=update;update=function(){
  if(spd>1&&(fc++%spd))return;
  if(inv&&P){P.inv=Math.max(P.inv,2);if(P.lives<3)P.lives=3;}
  const B=boss;if(B&&B.alive&&G.world===7&&B.introT<=0&&!auto&&forceT<=0)B.cd=Math.max(B.cd,40);
  if(forceT>0)forceT--;
  _u();
  if(B&&G.world===7){const nm=['赤紅','湛藍','幻紫'];$('pvSt').textContent='血量 '+Math.round(B.hp/B.max*100)+'% / 目前 '+nm[B.col]+(B.nCol>=0?' → 預告 '+nm[B.nCol]+'(剩 '+B.colT+' 幀)':'(生效,'+(B.colT-90)+' 幀後預告)')+' / '+(G.state==='win'?'死亡第 '+G.sT+' 幀':B.introT>0?'登場第 '+(300-B.introT)+' 幀':'戰鬥中');}
};
const _d=drawEBulTop;drawEBulTop=function(ox,oy){_d(ox,oy);const B=boss;if(!dbg||!B||G.world!==7)return;
  const k=PW/W,kh=PH/H,X=v=>(v+ox-cam.x)*k,Y=v=>(v+oy-cam.y)*kh,c=octx;c.save();c.lineWidth=2;
  const rect=(x,y,w,h,col,dash,fill)=>{if(fill){c.fillStyle=fill;c.fillRect(X(x),Y(y),w*k,h*kh);}c.strokeStyle=col;c.setLineDash(dash?[6,4]:[]);c.strokeRect(X(x),Y(y),w*k,h*kh);c.setLineDash([]);};
  if(B.alive){for(const p of bossParts())rect(p.x,p.y,p.w,p.h,p.key==='core'?'#ff3030':'#ffa030');
    for(const z of hazs){if(z.t<=z.warn)rect(z.x,z.y,z.w,z.h,'#ffd23a',1);else rect(z.x,z.y,z.w,z.h,'#ff3030',0,'rgba(255,40,40,.25)');}
    for(const [x,y] of B.cells){const v=T(x,y);if(v===5)rect(x*TS,y*TS-1,TS,10,'#ff3030');else if(v===3){c.strokeStyle='#3fff6a';c.beginPath();c.moveTo(X(x*TS),Y(y*TS));c.lineTo(X(x*TS+TS),Y(y*TS));c.stroke();}}}
  for(const e of ebul)rect(e.x-e.r,e.y-e.r,e.r*2,e.r*2,'#ff3030');
  for(const e of ens)rect(e.x,e.y,e.w,e.h,'#ff3030');
  rect(P.x,P.y,P.w,P.h,'#ffe040');c.restore();};
into(0);
})();
</script>
`;
s=s.replace('</body>',bar+'</body>');
fs.mkdirSync(path.join(root,'preview'),{recursive:true});fs.writeFileSync(path.join(root,'preview/boss7.html'),s);console.log('已存 preview/boss7.html');
