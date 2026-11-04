// PIXEL STRIKE FORCE 無頭瀏覽器測試工具(v0.6 起;只供開發用,遊戲執行時不會載入)
// 需要:Node 18+、playwright 套件、Chrome。在 repo 根目錄執行:
//   node tools/harness.js smoke [檔案]              50 小關 × 三種武器各跑一段,檢查執行錯誤
//   node tools/harness.js special [檔案]            特攻功能檢查:一般關清空與回充、各魔王扣血、6 王選單、7 王、4 王隱身、登場禁用
//   node tools/harness.js bench <舊檔> <新檔> [輪數] 繪圖時間相對比較(沙盒數字,非測試機)
//   node tools/harness.js shot <大關> <小關> <幀數> <輸出.png> [特攻=0/1] [檔案]   截一張遊戲畫面
//   node tools/harness.js sheet <小關> <畫質 low/high> <輸出.png> [檔案] [FX設定,如 q=high,seed=3]  seed=N 固定亂數(同一批地圖)  10 大關同一小關拼成 5×2 對照圖(每格 512×288)
//   node tools/harness.js vine [種子數] [檔案]           繩梯攀爬測試(v0.11):從底爬到頂、站上頂端、從頂端爬回底部
//   node tools/harness.js edraw <舊檔> <新檔> [次數]  雜兵繪製量測(v0.12;v0.13 加第 2、6 關;v0.14 加第 3、7 關;v0.15 加第 4、8 關;v0.16 加第 10 關):第 1~10 關各 16 隻排進畫面,量 drawEnemies 每次耗時與首次烘焙
//   node tools/harness.js eface [檔案]  飛行兵與蜂懸停於主角正上方 600 幀:統計 e.face 翻轉次數與畫面朝向(eFace)翻轉次數(v0.13;v0.14 加第 3、7 關;v0.15 加第 4、8 關;v0.16 加第 10 關)
//   node tools/harness.js vshift <每關種子數> <輸出前綴> [檔案] [FX設定]  視野上移壓力測試:統計地表高度,截每大關地形最低的段落
// [檔案] 省略時為 repo 根目錄的 index.html。環境變數 CHROME 可指定 Chrome 路徑。
// 做法:載入前把 requestAnimationFrame 換成空函式,改由腳本手動呼叫 update()/render(),所以結果可重現、不受機器速度影響。
const path=require('path');
const {chromium}=require('playwright');
const fs=require('fs');
const ROOT=path.resolve(__dirname,'..');
const CHROME=process.env.CHROME||{win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',darwin:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}[process.platform]||'/usr/bin/google-chrome';
const url=f=>require('url').pathToFileURL(path.resolve(f||path.join(ROOT,'index.html'))).href; // Windows 磁碟代號與空白需轉成正確的 file:/// 網址

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
      warm(){for(let i=0;i<60;i++){render();if(!MAT.done)return;const x0=Math.max(0,Math.floor(cam.x/16)-1),x1=Math.min(map.w-1,Math.floor((cam.x+W)/16)+1);
        let ok=true;for(let x=x0;x<=x1;x++)if(!MAT.done[x]){ok=false;break;}if(ok)return;}}, // 只跑 update 後截圖時,先把可見地面烘完(v0.8.1 起遊玩中單幀烘焙上限 3 ms)
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
    if(sp){G.charge=100;HX.press();if(G.modal&&G.modal.spPick)spPick('avg');}HX.run(f,false);HX.warm();render();},[+w,+s,+frames,+sp]);
  await pg.screenshot({path:outp});console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();
}
async function sheet(s,q,outp,file,opt){              // 10 大關對照拼圖:同一小關、同一畫質,鏡頭移到敵人最密段
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const data=await pg.evaluate(([s,q,opt])=>{
    if(opt)for(const kv of opt.split(',')){const [k,v]=kv.split('=');FX[k]=v;}
    if(typeof T7!=='undefined'&&FX.t7)THEME[6]=T7[FX.t7];
    const sh=document.createElement('canvas');sh.width=512*5;sh.height=288*2;const sx=sh.getContext('2d');
    const sd=+FX.seed||0;                               // seed=N:固定亂數,兩種方案可用同一批地圖對照(11/1)
    for(let w=1;w<=10;w++){if(sd){let a=(sd*1000+w)*2654435761>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
      HX.go(w,s);FX.q=q;HX.run(s===5?320:20);if(s<5){HX.crowd();HX.run(90,true);}else HX.run(60,true);render();
      sx.drawImage(cv,((w-1)%5)*512,Math.floor((w-1)/5)*288,512,288);}
    return sh.toDataURL('image/png');},[+s,q,opt||'']);
  fs.writeFileSync(outp,Buffer.from(data.split(',')[1],'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();
}

/* 繩梯攀爬測試(v0.11):每條可攀欄段(繩梯格,加上下皆繩梯的平台格)實際按鍵模擬:
   上:從底部按上,須一路攀住到頂格再脫離;站:頂端旁有立足處時,脫離後(不按/按左/按右任一)站上頂端高度;下:從頂端站立處按下,須一路攀住回到底部。
   一般小關固定種子,王關登場後掃描,10 王另測第三型態。 */
async function vine(n,file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(N=>{
    const seed=k=>{let a=k*2654435761>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
    const cl=(x,y)=>T(x,y)===2||(T(x,y)===3&&T(x,y-1)===2&&T(x,y+1)===2); // 欄段定義與版本無關,新舊版同一把尺
    const stand=(x,y)=>T(x,y)===1||T(x,y)===3;
    const clr=()=>{ens.length=0;ebul.length=0;if(window.items)items.length=0;G.modal=null;K.u=K.d=K.l=K.r=K.j=0;};
    const step=()=>{P.inv=999;P.lives=5;G.modal=null;if(window.items)items.length=0;update();};
    const segs=()=>{const o=[];for(let x=1;x<map.w-1;x++){let y=0;while(y<GH){if(T(x,y)===2){let t=y;while(t>0&&cl(x,t-1))t--;let b=y;while(b<GH-1&&cl(x,b+1))b++;
          if(!o.some(s=>s.x===x&&s.t===t))o.push({x,t,b});y=b+1;}else y++;}}return o;};
    const test=s=>{const res={up:false,stand:null,down:null};const cx=s.x*16+8-P.w/2;
      clr();P.x=cx;P.y=(s.b+1)*16-P.h;P.vy=0;P.vx=0;P.climb=true;K.u=1;let minY=P.y,ok=true;
      for(let i=0;i<500&&P.climb;i++){step();minY=Math.min(minY,P.y);}
      res.up=minY<=s.t*16;K.u=0;
      const top=stand(s.x,s.t+1)||stand(s.x-1,s.t+1)||stand(s.x+1,s.t+1);
      if(!top||!res.up)return res;
      const goal=(s.t+1)*16+1;let land=null;
      for(const side of[0,-1,1]){clr();P.x=cx;P.y=(s.b+1)*16-P.h;P.vy=0;P.vx=0;P.climb=true;K.u=1;
        for(let i=0;i<500&&P.climb;i++)step();K.u=0;K.l=side<0?1:0;K.r=side>0?1:0;
        for(let i=0;i<60;i++){step();if(i>8){K.l=K.r=0;}if(P.onG&&i>10)break;}
        if(P.onG&&P.y+P.h<=goal){land={x:P.x,y:P.y};break;}}
      res.stand=!!land;if(!land)return res;
      clr();P.x=cx;P.y=land.y;P.vy=0;P.climb=false;K.d=1;let got=false,maxB=0,drop=false;
      for(let i=0;i<600;i++){step();if(P.climb)got=true;else if(got){drop=true;break;}maxB=Math.max(maxB,P.y+P.h);}
      K.d=0;res.down=got&&maxB>=(s.b+1)*16-2&&(!drop||maxB>=(s.b+1)*16-2);
      return res;};
    const sum={seg:0,up:0,standT:0,stand:0,down:0,fail:[]};
    const run=(tag,prep)=>{for(const s of segs()){if(prep)prep();const q=test(s);sum.seg++;if(q.up)sum.up++;if(q.stand!==null){sum.standT++;if(q.stand)sum.stand++;}if(q.down)sum.down++;
        if(!q.up||q.stand===false||q.down===false)sum.fail.push(`${tag} x${s.x} 列${s.t}~${s.b} 上${q.up?'O':'X'} 站${q.stand===null?'-':q.stand?'O':'X'} 下${q.down===null?'-':q.down?'O':'X'}`);}};
    for(let k=1;k<=N;k++)for(let w=1;w<=10;w++)for(let s=1;s<=4;s++){seed(k*1000+w*10+s);HX.go(w,s);run(`種子${k} ${w}-${s}`);}
    for(let w=1;w<=10;w++){const prep=()=>{seed(w);HX.go(w,5);HX.run(320);clr();};prep();run(`王${w}`,prep);} // 王關每條重新進關,避免測試途中被魔王招式(如 3 王觸手抽回)打斷
    {const prep=()=>{seed(99);HX.go(10,5);HX.run(320);boss.ph=2;boss.hp=boss.max*0.3;HX.run(2);clr();};prep();run('王10 第三型態',prep);}
    return sum;},+n);
  console.log(`欄段 ${r.seg}:爬到頂 ${r.up};頂端有立足處 ${r.standT},站上 ${r.stand};從頂端爬回底部 ${r.down}`);
  console.log(r.fail.length?'未通過 '+r.fail.length+' 條:\n'+r.fail.slice(0,40).join('\n'):'全部通過');
  console.log('錯誤',errs.length?errs.slice(0,3):'無');await br.close();return r.fail.length+errs.length;
}

/* 視野上移壓力測試(v0.9):固定亂數種子大量生成一般小關,統計地表高度,找出每大關「一整個畫面寬內最高的立足點也最低」的段落,
   輸出統計 <輸出前綴>-stats.json 與該段落的 5×2 對照圖 <輸出前綴>.png。要比較上移前後,對舊版檔案(git show)再跑一次,種子相同即同一批地圖。 */
async function vshift(n,pre,file,opt){            // opt:截圖前套用的 FX 設定,如 q=high
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const res=await pg.evaluate(N=>{
    const seed=k=>{let a=k*2654435761>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
    const stand=(x)=>{let top=99;for(let y=0;y<GH;y++){const t=T(x,y);if((t===1||t===3)&&T(x,y-1)!==1){if(T(x,y-1)!==5){top=y;break;}}}return top;}; // 最高立足列(尖刺下方不算)
    const ground=(x)=>{for(let y=0;y<GH;y++)if(T(x,y)===1)return y;return 99;};                              // 主地面最上列(99=坑)
    const hist=new Array(GH).fill(0);let cols=0,levels=0;const worst={};
    for(let k=1;k<=N;k++)for(let w=1;w<=10;w++)for(let s=1;s<=4;s++){
      seed(k*1000+w*10+s);HX.go(w,s);levels++;
      const st=[],gr=[];for(let x=1;x<map.w-1;x++){st.push(stand(x));const g=ground(x);gr.push(g);if(g<99){hist[g]++;cols++;}}
      for(let x0=0;x0+32<=st.length;x0++){let hi=99,sum=0,c=0;
        for(let i=x0;i<x0+32;i++){hi=Math.min(hi,st[i]);if(gr[i]<99){sum+=gr[i];c++;}}
        const sc=hi*100+(c?sum/c:0);                       // 先比「畫面內最高立足點」,再比平均地面列
        if(!worst[w]||sc>worst[w].sc)worst[w]={sc,k,s,x:(x0+1)*16,hi,avg:+(c?sum/c:0).toFixed(2)};}
    }
    return {levels,cols,hist,worst};},+n);
  fs.writeFileSync(pre+'-stats.json',JSON.stringify(res,null,1));
  {
    const data=await pg.evaluate(([W_,opt])=>{
      if(opt)for(const kv of opt.split(',')){const [k,v]=kv.split('=');FX[k]=v;}
      const seed=k=>{let a=k*2654435761>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
      const sh=document.createElement('canvas');sh.width=512*5;sh.height=288*2;const sx=sh.getContext('2d');
      for(let w=1;w<=10;w++){const q=W_[w];seed(q.k*1000+w*10+q.s);HX.go(w,q.s);FX.q='low';
        const px_=q.x+256-5,gx=Math.floor((px_+5)/16);let gy=12;for(let y=0;y<GH;y++){if(T(gx,y)===1||T(gx,y)===3){gy=y;break;}}
        P.x=px_;P.y=gy*16-14;P.vy=0;P.safeX=P.x;P.safeY=P.y;cam.x=clamp(P.x+5-256,0,map.w*16-512);
        HX.run(40,true);render();
        sx.drawImage(cv,((w-1)%5)*512,Math.floor((w-1)/5)*288,512,288);}
      return sh.toDataURL('image/png');},[res.worst,opt||'']);
    fs.writeFileSync(pre+'.png',Buffer.from(data.split(',')[1],'base64'));
  }
  console.log(JSON.stringify({關卡數:res.levels,地面欄:res.cols,地面列分布:res.hist}));
  for(let w=1;w<=10;w++){const q=res.worst[w];console.log(`${w} 大關最低段:種子${q.k} ${w}-${q.s} x=${q.x} 畫面內最高立足列 ${q.hi} 平均地面列 ${q.avg}`);}
  console.log('錯誤',errs.length?errs.slice(0,3):'無');await br.close();
}

// v0.12:雜兵繪製針對性量測。每個檔案在第 1、2、5、6、9 關第 4 小關把所有敵人排進畫面,量 drawEnemies(含發光登記)每次耗時,另量首次烘焙
async function edraw(fa,fb,n){
  for(const f of [fa,fb]){const {br,pg,errs}=await open(f);
    const r=await pg.evaluate(n=>{const out=[];
      for(const w of [1,2,3,4,5,6,7,8,9,10]){HX.go(w,4);HX.run(5);
        ens.forEach((e,i)=>{e.x=cam.x+20+(i%16)*30;e.y=cam.y+60+Math.floor(i/16)*40;});
        while(ens.length<16){const t=ens[ens.length%Math.max(1,ens.length)]||{type:'grunt'};addEnemy(t.type,cam.x+20+ens.length*30,cam.y+100);}
        const b0=performance.now();if(typeof eBake==='function'){EB.key=-1;eBake();}const bake=performance.now()-b0;
        ctx.setTransform(1,0,0,1,-cam.x,-cam.y);gctx.setTransform(1,0,0,1,-cam.x,-cam.y);drawEnemies();
        const t0=performance.now();for(let i=0;i<n;i++){G.t++;for(const e of ens)e.t++;drawEnemies();}const per=(performance.now()-t0)/n;
        out.push({大關:w,敵人:ens.length,每次ms:per.toFixed(4),首次烘焙ms:bake.toFixed(2)});}
      return out;},n);
    console.log(path.basename(f||'index.html'),JSON.stringify(r));console.log('錯誤',errs.length?errs.slice(0,3):'無');await br.close();}
}

// v0.13:懸停敵人在主角正上方時是否左右急速翻面。只統計,不改遊戲狀態以外的東西;舊版沒有 vf 時以 e.face 當畫面朝向
async function eface(f){const {br,pg,errs}=await open(f);
  const r=await pg.evaluate(()=>{const out=[];
    for(const w of [1,2,3,4,5,6,7,8,9,10])for(const t of ['flyer','bee']){HX.go(w,4);ens.length=0;ebul.length=0;
      addEnemy(t,P.x+28,P.y-60);const e=ens[0];e.hp=1e9;let pf=e.face,pv=null,ff=0,vfl=0;
      for(let i=0;i<600;i++){P.inv=2;HX.run(1);if(!ens.includes(e))break;
        if(e.face!==pf){ff++;pf=e.face;}const v=typeof eFace==='function'?eFace(e):e.face;if(pv!==null&&v!==pv)vfl++;pv=v;}
      out.push(`${w} ${t}:e.face 翻轉 ${ff} 次、畫面朝向翻轉 ${vfl} 次`);}
    return out;});
  console.log(r.join('\n'));console.log('錯誤',errs.length?errs.slice(0,3):'無');await br.close();return errs.length;}

(async()=>{const [cmd,...a]=process.argv.slice(2);let bad=0;
  if(cmd==='smoke')bad=await smoke(a[0]);
  else if(cmd==='special')bad=await special(a[0]);
  else if(cmd==='bench')await bench(a[0],a[1],+a[2]||1);
  else if(cmd==='shot')await shot(a[0],a[1],a[2],a[3],a[4]||0,a[5]);
  else if(cmd==='sheet')await sheet(a[0],a[1]||'low',a[2],a[3]||undefined,a[4]);
  else if(cmd==='vine')bad=await vine(a[0]||5,a[1]);
  else if(cmd==='edraw')await edraw(a[0],a[1],+a[2]||2000);
  else if(cmd==='eface')bad=await eface(a[0]);
  else if(cmd==='vshift')await vshift(a[0]||50,a[1]||'vshift',a[2]||undefined,a[3]);
  else{console.log(require('fs').readFileSync(__filename,'utf8').split('\n').slice(0,10).join('\n'));}
  process.exit(bad?1:0);})();
