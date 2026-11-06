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
//   node tools/harness.js espr [檔案]  每大關 1~4 小關跑 900 幀、魔王關 3600 幀(含召喚),統計畫面上找不到精靈的敵人(v0.16.1 移除方塊備援後,缺精靈會不畫)
//   node tools/harness.js boss [檔案]  魔王共用工具(v0.17):登場鎖主角與血條填充、判定框不變、閃白與燒紅邊、核心狀態、死亡演出到傳送門、重挑縮短、預警四樣式、RotSprite
//   node tools/harness.js bshot <輸出.png> <情境 warn/burn/hit/die/intro> [大關] [幀數] [檔案]  魔王共用工具截圖(v0.17)
//   node tools/harness.js strand <舊檔> <新檔> [輸出前綴]  藤蔓觸手與倒影(v0.18):舊新版邏輯狀態比對、觸手外觀與判定同步、倒影時機、耗時、截圖
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
  await pg.waitForTimeout(300);await pg.evaluate(()=>render());   // v0.20:魔王專屬場景的內嵌圖是非同步載入,等載入後再畫一次
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

// v0.16.1:移除 eRects 後,缺精靈的敵人不會畫出來;逐關逐小關確認每隻出現過的敵人都有精靈
async function espr(f){const {br,pg,errs}=await open(f);
  const r=await pg.evaluate(()=>{const miss={},seen={};
    for(let w=1;w<=10;w++)for(let s=1;s<=5;s++){HX.go(w,s);
      for(let i=0;i<(s===5?3600:900);i++){K.r=i%60<40?1:0;HX.run(1);for(const e of ens){const k=w+' '+e.type;seen[k]=1;if(s===5)seen['王'+k]=1;if(!eSpr(e))miss[k]=(miss[k]||0)+1;}}K.r=0;}
    return {seen:Object.keys(seen).filter(k=>k[0]!=='王').length,boss:Object.keys(seen).filter(k=>k[0]==='王').map(k=>k.slice(1)).join('、'),miss};});
  console.log('出現過的大關×兵種',r.seen,'組;魔王關召喚',r.boss||'無','缺精靈',Object.keys(r.miss).length?JSON.stringify(r.miss):'無');
  console.log('錯誤',errs.length?errs.slice(0,3):'無');await br.close();return errs.length+Object.keys(r.miss).length;}

