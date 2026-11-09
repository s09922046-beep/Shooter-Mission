// 1 王預覽頁產生器(11/9 第 3 回):複製 index.html 並加控制列 → preview/boss1.html(不提交)
// 控制列:進場(含登場)、直接開打、主角無敵、自動出招、顯示判定、速度 1、1/2、1/4、指定出招、裝甲全破、跳到復原前 2 秒、火圈樣式 A/B(復原預兆已定 A)、血量、一鍵打死、畫質
// 用法:node art-src/boss1-gen/preview.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bar=`
<div id="pv" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18ee;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>1 王預覽(工作版)</b>
 <button id="pvIn">進場(含登場)</button><button id="pvGo">直接開打</button><button id="pvInv">主角無敵:開</button><button id="pvAuto">自動出招:開</button>
 <button id="pvDbg" style="background:#2a4">顯示判定:關</button><span>速度:</span><button data-s="1">正常</button><button data-s="2">1/2</button><button data-s="4">1/4</button>
 <span>出招:</span><button data-f="0">電流條</button><button data-f="1">燃燒彈</button><button data-f="2">召喚無人機</button>
 <button id="pvBrk">裝甲全破</button><button id="pvRg">跳到復原前 2 秒</button>
 <span>火圈:</span><button data-p="A">A 半球火球爆</button><button data-p="B">B 貼地衝擊爆</button>
 <span>血量:</span><button data-h="1">100%</button><button data-h="0.4">40%</button><button data-h="0.2">20%</button>
 <button id="pvKill">一鍵打死</button><button id="pvQ">畫質切換</button>
 <span id="pvSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">顯示判定:灰框=艦體碰撞(碰到扣血,160×112)、藍框=裝甲板、橘框=核心、黃虛線=預警(不扣血)、紅填色=生效扣血、紅小框=子彈與無人機、黃框=主角</div>
</div>
<script>
(function(){
const $=id=>document.getElementById(id);let inv=true,auto=true,dbg=false,spd=1,fc=0,forceT=0;
const into=skip=>{resetRun();G.world=1;G.sub=5;hudEl.style.display='flex';startLevel();G.modal=null;G.state='play';if(skip){for(let i=0;i<300;i++){P.inv=999;update();}}};
$('pvIn').onclick=()=>into(0);$('pvGo').onclick=()=>into(1);
$('pvInv').onclick=()=>{inv=!inv;$('pvInv').textContent='主角無敵:'+(inv?'開':'關');};
$('pvAuto').onclick=()=>{auto=!auto;$('pvAuto').textContent='自動出招:'+(auto?'開':'關');};
$('pvDbg').onclick=()=>{dbg=!dbg;$('pvDbg').textContent='顯示判定:'+(dbg?'開':'關');};
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{spd=+b.dataset.s;});
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{B1PF=b.dataset.p;});
document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{if(boss&&boss.alive)boss.hp=Math.max(1,Math.round(boss.max*+b.dataset.h));});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const B=boss;if(!B||!B.alive||B.introT>0)return;forceT=400;B.ai=+b.dataset.f;B.cd=+b.dataset.f===2?40:0;});
$('pvBrk').onclick=()=>{if(boss&&boss.alive)boss.plates=[0,0,0];};
$('pvRg').onclick=()=>{if(boss&&boss.alive){boss.plates=[0,0,0];boss.exposedT=360;}};
$('pvKill').onclick=()=>{if(!boss||!boss.alive)return;boss.introT=0;bossDamage(bossParts().find(p=>p.key==='core'),1e8);};
$('pvQ').onclick=()=>toggleQuality();
const _u=update;update=function(){
  if(spd>1&&(fc++%spd))return;
  if(inv&&P){P.inv=Math.max(P.inv,2);if(P.lives<3)P.lives=3;}
  const B=boss;if(B&&B.alive&&G.world===1&&B.introT<=0&&!auto&&forceT<=0)B.cd=Math.max(B.cd,40);
  if(forceT>0)forceT--;
  _u();
  if(B&&G.world===1){$('pvSt').textContent='血量 '+Math.round(B.hp/B.max*100)+'% / 裝甲 '+B.plates.map(v=>Math.max(0,Math.round(v))).join('、')+(B.plates.every(v=>v<=0)?'(裸露 '+B.exposedT+'/480 幀)':'')+' / 無人機 '+ens.filter(e=>e.type==='drone').length+' 隻 / '+(G.state==='win'?'死亡第 '+G.sT+' 幀':B.introT>0?'登場第 '+(300-B.introT)+' 幀':'戰鬥中')+' / 火圈 '+B1PF;}
};
const _d=drawEBulTop;drawEBulTop=function(ox,oy){_d(ox,oy);const B=boss;if(!dbg||!B||G.world!==1)return;
  const k=PW/W,kh=PH/H,X=v=>(v+ox-cam.x)*k,Y=v=>(v+oy-cam.y)*kh,c=octx;c.save();c.lineWidth=2;
  const rect=(x,y,w,h,col,dash,fill)=>{if(fill){c.fillStyle=fill;c.fillRect(X(x),Y(y),w*k,h*kh);}c.strokeStyle=col;c.setLineDash(dash?[6,4]:[]);c.strokeRect(X(x),Y(y),w*k,h*kh);c.setLineDash([]);};
  if(B.alive){rect(B.x,B.y,B.w,B.h,'#c0c0c0');for(const p of bossParts())rect(p.x,p.y,p.w,p.h,p.key==='core'?'#ffa030':'#40b0ff');
    for(const z of hazs){if(z.t<=z.warn)rect(z.x,z.y,z.w,z.h,'#ffd23a',1);else rect(z.x,z.y,z.w,z.h,'#ff3030',0,'rgba(255,40,40,.25)');}}
  for(const e of ebul)rect(e.x-e.r,e.y-e.r,e.r*2,e.r*2,'#ff3030');
  for(const e of ens)rect(e.x,e.y,e.w,e.h,'#ff3030');
  rect(P.x,P.y,P.w,P.h,'#ffe040');c.restore();};
into(0);
})();
</script>
`;
s=s.replace('</body>',bar+'</body>');
fs.mkdirSync(path.join(root,'preview'),{recursive:true});fs.writeFileSync(path.join(root,'preview/boss1.html'),s);console.log('已存 preview/boss1.html');
