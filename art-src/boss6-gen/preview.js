// 6 王預覽頁產生器(11/12 第 3 回):複製 index.html 並加控制列 → preview/boss6.html(不提交)
// 控制列:進場(含登場)、直接開打、騎士外觀 B/C 切換、主角無敵、自動出招、顯示判定、速度 1、1/2、1/4、指定出招、受損階段、先打死騎士/詠嘆者、一鍵打死、畫質
// 用法:node art-src/boss6-gen/preview.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bar=`
<div id="pv" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18ee;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>6 王預覽(工作版)</b>
 <button id="pvIn">進場(含登場)</button><button id="pvGo">直接開打</button>
 <button id="pvInv">主角無敵:開</button><button id="pvAuto">自動出招:開</button>
 <button id="pvDbg" style="background:#2a4">顯示判定:關</button><span>速度:</span><button data-s="1">正常</button><button data-s="2">1/2</button><button data-s="4">1/4</button>
 <span>騎士:</span><button data-k="0">揮砍</button><button data-k="1">衝刺</button><button data-k="2">橫掃</button>
 <span>詠嘆者:</span><button data-c="0">地面圈</button><button data-c="1">縱柱</button><button data-c="2">繩索隱形</button>
 <span>受損:</span><button data-h="1">100%</button><button data-h="0.45">45%</button><button data-h="0.2">20%</button>
 <button id="pvKk">先打死騎士</button><button id="pvKc">先打死詠嘆者</button><button id="pvKill">一鍵打死(剩下的)</button><button id="pvQ">畫質切換</button>
 <span id="pvSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">顯示判定:橘框=騎士(平時碰到不扣血、衝刺中扣血)、青框=詠嘆者、綠=繩梯與平台、黃虛線=預警(不扣血)、紅填色=生效扣血、黃框=主角。指定出招會在下一幀發動。</div>
</div>
<script>
(function(){
const $=id=>document.getElementById(id);let inv=true,auto=true,dbg=false,spd=1,fc=0,fK=-1,fC=-1;
const into=skip=>{resetRun();G.world=6;G.sub=5;hudEl.style.display='flex';startLevel();G.modal=null;G.state='play';if(skip){for(let i=0;i<300;i++){P.inv=999;update();}}};
$('pvIn').onclick=()=>into(0);$('pvGo').onclick=()=>into(1);
$('pvInv').onclick=()=>{inv=!inv;$('pvInv').textContent='主角無敵:'+(inv?'開':'關');};
$('pvAuto').onclick=()=>{auto=!auto;$('pvAuto').textContent='自動出招:'+(auto?'開':'關');};
$('pvDbg').onclick=()=>{dbg=!dbg;$('pvDbg').textContent='顯示判定:'+(dbg?'開':'關');};
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{spd=+b.dataset.s;});
const ok=()=>boss&&boss.alive&&boss.introT<=0&&G.world===6;
document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(ok()&&boss.kh>0&&boss.st!=='dash')fK=+b.dataset.k;});
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{if(ok()&&boss.ch>0&&!(+b.dataset.c===2&&(boss.rw>0||boss.zap>0)))fC=+b.dataset.c;});
document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{if(!ok())return;const k=+b.dataset.h;if(boss.kh>0)boss.kh=Math.max(1,boss.kMax*k);if(boss.ch>0)boss.ch=Math.max(1,boss.cMax*k);boss.hp=boss.kh+boss.ch;});
$('pvKk').onclick=()=>{if(ok()&&boss.kh>0&&boss.ch>0)bossDamage(bossParts().find(p=>p.key==='k'),1e8);};
$('pvKc').onclick=()=>{if(ok()&&boss.kh>0&&boss.ch>0)bossDamage(bossParts().find(p=>p.key==='c'),1e8);};
$('pvKill').onclick=()=>{if(!boss||!boss.alive)return;boss.introT=0;for(const p of bossParts())if(boss.alive)bossDamage(p,1e8);};
$('pvQ').onclick=()=>toggleQuality();
const MR=Math.random;
const _u=update;update=function(){
  if(spd>1&&(fc++%spd))return;
  if(inv&&P){P.inv=Math.max(P.inv,2);if(P.lives<3)P.lives=3;}
  const B=boss;let f=null;
  if(B&&B.alive&&G.world===6&&B.introT<=0&&!(B.b6p>0)){
    if(!auto){B.kcd=Math.max(B.kcd||0,40);B.ccd=Math.max(B.ccd||0,40);}
    if(fK>=0){B.kcd=0;B.lastK=-1;f=fK;fK=-1;B.ccd=Math.max(B.ccd||0,1);}
    else if(fC>=0){B.ccd=0;f=fC;fC=-1;B.kcd=Math.max(B.kcd||0,1);}}
  if(f!==null)Math.random=()=>(f+0.5)/3;
  try{_u();}finally{Math.random=MR;}
  if(B&&G.world===6){$('pvSt').textContent='騎士 '+Math.round(B.kh/B.kMax*100)+'% / 詠嘆者 '+Math.round(B.ch/B.cMax*100)+'% / '+(G.state==='win'?'死亡第 '+G.sT+' 幀':B.introT>0?'登場第 '+(300-B.introT)+' 幀':B.b6p>0?'先死者停頓(剩 '+B.b6p+' 幀)':B.rw>0?'繩索隱形預警(剩 '+B.rw+' 幀)':B.zap>0?'繩索消失(剩 '+B.zap+' 幀)':'戰鬥中');}
};
const _d=drawEBulTop;drawEBulTop=function(ox,oy){_d(ox,oy);const B=boss;if(!dbg||!B||G.world!==6)return;
  const k=PW/W,kh=PH/H,X=v=>(v+ox-cam.x)*k,Y=v=>(v+oy-cam.y)*kh,c=octx;c.save();c.lineWidth=2;
  const rect=(x,y,w,h,col,dash,fill)=>{if(fill){c.fillStyle=fill;c.fillRect(X(x),Y(y),w*k,h*kh);}c.strokeStyle=col;c.setLineDash(dash?[6,4]:[]);c.strokeRect(X(x),Y(y),w*k,h*kh);c.setLineDash([]);};
  for(let ty=0;ty<GH;ty++)for(let tx=0;tx<32;tx++){const t=T(tx,ty);if(t===2)rect(tx*TS,ty*TS,TS,TS,'#3fff6a',1);if(t===3)rect(tx*TS,ty*TS,TS,4,'#3fff6a');}
  if(B.alive){for(const p of bossParts())rect(p.x,p.y,p.w,p.h,p.key==='k'?(B.st==='dash'?'#ff3030':'#ffa030'):'#3ff0e0');
    for(const z of hazs){if(z.t<=z.warn)rect(z.x,z.y,z.w,z.h,'#ffd23a',1);else rect(z.x,z.y,z.w,z.h,'#ff3030',0,'rgba(255,40,40,.25)');}}
  for(const e of ebul)rect(e.x-e.r,e.y-e.r,e.r*2,e.r*2,'#ff3030');
  for(const e of ens)rect(e.x,e.y,e.w,e.h,'#ff3030');
  rect(P.x,P.y,P.w,P.h,'#ffe040');c.restore();};
into(0);
})();
</script>
`;
s=s.replace('</body>',bar+'</body>');
fs.mkdirSync(path.join(root,'preview'),{recursive:true});fs.writeFileSync(path.join(root,'preview/boss6.html'),s);console.log('已存 preview/boss6.html');