// v0.17:魔王共用工具。每隻魔王:登場鎖主角與血條填充、判定框在繪製前後不變、閃白/燒紅邊計時、核心狀態、死亡演出到傳送門、重挑縮短;
// 另測四種預警樣式可繪製、RotSprite 烘焙(各角度像素數應接近原圖)、bossRender 每次耗時(沙盒相對值)
async function bosst(f){const {br,pg,errs}=await open(f);
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const J=a=>JSON.stringify(a.map(p=>[p.key,p.x,p.y,p.w,p.h]));
    for(let w=1;w<=10;w++){HX.go(w,5);const x0=P.x;K.r=1;K.j=1;K.f=1;let shots=0,fillMid=-1;
      for(let i=0;i<299;i++){P.inv=999;update();render();shots+=bul.length;if(300-boss.introT===260)fillMid=bossFill();}
      const lockOK=Math.abs(P.x-x0)<0.01&&shots===0;
      HX.run(30);K.j=0;K.f=0;const moved=Math.abs(P.x-x0)>1;K.r=0;
      const ps=bossParts(),j0=J(ps);let hf='-',hb='-';
      if(ps.length){bossHit({x:ps[0].x+ps[0].w/2,y:ps[0].y+ps[0].h/2,r:3,dmg:1});hf=boss.hf&&boss.hf[ps[0].key];
        bossDamage(ps[0],1,1);hb=boss.hb&&boss.hb[ps[0].key];}
      render();const same=J(bossParts())===j0;const ci=bCoreInfo(boss);
      const t0=performance.now();for(let i=0;i<200;i++)bossRender();const ms=(performance.now()-t0)/200;
      boss.hp=1;boss.invin=false;const pp=bossParts();for(const p of pp)if(boss.alive)bossDamage(p,99999);if(boss.alive)bossDie(); // 6 王兩隻都要打倒
      let pk=0;for(let i=0;i<205&&G.state==='win';i++){update();render();pk=Math.max(pk,BT.booms.length);}
      const portalOK=G.state==='play'&&!!portal;
      HX.go(w,5);startBoss(1);const rt=boss.introT;
      const ok=lockOK&&moved&&fillMid>0&&fillMid<1&&same&&portalOK&&rt===120;if(!ok)bad++;
      o.push(`王${w} 鎖定${lockOK?'OK':'NG'} 解鎖${moved?'OK':'NG'} 血條中段${fillMid.toFixed(2)} 判定框不變${same?'OK':'NG'} 閃白${hf} 燒邊${hb} 核心${ci?['全亮','半亮','暗灰'][ci.st]:'不畫'} 繪製${ms.toFixed(3)}ms 爆炸峰值${pk} 傳送門${portalOK?'OK':'NG'} 重挑${rt}`);}
    HX.go(3,5);HX.run(320);hazs.length=0;
    for(const k of ['beam','ground','drop','area']){haz(40,40,200,12,30,20,'#ff4a6a',k);haz(300,0,20,200,30,20,'#4a6aff',k);}
    for(let i=0;i<80;i++){HX.run(1);render();}o.push('預警四樣式繪製 OK');
    const m=bMat(['..OOOO......','.OLLLLO.....','OLLDDLLOOOOO','.OLLLLO.....','..OOOO......'],{O:'#101018',L:'#c8d0dc',D:'#5a6478'});
    const rr=bRot(m.n,32,2,2),cx=rr.cv.getContext('2d'),cnt=k=>{const d=cx.getImageData(k*rr.S,0,rr.S,rr.S).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n;};
    const c0=cnt(0),cs=[0,4,8,12,16,20,24,28].map(cnt),dev=Math.max(...cs.map(c=>Math.abs(c-c0)/c0));
    if(dev>0.35)bad++;o.push(`RotSprite 32 角度:原圖像素 ${c0},各角度 ${cs.join('/')},最大偏差 ${(dev*100).toFixed(0)}%`);
    return {o,bad};});
  console.log(r.o.join('\n'));console.log('錯誤',errs.length?errs.slice(0,3):'無');await br.close();return errs.length+r.bad;}

// v0.17:魔王共用工具截圖。情境 warn 四種預警各兩個進度(上排 30%、下排 75%);burn 火焰燒紅邊;hit 子彈閃白;die 死亡第 n 幀;intro 登場第 n 幀
async function bshot(outp,sc,w,n,file){
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  await pg.evaluate(([sc,w,n])=>{HX.go(w,5);
    if(sc==='intro'){for(let i=0;i<n;i++){update();}render();return;}
    HX.run(320);ebul.length=0;hazs.length=0;ens.length=0;
    if(sc==='warn'){const K_=['beam','ground','drop','area'];
      K_.forEach((k,i)=>{for(const [r,p] of [[0,.3],[1,.75]]){const z=haz(20+i*120,30+r*110,96,r?60:14,20,60,['#ff4a6a','#ffb03c','#8a3aa0','#dfe6ff'][i],k);z.t=Math.round(z.warn*p);}});
      const z=haz(470,0,20,14*16,20,60,'#ffbe3c','drop');z.t=Math.round(z.warn*.6);render();return;}
    const p=bossParts()[0];
    if(sc==='burn'){for(let i=0;i<3;i++){bossDamage(p,1,1);render();}return;}
    if(sc==='hit'){bossDamage(p,1);render();return;}
    if(sc==='die'){for(const q of bossParts())if(boss.alive)bossDamage(q,1e6);for(let i=0;i<n;i++)update();render();return;}
  },[sc,+w||3,+n||0]);
  await pg.evaluate(()=>HX.warm());               // 地面快取只在 render 時烘焙
  await pg.screenshot({path:outp});console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();}

