// PIXEL STRIKE FORCE 無頭瀏覽器測試工具(v0.6 起;只供開發用,遊戲執行時不會載入)
// 需要:Node 18+、playwright 套件、Chrome。在 repo 根目錄執行:
//   node tools/harness.js smoke [檔案]              50 小關 × 三種武器各跑一段,檢查執行錯誤
//   node tools/harness.js special [檔案]            特攻功能檢查:一般關清空與回充、各魔王扣血、6 王選單、7 王、4 王隱身、登場禁用
//   node tools/harness.js bench <舊檔> <新檔> [輪數] 繪圖時間相對比較(沙盒數字,非測試機)
//   node tools/harness.js shot <大關> <小關> <幀數> <輸出.png> [特攻=0/1] [檔案]   截一張遊戲畫面
//   node tools/harness.js sheet <小關> <畫質 low/high> <輸出.png> [檔案] [FX設定,如 fv=V1,t7=B]  10 大關同一小關拼成 5×2 對照圖(每格 512×288)
// [檔案] 省略時為 repo 根目錄的 index.html。環境變數 CHROME 可指定 Chrome 路徑。
// 做法:載入前把 requestAnimationFrame 換成空函式,改由腳本手動呼叫 update()/render(),所以結果可重現、不受機器速度影響。
const path=require('path');
const {chromium}=require('playwright');
const fs=require('fs');
const ROOT=path.resolve(__dirname,'..');
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const url=f=>'file://'+path.resolve(f||path.join(ROOT,'index.html'));

async function open(file,vp){
  const br=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
  const pg=await br.newPage({viewport:vp||{width:1280,height:720}});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await pg.goto(url(file));
  // 共用輔助:進關、推進幀(主角無敵)、按一次特攻、移到敵人最密段
  await pg.evaluate(()=>{
    window.HX={
      go(w,s){resetRun();G.world=w;G.sub=s;startLevel();G.modal=null;G.state='play';},
      run(n,draw){for(let i=0;i<n;i++){P.inv=999;P.lives=5;update();if(draw)render();}},
      press(){K.s=1;update();K.s=0;update();},
      crowd(){let best=0,bx=0;for(let x=0;x<map.w*16;x+=32){const k=ens.filter(e=>e.x>x+100&&e.x<x+500).length;if(k>best){best=k;bx=x;}}
        P.x=bx+80;P.y=40;P.vy=0;P.safeX=P.x;P.safeY=P.y;},
      pct(a,b,m){return ((a-b)/m*100).toFixed(2)+'%';}
    };
  });
  return {br,pg,errs};
}

async function smoke(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{let n=0;
    for(let w=1;w<=10;w++)for(let s=1;s<=5;s++)for(const wp of['smg','flame','shot']){
      HX.go(w,s);wep=wp;wlvl=1+((w+s)%4);if(s===5)HX.run(300);
      K.f=1;for(let i=0;i<120;i++){K.r=i%60<40?1:0;K.u=i%90<20?1:0;HX.run(1,true);n++;}K.f=0;K.r=0;K.u=0;}
    return n+' 幀';});
  console.log('smoke',r);console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return errs.length;
}

