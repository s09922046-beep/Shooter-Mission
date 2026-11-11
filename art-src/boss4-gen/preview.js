// 4 王預覽頁產生器(11/11 第 3 回):複製 index.html 並加控制列 → preview/boss4.html(不提交)
// 控制列:進場(含登場)、直接開打、主角無敵、自動出招、顯示判定、速度 1、1/2、1/4、指定出招、骨影閃瞬(指定現身位置)、上層崩毀、直接移到左右側、一鍵打死、畫質
// 用法:node art-src/boss4-gen/preview.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bar=`
<div id="pv" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18ee;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>4 王預覽(工作版)</b>
 <button id="pvIn">進場(含登場)</button><button id="pvGo">直接開打</button><button id="pvInv">主角無敵:開</button><button id="pvAuto">自動出招:開</button>
 <button id="pvDbg" style="background:#2a4">顯示判定:關</button><span>速度:</span><button data-s="1">正常</button><button data-s="2">1/2</button><button data-s="4">1/4</button>
 <span>出招:</span><button data-f="0">沿層推進</button><button data-f="1">鎖定範圍</button><button data-f="2">骨矛落下</button>
 <span>骨影閃瞬→</span><button data-k="0">右上</button><button data-k="1">右下</button><button data-k="2">左上</button><button data-k="3">左下</button>
 <button id="pvCr">上層崩毀(血量 49%)</button><span>直接移到:</span><button data-p="r">右側(開場)</button><button data-p="l">左側</button>
 <button id="pvKill">一鍵打死</button><button id="pvQ">畫質切換</button>
 <span id="pvSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">顯示判定:灰虛線=本體 150×120(碰到不扣血)、橘框=蛇頭(唯一部件,碰到扣血)、綠=繩梯與平台、黃虛線=預警(不扣血)、紅填色=生效扣血、黃框=主角</div>
</div>
<script>
(function(){
const $=id=>document.getElementById(id);let inv=true,auto=true,dbg=false,spd=1,fc=0,forceT=0,fk=-1;
const POS=[{x:402,hy:8,label:'右上'},{x:402,hy:14*TS-30,label:'右下'},{x:-16,hy:8,label:'左上'},{x:-16,hy:14*TS-30,label:'左下'}];
const into=skip=>{resetRun();G.world=4;G.sub=5;hudEl.style.display='flex';startLevel();G.modal=null;G.state='play';if(skip){for(let i=0;i<300;i++){P.inv=999;update();}}};
$('pvIn').onclick=()=>into(0);$('pvGo').onclick=()=>into(1);
$('pvInv').onclick=()=>{inv=!inv;$('pvInv').textContent='主角無敵:'+(inv?'開':'關');};
$('pvAuto').onclick=()=>{auto=!auto;$('pvAuto').textContent='自動出招:'+(auto?'開':'關');};
$('pvDbg').onclick=()=>{dbg=!dbg;$('pvDbg').textContent='顯示判定:'+(dbg?'開':'關');};
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{spd=+b.dataset.s;});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0||B.hidden)return;forceT=300;B.ai=+b.dataset.f;B.cd=0;});
document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0||B.hidden)return;B.flash30=false;B.flash10=true;B.hp=Math.min(B.hp,Math.round(B.max*0.3));fk=+b.dataset.k;});
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0||B.hidden)return;B.x=b.dataset.p==='l'?-16:356;});
$('pvCr').onclick=()=>{const B=boss;if(B&&B.alive&&!B.p2)B.hp=Math.round(B.max*0.49);};
$('pvKill').onclick=()=>{if(!boss||!boss.alive)return;boss.introT=0;boss.hidden=false;bossDamage({x:0,y:0,w:1,h:1,key:'core'},1e8);};
$('pvQ').onclick=()=>toggleQuality();
const _u=update;update=function(){
  if(spd>1&&(fc++%spd))return;
  if(inv&&P){P.inv=Math.max(P.inv,2);if(P.lives<3)P.lives=3;}
  const B=boss;if(B&&B.alive&&G.world===4&&B.introT<=0&&!auto&&forceT<=0)B.cd=Math.max(B.cd,40);
  if(forceT>0)forceT--;
  _u();
  if(fk>=0&&B&&B.flashPhase==='wait'){B.flashTarget=POS[fk];G.msg='骨影閃瞬 → '+POS[fk].label;fk=-1;}
  if(B&&G.world===4){$('pvSt').textContent='血量 '+Math.round(B.hp/B.max*100)+'% / 下一招 '+['沿層推進','鎖定範圍','骨矛落下'][B.ai%3]+'('+B.cd+' 幀後) / '+(G.state==='win'?'死亡第 '+G.sT+' 幀':B.introT>0?'登場第 '+(300-B.introT)+' 幀':B.hidden?'骨影閃瞬(剩 '+B.flashT+' 幀)':B.crT>0?'上層龜裂(剩 '+B.crT+' 幀)':'戰鬥中');}
};
const _d=drawEBulTop;drawEBulTop=function(ox,oy){_d(ox,oy);const B=boss;if(!dbg||!B||G.world!==4)return;
  const k=PW/W,kh=PH/H,X=v=>(v+ox-cam.x)*k,Y=v=>(v+oy-cam.y)*kh,c=octx;c.save();c.lineWidth=2;
  const rect=(x,y,w,h,col,dash,fill)=>{if(fill){c.fillStyle=fill;c.fillRect(X(x),Y(y),w*k,h*kh);}c.strokeStyle=col;c.setLineDash(dash?[6,4]:[]);c.strokeRect(X(x),Y(y),w*k,h*kh);c.setLineDash([]);};
  for(let ty=0;ty<GH;ty++)for(let tx=0;tx<32;tx++){const t=T(tx,ty);if(t===2)rect(tx*TS,ty*TS,TS,TS,'#3fff6a',1);if(t===3)rect(tx*TS,ty*TS,TS,4,'#3fff6a');}
  if(B.alive){rect(B.x,B.y,B.w,B.h,'#707070',1);for(const p of bossParts())rect(p.x,p.y,p.w,p.h,'#ffa030');
    for(const z of hazs){if(z.t<=z.warn)rect(z.x,z.y,z.w,z.h,'#ffd23a',1);else rect(z.x,z.y,z.w,z.h,'#ff3030',0,'rgba(255,40,40,.25)');}}
  for(const e of ebul)rect(e.x-e.r,e.y-e.r,e.r*2,e.r*2,'#ff3030');
  for(const e of ens)rect(e.x,e.y,e.w,e.h,'#ff3030');
  rect(P.x,P.y,P.w,P.h,'#ffe040');c.restore();};
into(0);
})();
</script>
`;
s=s.replace('</body>',bar+'</body>');
fs.mkdirSync(path.join(root,'preview'),{recursive:true});fs.writeFileSync(path.join(root,'preview/boss4.html'),s);console.log('已存 preview/boss4.html');