// v0.18:藤蔓觸手與倒影。① 舊版與新版同種子、同按鍵跑 3 王、10 王第 1~3 型態,每 30 幀比對邏輯狀態(行為不變)
// ② 3 王觸手外觀與判定同步(有可攀格時必定長滿) ③ 3 王倒影常駐、10 王第三型態倒影關閉 ④ stTiles、bRefl 每次耗時(沙盒相對值)
async function strandRun(file){const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{
    const seed=k=>{let a=k*2654435761>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
    const st=()=>{let m=0;for(let i=0;i<map.d.length;i++)m=(m*31+map.d[i])|0;
      return [P.x,P.y,P.vy,P.climb?1:0,boss?boss.hp:0,boss?boss.x:0,boss?boss.y:0,boss?boss.retract:0,boss?boss.ph:0,ebul.length,hazs.length,ens.length,m].map(v=>+(+v).toFixed(3)).join(',');};
    const o={log:[],ns:{},sync:'-',rf:'-',ms:{}};
    const keys=i=>{K.r=i%240<120?1:0;K.l=i%240>=150&&i%240<200?1:0;K.u=i%90<40?1:0;K.j=i%70<6?1:0;K.f=i%50<30?1:0;};
    for(const [nm,w,ph] of [['3王',3,0],['10王',10,0],['10王第三型態',10,3]]){seed(7+w+ph);HX.go(w,5);
      if(ph===3){HX.run(320);boss.ph=2;boss.hp=boss.max*0.3;}
      const L=[];let bad=0,tot=0,onF=0,offOK=1;
      for(let i=0;i<1800;i++){keys(i);P.inv=999;P.lives=5;update();render();if(i%30===0)L.push(st());
        if(w===3&&boss&&boss.def.strands&&typeof stTiles==='function'){const S=boss.def.strands(boss);
          for(const q of S){const tx=q.x/16;let has=false;for(let y=5;y<=12;y++)if(T(tx,y)===2)has=true;tot++;if(has&&q.k!==1)bad++;}
          if(boss.rfa>0)onF++;}if(i>30&&w===10&&boss&&boss.ph===3&&boss.rfa>0)offOK=0;}
      for(const k of ['r','l','u','j','f'])K[k]=0;
      o.log.push(nm+':'+L.join('|'));
      if(w===3)o.sync=`觸手可攀時外觀長滿 ${tot-bad}/${tot},倒影常駐 ${onF}/1800 幀 ${onF>=1750?'OK':'NG'}`;
      if(ph===3)o.sync+=`,10 王第三型態倒影已關 ${offOK?'OK':'NG'}`;
      if(typeof stTiles==='function'){let t0=performance.now();for(let i=0;i<300;i++)stTiles();const a=(performance.now()-t0)/300;
        boss.rfa=1;const sv=boss.def.refl&&boss.def.refl.on;if(boss.def.refl)boss.def.refl.on=()=>true;
        t0=performance.now();for(let i=0;i<300;i++)bRefl();const b=(performance.now()-t0)/300;if(sv)boss.def.refl.on=sv;
        o.ms[nm]=`stTiles ${a.toFixed(3)}ms、bRefl ${boss.def.refl?b.toFixed(3)+'ms':'不適用'}`;}}
    return o;});
  await br.close();return {r,errs};}