async function special(file){
  const {br,pg,errs}=await open(file);
  const out=await pg.evaluate(()=>{const o=[];
    for(let w=1;w<=10;w++)for(let s=1;s<=4;s++){HX.go(w,s);HX.run(20);HX.crowd();HX.run(60);
      const n=ens.length;G.charge=100;HX.press();HX.run(260);
      o.push(`${w}-${s} 敵${n} 剩${ens.length} 回充${Math.floor(G.charge)}(應為${n*5>100?100:n*5}) 飛彈殘${bombs.length} 飛機${plane?'未離場':'已離場'}`);}
    for(let w=1;w<=10;w++){if(w===6)continue;HX.go(w,5);HX.run(320);const h=boss.hp;G.charge=100;HX.press();
      const ok=!G.noSpecial;HX.run(400);o.push(`王${w} 扣${HX.pct(h,boss.hp,boss.max)}(應為 8.00%)${ok?'':' noSpecial'}`);}
    for(const pk of['k','c','avg','cancel']){HX.go(6,5);HX.run(320);const k0=boss.kh,c0=boss.ch;G.charge=100;HX.press();
      const m=!!(G.modal&&G.modal.spPick);if(pk==='cancel')G.modal=null;else spPick(pk);HX.run(400);
      o.push(`王6 ${pk} 選單${m?'有':'無'} 騎士扣${HX.pct(k0,boss.kh,boss.max)} 詠嘆者扣${HX.pct(c0,boss.ch,boss.max)} 特攻量${G.charge}`);}
    HX.go(7,5);HX.run(320);for(let i=0;i<4000&&!boss.decoys.length;i++)HX.run(1);
    if(boss.decoys.length){const h=boss.hp;G.charge=100;HX.press();const ks=bombs.filter(m=>m.boss).map(m=>m.key);HX.run(300);
      o.push(`王7 假結晶${boss.decoys.length} 分配${ks} 扣${HX.pct(h,boss.hp,boss.max)} 懲罰${boss.decoysLocked?'已觸發':'未觸發'}`);}
    HX.go(4,5);HX.run(320);boss.hp=boss.max*0.295;let i=0;for(;i<600&&!boss.hidden;i++)HX.run(1);
    if(boss.hidden){const h=boss.hp;G.charge=100;HX.press();HX.run(80);const hv=bombs.length,mid=boss.hp;let t=0;while(boss.hidden&&t<400){HX.run(1);t++;}HX.run(200);
      o.push(`王4 隱身中施放:盤旋${hv} 隱身期間扣${HX.pct(h,mid,boss.max)} 現身後總扣${HX.pct(h,boss.hp,boss.max)}`);}
    HX.go(3,5);HX.run(10);G.charge=100;HX.press();o.push(`登場期間施放:${plane?'有反應(錯誤)':'無反應(正確)'}`);
    return o;});
  console.log(out.join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return errs.length;
}

async function benchOne(file,rounds){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(R=>{let tu=0,tr=0,n=0;
    for(let k=0;k<R;k++)for(let w=1;w<=10;w++)for(let s=1;s<=5;s++){
      HX.go(w,s);HX.run(s===5?320:20);if(s<5){HX.crowd();HX.run(60);}
      G.charge=100;HX.press();if(G.modal&&G.modal.spPick&&window.spPick)spPick('avg');K.f=1;
      for(let i=0;i<240;i++){P.inv=999;P.lives=5;const a=performance.now();update();const b=performance.now();render();const c=performance.now();tu+=b-a;tr+=c-b;n++;}
      K.f=0;}
    return {邏輯ms:(tu/n).toFixed(3),繪圖ms:(tr/n).toFixed(3),幀:n};},rounds);
  await br.close();return [r,errs];
}
async function bench(a,b,rounds){
  for(const f of[a,b]){const [r,e]=await benchOne(f,rounds||1);console.log(path.basename(f),JSON.stringify(r),'錯誤',e.length?e.slice(0,3):'無');}
}

async function shot(w,s,frames,outp,sp,file){
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  await pg.evaluate(([w,s,f,sp])=>{HX.go(w,s);HX.run(s===5?320:20);if(s<5){HX.crowd();HX.run(60);}
    if(sp){G.charge=100;HX.press();if(G.modal&&G.modal.spPick)spPick('avg');}HX.run(f,false);render();},[+w,+s,+frames,+sp]);
  await pg.screenshot({path:outp});console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();
}
async function sheet(s,q,outp,file,opt){              // 10 大關對照拼圖:同一小關、同一畫質,鏡頭移到敵人最密段
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const data=await pg.evaluate(([s,q,opt])=>{
    if(opt)for(const kv of opt.split(',')){const [k,v]=kv.split('=');FX[k]=v;}
    if(typeof T7!=='undefined'&&FX.t7)THEME[6]=T7[FX.t7];
    const sh=document.createElement('canvas');sh.width=512*5;sh.height=288*2;const sx=sh.getContext('2d');
    for(let w=1;w<=10;w++){HX.go(w,s);FX.q=q;HX.run(s===5?320:20);if(s<5){HX.crowd();HX.run(90,true);}else HX.run(60,true);render();
      sx.drawImage(cv,((w-1)%5)*512,Math.floor((w-1)/5)*288,512,288);}
    return sh.toDataURL('image/png');},[+s,q,opt||'']);
  fs.writeFileSync(outp,Buffer.from(data.split(',')[1],'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();
}

(async()=>{const [cmd,...a]=process.argv.slice(2);let bad=0;
  if(cmd==='smoke')bad=await smoke(a[0]);
  else if(cmd==='special')bad=await special(a[0]);
  else if(cmd==='bench')await bench(a[0],a[1],+a[2]||1);
  else if(cmd==='shot')await shot(a[0],a[1],a[2],a[3],a[4]||0,a[5]);
  else if(cmd==='sheet')await sheet(a[0],a[1]||'low',a[2],a[3]||undefined,a[4]);
  else{console.log(require('fs').readFileSync(__filename,'utf8').split('\n').slice(0,9).join('\n'));}
  process.exit(bad?1:0);})();