async function strand(fa,fb,outp){
  const A=await strandRun(fa),B=await strandRun(fb);let bad=A.errs.length+B.errs.length;
  for(let i=0;i<A.r.log.length;i++){const [n,a]=A.r.log[i].split(':'),b=B.r.log[i].split(':')[1];const same=a===b;if(!same)bad++;
    let d=-1;if(!same){const x=a.split('|'),y=b.split('|');d=x.findIndex((v,j)=>v!==y[j])*30;}
    console.log(`${n} 舊新版邏輯狀態(每 30 幀,共 1800 幀)${same?'完全相同':'不同,第 '+d+' 幀起'}`);}
  console.log(B.r.sync);for(const k in B.r.ms)console.log(k,B.r.ms[k]);if(B.r.sync.includes('NG'))bad++;
  const m=/(\d+)\/(\d+)/.exec(B.r.sync);if(m&&m[1]!==m[2])bad++;
  console.log('錯誤',[...A.errs,...B.errs].slice(0,3).join(' / ')||'無');
  if(outp){const {br,pg}=await open(fb,{width:1024,height:576});let i=0;
    for(const sc of ['slam','retract','b10','b10p3']){await pg.evaluate(sc=>{HX.go(sc==='slam'||sc==='retract'?3:10,5);HX.run(320);ebul.length=0;hazs.length=0;
      if(sc==='slam'){boss.slamPhase='center';boss.slamT=180;boss.slamTx=15*16;boss.eyeY=13*16-44;P.x=60;P.y=13*16-14;for(let i=0;i<20;i++)render();}
      if(sc==='retract'){boss.retract=-299;boss.eye=0;for(let i=0;i<6;i++)update();} // 判定消失後第 6 幀(抽回動畫進行到一半)
      if(sc==='b10p3'){boss.ph=2;boss.hp=boss.max*0.3;HX.run(2);HX.run(60);}
      if(sc!=='slam')for(let i=0;i<20;i++)render();},sc);
      await pg.evaluate(()=>HX.warm());const f=outp.replace(/\.png$/,'')+'-'+sc+'.png';await pg.screenshot({path:f});console.log('已存',f);}
    await br.close();}
  return bad;}

// v0.20:魔王姿勢截圖。各王列出幾個情境(姿勢、朝向、核心狀態),每個情境 render 後裁出魔王周圍放大拼成一張
const BPOSE={8:[
  ['待機朝左',b=>{P.x=b.x-120;b.v8=null;b.rayCd=200;}],['待機朝右',b=>{P.x=b.x+140;b.v8=null;b.rayCd=200;}],
  ['召喚',b=>{P.x=b.x-120;b.v8={k:'summon',t:G.t};}],['前指',b=>{P.x=b.x-120;b.v8={k:'point',t:G.t};}],
  ['前指朝右',b=>{P.x=b.x+140;b.v8={k:'point',t:G.t};}],['命匣全毀 核心全亮',b=>{P.x=b.x-120;b.v8=null;b.rayCd=200;for(const p of b.ph)p.alive=false;}],
  ['本體受擊閃白',b=>{P.x=b.x-120;b.v8=null;b.rayCd=200;for(const p of b.ph)p.alive=false;b.hf={core:4};}],
  ['前指受擊閃白',b=>{P.x=b.x-120;b.v8={k:'point',t:G.t};for(const p of b.ph)p.alive=false;b.hf={core:4};}],
  ['命匣受擊(提燈移到旁邊)',b=>{P.x=b.x-120;b.v8=null;b.rayCd=200;b.ph[0].alive=true;b.ph[0].x=b.x-44;b.ph[0].y=b.y+10;b.hf={ph0:4};}]]};
async function bpose(outp,w,file){
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const d=await pg.evaluate(async([w,L])=>{HX.go(w,5);HX.run(320);
    const cv=document.querySelector('canvas'),sc=cv.width/512,cw=150,ch=110,o=document.createElement('canvas');
    o.width=cw*2*3;o.height=(ch*2+24)*Math.ceil(L.length/3);const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);
    for(let i=0;i<L.length;i++){ebul.length=0;hazs.length=0;ens.length=0;const b=boss;b.x=232;eval('('+L[i][1]+')')(b);
      for(const q of[bul])q.length=0;b.vf=undefined;bossFxTick();render();
      const X=(b.x+13-cw/2),Y=(b.y+17-ch/2-6),c=i%3,r=Math.floor(i/3);
      x.drawImage(cv,X*sc,Y*sc,cw*sc,ch*sc,c*cw*2,r*(ch*2+24)+24,cw*2,ch*2);
      x.fillStyle='#fff';x.font='16px sans-serif';x.fillText(L[i][0],c*cw*2+6,r*(ch*2+24)+18);}
    return o.toDataURL().split(',')[1];},[+w,BPOSE[+w].map(([n,f])=>[n,f.toString()])]);
  fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();}

// v0.20:王關爬繩梯到頂再往旁邊走,回報落腳處;8 王另測站在新平台往上射能打到右上命匣
async function bclimb(w,col,dir,file){const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(([w,col,dir])=>{HX.go(w,5);HX.run(320);ebul.length=0;hazs.length=0;ens.length=0;
    const z=()=>{ebul.length=0;hazs.length=0;ens.length=0;if(boss){boss.cd=999;boss.rayCd=999;}};
    let bot=0;for(let y=0;y<GH;y++)if(T(col,y)===2)bot=y;
    P.x=col*16+3;P.y=bot*16-14+16;P.vx=0;P.vy=0;K.u=1;for(let i=0;i<400;i++){z();HX.run(1);}
    const top={y:P.y,climb:P.climb};K.u=0;K[dir]=1;K.j=1;for(let i=0;i<40;i++){if(i===6)K.j=0;z();HX.run(1);}K[dir]=0;for(let i=0;i<40;i++){z();HX.run(1);}
    const o={top,end:{x:Math.round(P.x),y:Math.round(P.y),row:Math.round((P.y+14)/16),col:Math.floor((P.x+5)/16),climb:P.climb}};
    if(w===8){const ph=boss.ph[5];P.x=ph.x+2;P.y=3*16-14;P.vy=0;const h0=ph.hp;K.u=1;K.f=1;for(let i=0;i<60;i++){z();HX.run(1);}K.u=0;K.f=0;
      o.shootUp={dmg:+(h0-ph.hp).toFixed(1),alive:ph.alive,py:Math.round(P.y)};}
    return o;},[+w,+col,dir]);
  console.log(JSON.stringify(r),'錯誤',errs.length?errs:'無');await br.close();return errs.length;}

// v0.20:8 王死亡射線各階段截圖(預兆 90 幀內、預警、竄出前中後),裁下畫面下半部(y 150~250)上下拼接;同時檢查判定範圍不變
async function b8ray(outp,file){const {br,pg,errs}=await open(file,{width:1024,height:576});
  const r=await pg.evaluate(()=>{HX.go(8,5);HX.run(320);const b=boss;P.x=60;b.x=300;
    const cv=document.querySelector('canvas'),sc=cv.width/512,o=document.createElement('canvas');const st=[];
    const z0=()=>{ebul.length=0;ens.length=0;b.cd=999;};
    b.rayCd=95;const shots=[60,10,1];let row=0,log=[];
    o.width=1024;o.height=200*7;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    const grab=(lab)=>{HX.warm();render();x.drawImage(cv,0,150*sc,512*sc,100*sc,0,row*200,1024,200);x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(lab,8,row*200+20);row++;};
    while(b.rayCd>1){P.inv=999;z0();update();if(shots.includes(b.rayCd))grab('預兆 rayCd='+b.rayCd);}
    let z=null;for(let i=0;i<80;i++){P.inv=999;z0();P.x=60;update();z=z||hazs.find(h=>h.fx==='b8ray');if(!z)continue;
      if(z.t===8)grab('預警第 8 幀');if([z.warn+5,z.warn+25,z.warn+45].includes(z.t)){grab('竄出第 '+(z.t-z.warn)+' 幀');log.push([z.x,z.y,z.w,z.h].map(Math.round).join(','));}}
    return {d:o.toDataURL().split(',')[1],log,warn:z&&z.warn};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,'預警幀數',r.warn,'判定框',r.log.join(' / '),'錯誤',errs.length?errs:'無');await br.close();}

// v0.20:王關站在地面某欄、跳起並按住上,回報跳躍最高點與能否抓住繩梯(每欄重開一次關卡)
async function bjump(w,cols,file){const {br,pg,errs}=await open(file);let bad=0;
  for(const col of cols){const r=await pg.evaluate(([w,col])=>{HX.go(w,5);HX.run(320);
    const z=()=>{ebul.length=0;hazs.length=0;ens.length=0;if(boss){boss.cd=999;boss.rayCd=999;}P.inv=999;};
    P.x=col*16+3;for(let i=0;i<30;i++){z();update();}let minY=999,g=-1;
    for(let i=0;i<60;i++){z();K.j=i<14?1:0;K.u=i>3?1:0;update();minY=Math.min(minY,P.y);if(P.climb&&g<0)g=Math.round(P.y);}
    K.u=0;K.j=0;return {col,top:Math.round(minY),grab:g};},[+w,+col]);
    console.log('欄',r.col,'跳躍最高 y',r.top,r.grab>=0?'抓住繩梯 y='+r.grab:'沒抓到');}
  console.log('錯誤',errs.length?errs:'無');await br.close();return errs.length;}

// v0.20:8 王召喚、時間停滯、扇形彈特效截圖(各階段裁 256x144 遊戲像素、放大 2 倍拼成 2 欄);同時回報招式結果與舊版一致的數字
async function b8fx(outp,file){const {br,pg,errs}=await open(file,{width:1024,height:576});
  const r=await pg.evaluate(()=>{HX.go(8,5);HX.run(320);const b=boss;P.x=60;
    const cv=document.querySelector('canvas'),sc=cv.width/512,o=document.createElement('canvas');o.width=1024;o.height=288*4;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,cx,cy)=>{HX.warm();render();const X=Math.max(0,Math.min(256,cx-128)),Y=Math.max(0,Math.min(144,cy-72));
      x.drawImage(cv,X*sc,Y*sc,256*sc,144*sc,(n%2)*512,Math.floor(n/2)*288,512,288);x.fillStyle='#fff';x.font='16px sans-serif';x.fillText(lab,(n%2)*512+6,Math.floor(n/2)*288+18);n++;};
    const z0=()=>{P.inv=999;b.rayCd=999;hazs.length=0;};const log={};
    // 召喚
    ens.length=0;ebul.length=0;b.cd=0;b.ai=0;z0();update();log.skel=ens.length;const s0=b.vsum[0];
    for(let i=1;i<=10;i++){z0();update();if(i===3)grab('召喚 第 3 幀',s0.x,200);if(i===10)grab('召喚 第 10 幀',s0.x,200);}
    // 時間停滯
    ens.length=0;ebul.length=0;b.cd=0;b.ai=1;z0();update();log.ring=ebul.length;const bx=b.x+13,by=b.y+17;
    for(let i=1;i<=75;i++){z0();update();if(i===20)grab('停滯 第 20 幀',bx,by);if(i===60)grab('停滯 第 60 幀',bx,by);if(i===72){grab('停滯結束後 3 幀',bx,by);log.spd=+Math.hypot(ebul[0].vx,ebul[0].vy).toFixed(3);}}
    // 扇形彈
    ens.length=0;ebul.length=0;P.x=b.x-120;b.cd=0;b.ai=2;z0();update();log.fan=ebul.length;log.fanSpd=+Math.hypot(ebul[0].vx,ebul[0].vy).toFixed(3);
    for(let i=1;i<=14;i++){z0();update();if(i===2)grab('扇形彈 第 2 幀',b.x,b.y+20);if(i===6)grab('扇形彈 第 6 幀',b.x+13,b.y+17);if(i===14)grab('扇形彈 第 14 幀(以子彈為中心)',ebul[2].x,ebul[2].y);}
    return {d:o.toDataURL().split(',')[1],log};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}

// v0.20:魔王登場與死亡逐幀截圖。intro 幀號為登場時間軸 t(0~299),die 幀號為死亡後第 n 幀;裁 [x,y,w,h] 區域放大 3 倍拼成 4 欄
async function bseq(outp,w,ins,dies,reg,file){const {br,pg,errs}=await open(file,{width:1024,height:576});
  await pg.evaluate((w)=>{HX.go(w,5);render();},+w);await pg.waitForTimeout(300);     // 先畫一幀觸發內嵌圖載入,再等載入
  const d=await pg.evaluate(([w,ins,dies,reg])=>{const [rx,ry,rw,rh]=reg,cv=document.querySelector('canvas'),sc=cv.width/512,Z=3,C=4,L=ins.length+dies.length;
    const o=document.createElement('canvas');o.width=rw*Z*C;o.height=(rh*Z+20)*Math.ceil(L/C);const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);
    let n=0;const grab=lab=>{HX.warm();render();const c=n%C,r=Math.floor(n/C);x.drawImage(cv,rx*sc,ry*sc,rw*sc,rh*sc,c*rw*Z,r*(rh*Z+20)+20,rw*Z,rh*Z);x.fillStyle='#fff';x.font='14px sans-serif';x.fillText(lab,c*rw*Z+4,r*(rh*Z+20)+15);n++;};
    for(const t of ins){HX.go(w,5);for(let i=0;i<t;i++)update();grab('登場 t='+t);}
    if(dies.length){HX.go(w,5);for(let i=0;i<300;i++)update();HX.run(30);ebul.length=0;hazs.length=0;ens.length=0;
      for(const q of bossParts())if(boss.alive)bossDamage(q,1e7);if(boss.ph)for(const p of boss.ph)p.alive=false;for(const q of bossParts())if(boss.alive)bossDamage(q,1e7);
      let k=0;for(const t of dies){while(k<t){update();k++;}grab('死亡 第 '+t+' 幀');}}
    return o.toDataURL().split(',')[1];},[+w,ins,dies,reg]);
  fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();}

(async()=>{const [cmd,...a]=process.argv.slice(2);let bad=0;
  if(cmd==='smoke')bad=await smoke(a[0]);
  else if(cmd==='special')bad=await special(a[0]);
  else if(cmd==='bench')await bench(a[0],a[1],+a[2]||1);
  else if(cmd==='shot')await shot(a[0],a[1],a[2],a[3],a[4]||0,a[5]);
  else if(cmd==='sheet')await sheet(a[0],a[1]||'low',a[2],a[3]||undefined,a[4]);
  else if(cmd==='vine')bad=await vine(a[0]||5,a[1]);
  else if(cmd==='edraw')await edraw(a[0],a[1],+a[2]||2000);
  else if(cmd==='eface')bad=await eface(a[0]);
  else if(cmd==='espr')bad=await espr(a[0]);
  else if(cmd==='boss')bad=await bosst(a[0]);
  else if(cmd==='bshot')await bshot(a[0],a[1],a[2],a[3],a[4]);
  else if(cmd==='bpose')await bpose(a[0],a[1]||8,a[2]);
  else if(cmd==='bclimb')bad=await bclimb(a[0]||8,a[1]||27,a[2]||'r',a[3]);
  else if(cmd==='b8ray')await b8ray(a[0],a[1]);
  else if(cmd==='bjump')bad=await bjump(a[0]||8,(a[1]||'9,18,27').split(','),a[2]);
  else if(cmd==='b8fx')await b8fx(a[0],a[1]);
  else if(cmd==='bseq')await bseq(a[0],a[1]||8,(a[2]||'').split(',').filter(v=>v).map(Number),(a[3]||'').split(',').filter(v=>v).map(Number),(a[4]||'0,0,512,288').split(',').map(Number),a[5]);
  else if(cmd==='strand')bad=await strand(a[0],a[1],a[2]);
  else if(cmd==='vshift')await vshift(a[0]||50,a[1]||'vshift',a[2]||undefined,a[3]);
  else{console.log(require('fs').readFileSync(__filename,'utf8').split('\n').slice(0,10).join('\n'));}
  process.exit(bad?1:0);})();
