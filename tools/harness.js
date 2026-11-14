// PIXEL STRIKE FORCE 無頭瀏覽器測試工具(v0.6 起;只供開發用,遊戲執行時不會載入)
// 需要:Node 18+、playwright 套件、Chrome。在 repo 根目錄執行:
//   node tools/harness.js smoke [檔案]              50 小關 × 三種武器各跑一段,檢查執行錯誤
//   node tools/harness.js special [檔案]            特攻功能檢查:一般關清空與回充、各魔王扣血、6 王選單、7 王、4 王隱身、登場禁用
//   node tools/harness.js wkeep [檔案]              撿武器箱選「不替換」留在原地、王關 X-5 大字與 WARNING 錯開(v0.38.1)
//   node tools/harness.js tshot [前綴] [檔案]        標題頁截圖(v0.39):主畫面、標誌光澤、按 Z 閃白
//   node tools/harness.js wvis [檔案]               己方子彈與槍口火光可見性(v0.28.1):每大關衝鋒槍、散彈 1~4 階,比對有無子彈的畫面像素差
//   node tools/harness.js vis [輸出.png] [檔案]      主角、敵彈、傳送門可見性(11/13):有/無該物件兩次繪製的像素差,存最差 24 格拼圖
//   node tools/harness.js fsil <輸出.png> [檔案...]   火焰剪影沿射程對照(v0.36):敵人在射程 35%/60%/85%,每幀都畫,多檔並排
//   node tools/harness.js perfpage [檔案]            產生桌機實測頁 preview/perf-test.html(控制列跳關、無限命、魔王剩 5%、特攻充滿)
//   node tools/harness.js bench <舊檔> <新檔> [輪數] 繪圖時間相對比較(沙盒數字,非測試機)
//   node tools/harness.js shot <大關> <小關> <幀數> <輸出.png> [特攻=0/1] [檔案]   截一張遊戲畫面
//   node tools/harness.js sheet <小關> <畫質 low/high> <輸出.png> [檔案] [FX設定,如 q=high,seed=3]  seed=N 固定亂數(同一批地圖)  only=N 只截第 N 大關(2 倍)  10 大關同一小關拼成 5×2 對照圖(每格 512×288)
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
      // v0.22:10 王第 n 段(新版三段分開打用 startBoss(0,n);v0.21 以前用血量觸發型態切換)。回傳時登場已結束
      p3(){if(BOSSES[9].segs){HX.go(10,5);startBoss(0,3);G.state='play';HX.run(185);}else{HX.go(10,5);HX.run(320);boss.ph=2;boss.hp=boss.max*0.3;HX.run(2);}},
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
      const ok=!G.noSpecial;HX.run(400);o.push(`王${w} 扣${HX.pct(h,boss.hp,boss.max0||boss.max)}(應為 8.00%${boss.max0?",以原總血量計,v0.22 起 10 王分三條血條":""})${ok?'':' noSpecial'}`);}
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

// v0.38.1 撿武器箱選「不替換」留在原地、王關進關 X-5 大字與 WARNING 錯開
async function wkeep(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(ok,s)=>{o.push((ok?'OK  ':'錯誤 ')+s);if(!ok)bad++;};
    HX.go(1,1);HX.run(20);ens.length=0;items.length=0;wep='smg';wlvl=3;const px0=P.x;
    items.push({kind:'wep',wt:'shot',x:P.x,y:P.y,vy:0,t:0});HX.run(1);
    ck(G.modal&&G.modal.wt==='shot'&&items.length===1,'碰到不同武器箱跳出詢問,武器箱仍在場上('+items.length+')');
    wtNo();const it=items[0];ck(!G.modal&&items.length===1&&wep==='smg'&&wlvl===3,'不替換:武器箱留著,武器維持 '+wep+' Lv'+wlvl);
    let top=1e9,again=0;const y0=it.y;for(let i=0;i<90;i++){HX.run(1);top=Math.min(top,it.y);if(G.modal)again++;}
    ck(again===0,'主角站在原地 90 幀不再跳出詢問');ck(y0-top>8&&y0-top<24,'小跳高度 '+(y0-top).toFixed(1)+' 像素');
    ck(Math.abs(it.y-y0)<3,'落回原處(高度差 '+(it.y-y0).toFixed(1)+')');
    P.x=px0+40;HX.run(3);ck(!G.modal&&it.no===0,'主角離開後恢復可撿');
    P.x=px0;HX.run(2);ck(G.modal&&G.modal.it===it,'走回來再碰,再次詢問');
    wtYes();ck(items.length===0&&wep==='shot'&&wlvl===1,'替換:武器箱消失,武器 '+wep+' Lv'+wlvl);
    items.push({kind:'wep',wt:'flame',x:P.x,y:P.y,vy:0,t:0});HX.run(1);menuKey('Escape',false);
    ck(!G.modal&&items.length===1&&items[0].no>0,'Esc 取消同樣留在原地');
    items.length=0;items.push({kind:'wep',wt:'shot',x:P.x,y:P.y,vy:0,t:0});HX.run(1);ck(!G.modal&&items.length===0&&wlvl===2,'同種武器箱照常升級 Lv'+wlvl);
    // WARNING:暗幕期間不畫,進入遊玩後畫滿 120 幀
    const f=txt;let nw=0;window.txt=function(a){if(a==='WARNING')nw++;return f.apply(this,arguments);};
    for(const w of[1,5,9]){resetRun();G.world=w;G.sub=5;startLevel();G.modal=null;let a=0,b=0,n=0;
      for(let i=0;i<700;i++){P.inv=999;update();if(G.state!=='intro'&&!(boss.introT>0))break;nw=0;render();if(G.state==='intro'){a+=nw;n++;}else b+=nw;}   // 照實際順序:先 update 再 render
      ck(a===0&&b===120,w+'-5 暗幕 '+n+' 幀內 WARNING 畫 '+a+' 次(應 0),暗幕後畫 '+b+' 幀(應 120)');}
    window.txt=f;return {o,bad};});
  console.log(r.o.join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return r.bad+errs.length;
}

// v0.39 標題頁截圖:<前綴>-main.png(轟炸機經過月面)、-shine.png(光澤掃到字面)、-ls.png(按 Z 後第 4 幀的閃白)
async function tshot(pre,file){
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const one=async(n,fn)=>{await pg.evaluate(fn);await pg.waitForTimeout(300);await pg.evaluate(()=>render());await pg.screenshot({path:pre+'-'+n+'.png'});};
  await one('main',()=>{toTitle();G.t=1100+275;render();});
  await one('shine',()=>{toTitle();G.t=260*5+12;render();});
  await one('ls',()=>{toTitle();anyTap=true;for(let i=0;i<4;i++)update();render();});
  const ok=await pg.evaluate(()=>{toTitle();render();anyTap=true;update();return G.state==='levelselect'&&!!TTL&&TTL.lw>300;});
  console.log(ok?'OK  標誌已烘焙,按 Z 當幀進選關':'錯誤 標題頁狀態不對');
  console.log('已存',pre+'-main/shine/ls.png','錯誤',errs.length?errs:'無');await br.close();return errs.length+(ok?0:1);
}

// v0.28.1 己方子彈與槍口火光可見性:v0.18~v0.28 這兩個繪製呼叫被誤併入註解,10 版測試都沒抓到。
// 每大關、衝鋒槍與散彈各 1~4 階,開槍後同一幀畫兩次(有子彈/暫時清空子彈),比對遊戲畫面像素差;另計 drawBulletV、drawMuzzle 呼叫次數
async function wvis(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[];let bad=0,nb=0,nm=0;
    const fb=drawBulletV,fm=drawMuzzle;window.drawBulletV=b=>{nb++;fb(b);};window.drawMuzzle=()=>{nm++;fm();};
    const snap=()=>octx.getImageData(0,0,cv.width,cv.height).data;   // 讀輸出畫布(render 末端會清空工作畫布 ctx)
    for(let w=1;w<=10;w++)for(const wp of['smg','shot'])for(let lv=1;lv<=4;lv++){
      HX.go(w,1);HX.run(20);wep=wp;wlvl=lv;K.f=1;HX.run(4);K.f=0;HX.warm();
      nb=nm=0;render();const a=snap(),n=bul.length,c=nb,m=nm,keep=bul;bul=[];render();const b=snap();bul=keep;
      let d=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])d++;
      const ok=n>0&&c===n&&m>0&&d>=n*4;if(!ok)bad++;
      if(!ok||lv===1)o.push(`${w}-1 ${wp} Lv${lv} 子彈${n} 畫${c} 槍口${m} 像素差${d}${ok?'':' ← 未畫出'}`);}
    o.push(`未通過 ${bad} 組(共 80 組)`);return [o,bad];});
  console.log(r[0].join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return r[1]+errs.length;
}

// v0.31 畫面可見性:主角、敵彈、傳送門。同一幀畫兩次(有該物件/暫時拿掉),比對輸出畫面(含泛光、霧、HUD)該物件範圍內的像素差。
// 像素差用 RGB 距離:>12 算「有畫到」,>=64 算「清楚」。被蓋住 → 有畫到的很少;與背景混色 → 有畫到但清楚的很少。
// 視窗 512×288,輸出畫布與邏輯座標 1:1。畫兩次前暫停震動、主角無敵閃爍(只影響這兩次繪製,之後還原)。
// 一般小關:主角往右走(定時跳,卡住 300 幀就往前移 160 像素)、不開槍,每 40 幀取樣;王關:登場後主角左右走動、不開槍 2400 幀,每 30 幀取樣;10 王三段分開測。
// 傳送門:一般小關清掉敵人等傳送門出現,王關擊倒後跑到傳送門出現;主角站在門左 60 像素,取門出現後第 60、100、150 幀(先讓鏡頭跟上)。
// 給輸出檔名時另存最差 24 格的放大拼圖(每格 64×64 放大 3 倍,左上數字為清楚比例)
async function vis(outp,file){
  const {br,pg,errs}=await open(file,{width:512,height:288});
  const r=await pg.evaluate(()=>{
    const o=[],worst=[],D2=12*12,C2=64*64,M=4;let nP=0,nB=0,nG=0,badP=0,badB=0,badG=0,nPH=0;
    const fp=drawPlayer;let hideP=0;window.drawPlayer=()=>{if(!hideP)fp();};
    const snap=()=>octx.getImageData(0,0,W,H).data;
    function pair(hide,show){   // 回傳 [有物件, 沒物件] 兩張畫面;畫面不受震動與無敵閃爍影響
      const st=G.shakeT,iv=P.inv;G.shakeT=0;P.inv=0;
      show();render();const a=snap();hide();render();const b=snap();show();
      G.shakeT=st;P.inv=iv;return [a,b];}
    function diff(a,b,x0,y0,x1,y1){x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(W,Math.ceil(x1));y1=Math.min(H,Math.ceil(y1));
      let n0=0,n1=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*W+x)*4,dr=a[i]-b[i],dg=a[i+1]-b[i+1],db=a[i+2]-b[i+2],d=dr*dr+dg*dg+db*db;
        if(d>D2)n0++;if(d>=C2)n1++;}return [n0,n1];}
    function keep(sc,kind,where,a,cx,cy){   // 留最差的 24 格截圖
      if(worst.length>=24&&sc>=worst[worst.length-1].sc)return;
      const im=new ImageData(64,64),x0=Math.round(cx)-32,y0=Math.round(cy)-32;
      for(let y=0;y<64;y++)for(let x=0;x<64;x++){const X=x0+x,Y=y0+y,j=(y*64+x)*4;if(X<0||Y<0||X>=W||Y>=H){im.data[j+3]=255;continue;}const i=(Y*W+X)*4;
        im.data[j]=a[i];im.data[j+1]=a[i+1];im.data[j+2]=a[i+2];im.data[j+3]=255;}
      worst.push({sc,kind,where,im});worst.sort((p,q)=>p.sc-q.sc);if(worst.length>24)worst.pop();}
    const S={};const rec=(where,k,v)=>{const s=S[where]||(S[where]={p:[],b:[],g:[]});s[k].push(v);};
    function sample(where){
      const sx=P.x-1-cam.x,sy=P.y-4-cam.y;
      if(sx>=2&&sx<=W-14&&sy>=8&&sy<=H-20&&G.state==='play'){   // 整個精靈在畫面內才取樣(掉坑出畫面不算)
        const [a,b]=pair(()=>{hideP=1;},()=>{hideP=0;});
        const [n0,n1]=diff(a,b,sx-M-2,sy-M-8,sx+12+M+2,sy+18+M),sc=n0?n1/n0:0;nP++;
        const hz=hazs.some(h=>h.x<P.x+P.w&&h.x+h.w>P.x&&h.y<P.y+P.h&&h.y+h.h>P.y);   // 主角站在危險區(預警或生效)裡:危險區刻意畫在主角之上
        rec(where,'p',{n0,n1,sc,hz});const lo=n0<40||sc<0.35;
        if(lo&&hz)nPH++;else if(lo){badP++;o.push(`  ${where} 主角不清楚:畫到 ${n0} 像素、清楚 ${(sc*100).toFixed(0)}%,畫面位置 ${sx|0},${sy|0}`);}
        keep(sc,hz?'主角(危險區內)':'主角',where,a,sx+6,sy+9);}
      const vb=ebul.filter(e=>e.x-cam.x>e.r&&e.x-cam.x<W-e.r&&e.y-cam.y>e.r&&e.y-cam.y<H-e.r);
      if(vb.length){const kb=ebul;const [a,b]=pair(()=>{ebul=[];},()=>{ebul=kb;});
        for(const e of vb){const X=e.x-cam.x,Y=e.y-cam.y,R=e.r+2,ex=Math.max(4,Math.PI*e.r*e.r);
          const [n0,n1]=diff(a,b,X-R,Y-R,X+R+1,Y+R+1),sc=Math.min(1,n1/ex);nB++;
          rec(where,'b',{n0,n1,sc,r:e.r,c:e.c,vk:e.vk||''});if(sc<0.5)badB++;keep(sc,'敵彈 '+(e.vk||e.c)+' r'+e.r,where,a,X,Y);}}
    }
    function gate(where){   // 傳送門:主角站在門左 60 像素
      for(let i=0;i<900&&!portal;i++){P.inv=999;P.lives=5;for(const q in K)K[q]=0;update();}
      if(!portal){o.push(where+' 傳送門未出現');badG++;return;}
      P.x=portal.x-60;P.y=portal.y;P.vy=0;P.climb=0;P.safeX=P.x;P.safeY=P.y;
      let k=0;for(;k<600&&portal&&!(portal.x-cam.x>40&&portal.x-cam.x<W-70&&k>=30);k++){P.inv=999;for(const q in K)K[q]=0;update();}   // 等鏡頭跟上
      if(!portal||k>=600){o.push(where+' 傳送門不在畫面內 '+(portal?`門 ${portal.x},${portal.y} 鏡頭 ${cam.x|0},${cam.y|0} 主角 ${P.x|0},${P.y|0}`:'(主角已進門)'));badG++;return;}
      const t0=portal.t;
      for(const t of[0,40,90]){while(portal&&portal.t-t0<t){P.inv=999;for(const q in K)K[q]=0;update();}
        if(!portal)break;HX.warm();
        const kp=portal;const [a,b]=pair(()=>{portal=null;},()=>{portal=kp;});
        const X=kp.x-cam.x,Y=kp.y-cam.y;const [n0,n1]=diff(a,b,X-10,Y-16,X+40,Y+40),sc=n0?n1/n0:0;nG++;
        rec(where,'g',{n0,n1,sc,t});if(n1<60){badG++;}keep(Math.min(sc,n1/60),'傳送門 t'+t,where,a,X+15,Y+12);}
    }
    for(let w=1;w<=10;w++){
      for(let s=1;s<=4;s++){const wh=w+'-'+s;HX.go(w,s);HX.run(20);
        let lx=P.x;for(let i=0;i<1600;i++){P.inv=999;P.lives=5;K.f=0;K.r=1;K.j=(i%50)<12?1:0;update();
          if(i%300===299){if(P.x-lx<48){P.x+=160;P.y=40;P.vy=0;P.climb=0;P.safeX=P.x;P.safeY=P.y;}lx=P.x;}   // 卡住時往前移,讓取樣涵蓋整關
          if(i%40===39){HX.warm();sample(wh);}}
        for(const q in K)K[q]=0;ens=[];gate(wh);}
      const segs=w===10?[1,2,3]:[0];
      for(const sg of segs){const wh=w+'王'+(sg?'第'+sg+'段':'');
        if(sg){HX.go(10,5);startBoss(0,sg);G.state='play';HX.run(sg===1?320:185);}else{HX.go(w,5);HX.run(320);}
        for(let i=0;i<2400;i++){P.inv=999;P.lives=5;K.f=0;const ph=Math.floor(i/90)%4;K.r=ph===0?1:0;K.l=ph===2?1:0;K.j=(i%70)<10?1:0;update();
          if(G.state!=='play')break;if(i%30===29){HX.warm();sample(wh);}}
        for(const q in K)K[q]=0;if(boss&&boss.alive)bossDie();
        for(let k=0;k<600&&G.state==='win';k++){P.inv=999;update();}
        gate(wh);}
    }
    const q=(v,f)=>v.length?Math.min(...v.map(f)):NaN,pc=v=>isNaN(v)?'—':(v*100).toFixed(0)+'%';
    for(const wh in S){const s=S[wh],bb=s.b.filter(e=>e.sc<0.5);
      o.push(`${wh.padEnd(8)} 主角 ${s.p.length} 次 最低清楚 ${pc(q(s.p,e=>e.sc))} 最少像素 ${q(s.p,e=>e.n0)}`+
        `  敵彈 ${s.b.length} 顆 不清楚 ${bb.length}${bb.length?' ['+[...new Set(bb.map(e=>(e.vk||e.c)+' r'+e.r))].slice(0,4).join(', ')+']':''}`+
        `  傳送門 ${s.g.length?s.g.map(e=>pc(e.sc)+'/'+e.n1).join(' '):'—'}`);}
    o.push(`主角 ${nP} 次中 ${badP} 次不清楚(畫到 <40 像素或清楚 <35%;另有 ${nPH} 次站在危險區裡被蓋住,不計);敵彈 ${nB} 顆中 ${badB} 顆不清楚(清楚像素 < 0.5×πr²);傳送門 ${nG} 次中 ${badG} 次不清楚(清楚像素 <60)`);
    let png=null;if(worst.length){const c=document.createElement('canvas');c.width=6*196;c.height=Math.ceil(worst.length/6)*214;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
      const t=document.createElement('canvas');t.width=t.height=64;const tx=t.getContext('2d');
      worst.forEach((w,i)=>{tx.putImageData(w.im,0,0);const X=(i%6)*196+2,Y=Math.floor(i/6)*214+18;x.drawImage(t,X,Y,192,192);
        x.fillStyle='#fff';x.font='12px sans-serif';x.fillText(`${pc(w.sc)} ${w.where} ${w.kind}`.slice(0,30),X,Y-4);});
      png=c.toDataURL('image/png');}
    return [o,badP+badB+badG,png];});
  console.log(r[0].join('\n'));
  if(outp&&r[2]){fs.writeFileSync(outp,Buffer.from(r[2].split(',')[1],'base64'));console.log('最差 24 格拼圖:',outp);}
  console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return errs.length;   // 可見性只回報,不當作失敗(標準需人判斷)
}

// 11/13 5 王掃描與無限大砲互斥:主角無敵在場上走動 N 幀(預設 30000),統計大砲發動時掃描是否已在警示(防護罩已出現)、
// 掃描與大砲是否同時有環在判定,以及大砲期間防護罩殘留幀數
async function b5mx(n,file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(N=>{HX.go(5,5);HX.run(320);let can=0,steal=0,both=0,shF=0,ex=[];
    for(let i=0;i<N;i++){const b=boss;const was=b.cannonPhase,sh=!!b.shieldPlats&&b.ring<0,cd=b.ringCd;
      P.inv=999;P.lives=5;const ph=Math.floor(i/90)%4;K.r=ph===0?1:0;K.l=ph===2?1:0;K.j=(i%70)<10?1:0;update();
      if(!boss||!boss.alive){HX.go(5,5);HX.run(320);continue;}
      if(!was&&b.cannonPhase==='warn'){can++;if(sh){steal++;if(ex.length<3)ex.push(`第 ${i} 幀 ringCd ${cd}`);}}
      if(b.ring>=0&&(b.cannonPhase==='fire1'||b.cannonPhase==='fire2'))both++;
      if(b.cannonPhase&&b.shieldPlats)shF++;}
    return `${N} 幀:大砲發動 ${can} 次,其中 ${steal} 次發生在掃描警示中(防護罩已出現、掃描尚未發射)${ex.length?'(例:'+ex.join('、')+')':''};掃描環與大砲環同時判定 ${both} 幀;大砲期間防護罩殘留 ${shF} 幀`;},+n||30000);
  console.log(r);console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return errs.length;
}

// v0.31 進關尖峰:每個小關與魔王(10 王三段)量 startLevel(含生成、烘焙)與之後前 10 幀 update+render 的最長單幀耗時(沙盒相對值)。
// 用來對照 F3「JS 最差 @關卡」:F3 在換關那一幀已算新關卡,所以進關烘焙會記在新關卡名下
async function entry(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[],rows=[];
    for(let w=1;w<=10;w++)for(let s=1;s<=5;s++)for(const sg of (w===10&&s===5?[1,2,3]:[0])){
      resetRun();G.world=w;G.sub=s;
      const t0=performance.now();if(sg>1){startBoss(0,sg);G.state='intro';G.sT=0;}else startLevel();const ts=performance.now()-t0;
      let fm=0,fa=0;for(let i=0;i<10;i++){const a=performance.now();P.inv=999;update();render();const d=performance.now()-a;if(d>fm){fm=d;fa=i;}}
      rows.push({k:w+'-'+s+(s===5?'王'+(sg?sg:''):''),ts,fm,fa});}
    rows.sort((a,b)=>Math.max(b.ts,b.fm)-Math.max(a.ts,a.fm));
    for(const x of rows.slice(0,15))o.push(`${x.k.padEnd(7)} 進關 ${x.ts.toFixed(1)} ms  之後最長一幀 ${x.fm.toFixed(1)} ms(第 ${x.fa} 幀)`);
    const n=rows.filter(x=>x.s<5);return o;});
  console.log('最慢 15 個(沙盒相對值,依進關與首 10 幀最大者排序)\n'+r.join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return errs.length;
}

// v0.35 烘焙分幀前後畫面一致(11/13):兩版同種子、不按鍵跑各王(10 王三段)登場後 360 幀,等內嵌圖載入再畫一幀,比對輸出畫面像素
async function bakecmp(fa,fb){
  const one=async f=>{const {br,pg,errs}=await open(f,{width:512,height:288});const out=[];
    for(let w=1;w<=10;w++)for(const sg of (w===10?[1,2,3]:[0])){
      await pg.evaluate(([w,sg])=>{Math.random=(()=>{let z=777;return()=>(z=(z*16807)%2147483647)/2147483647;})();resetRun();G.world=w;G.sub=5;
        if(sg>1){HX.go(10,5);Math.random=(()=>{let z=777;return()=>(z=(z*16807)%2147483647)/2147483647;})();startBoss(0,sg);G.state='intro';G.sT=0;}else startLevel();
        for(let i=0;i<360;i++){P.inv=999;P.lives=5;for(const q in K)K[q]=0;update();if(i%4===0)render();}},[w,sg]);
      await pg.waitForTimeout(350);
      out.push(await pg.evaluate(()=>{HX.warm();G.shakeT=0;render();const d=octx.getImageData(0,0,cv.width,cv.height).data;let h=0;for(let i=0;i<d.length;i+=4)h=(Math.imul(h,31)+d[i]*65536+d[i+1]*256+d[i+2])|0;return h;}));}
    await br.close();return [out,errs];};
  const [A,ea]=await one(fa),[B,eb]=await one(fb);const lab=['1','2','3','4','5','6','7','8','9','10-1','10-2','10-3'];let bad=0;
  console.log(lab.map((l,i)=>{const ok=A[i]===B[i];if(!ok)bad++;return l+'王 '+(ok?'相同':'不同');}).join('  '));
  const e=ea.concat(eb);console.log('錯誤',e.length?e.slice(0,5):'無');return bad+e.length;
}

// v0.35 各王進關烘焙分解(11/13):包住各烘焙函式計時,每個魔王(10 王三段)進關後跑 70 幀(暗幕 60 幀加登場前段),
// 列出每個烘焙函式在第幾幀、花多少 ms,以及期間最長單幀;用來核對烘焙是否分散到暗幕各幀。共用光影 ltBuild 先建好(實際遊玩由第 4 小關進王關,同大關不重建)
async function bakems(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[];let F=0,rec=[];
    const names=['stBake','b1Bake','b2Bake','b2BgBuild','b3Bake','b3EyeBake','b4Bake','b5Bake','b5BgBuild','b6Bake','b7Bake','b8Bake','b8BgBuild','b8TombBake','b9Bake','b10Bake','b10BgBuild','b10FaceBake','b10HeartBake','b10Bg3Build','ltBuild','eBake','matCol'];
    for(const n of names){const f=window[n];if(typeof f!=='function')continue;let d=0;window[n]=function(){if(d++)return f.apply(this,arguments);const a=performance.now();try{return f.apply(this,arguments);}finally{d=0;const t=performance.now()-a;if(n!=='matCol'||t>2)rec.push([n,F,t]);}};}
    for(let w=1;w<=10;w++)for(const sg of (w===10?[1,2,3]:[0])){
      rec=[];resetRun();G.world=w;G.sub=5;ltBuild();rec=[];if(sg>1){HX.go(10,5);startBoss(0,sg);G.state='intro';G.sT=0;}else startLevel();
      let fm=0,fa=0;for(F=0;F<70;F++){const a=performance.now();P.inv=999;update();render();const d=performance.now()-a;if(d>fm){fm=d;fa=F;}}
      const big=rec.filter(x=>x[2]>1).map(x=>`${x[0]}@${x[1]} ${x[2].toFixed(1)}`).join(' ');
      o.push(`${(w+'王'+(sg?sg:'')).padEnd(5)} 最長一幀 ${fm.toFixed(1)} ms(第 ${fa} 幀)  ${big}`);}
    return o;});
  console.log(r.join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return errs.length;
}

// v0.31 畫質與燃燒剪影對照圖:上兩列為 10-2 敵彈、3-2 衝鋒槍 Lv4、3-2 散彈 Lv4 的低/高畫質(主角周圍 256×144 放大 2 倍);
// 下面為火焰 Lv1~4 噴中敵人時的低畫質畫面。給第二個檔案時同一位置左右並排(左 A 右 B),用來比對舊版
async function qcmp(outp,fa,fb){
  const one=async f=>{const {br,pg,errs}=await open(f,{width:512,height:288});
    const r=await pg.evaluate(()=>{const out=[];
      const crop=f=>{const c=document.createElement('canvas');c.width=512;c.height=288;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
        const fx=f?f.x-cam.x-128:P.x-cam.x-90,fy=f?f.y-cam.y-72:P.y-cam.y-80;const cx=Math.max(0,Math.min(W-256,Math.round(fx))),cy=Math.max(0,Math.min(H-144,Math.round(fy)));x.drawImage(cv,cx,cy,256,144,0,0,512,288);return c.toDataURL();};
      const pin=()=>{let k=0;for(const e of ens){if(k>=3)break;e.x=P.x+18+k*22;e.y=P.y+P.h-e.h;e.vx=0;e.vy=0;e.hp=999;k++;}};
      const setup=(w,s,wp,lv)=>{Math.random=(()=>{let z=12345;return()=>(z=(z*16807)%2147483647)/2147483647;})();HX.go(w,s);HX.run(20);HX.crowd();HX.run(40);
        P.x=Math.max(40,P.x);P.face=1;wep=wp;wlvl=lv;G.shakeT=0;};
      for(const [w,s,wp] of [[10,2,'smg'],[3,2,'smg'],[3,2,'shot']]){setup(w,s,wp,4);let f=null;
        if(w===10){const on=e=>e.x-cam.x>20&&e.x-cam.x<W-20&&e.y-cam.y>20&&e.y-cam.y<H-20;for(let i=0;i<1500&&ebul.filter(on).length<3;i++){P.inv=999;K.r=(i%200)<20?1:0;update();}K.r=0;f=ebul.find(on)||null;}   // 10-2 列以敵彈為中心
        else{K.f=1;for(let i=0;i<14;i++){P.inv=999;update();}K.f=0;}HX.warm();
        for(const q of['low','high']){FX.q=q;G.shakeT=0;render();out.push(crop(f));}}
      FX.q='low';
      for(let lv=1;lv<=4;lv++){setup(3,2,'flame',lv);K.f=1;for(let i=0;i<30;i++){P.inv=999;pin();update();G.shakeT=0;render();}   /* v0.36 修正:火團只在 render 推進,每幀都要畫(原本只畫最後一幀,火身只有第一幀) */pin();HX.warm();G.shakeT=0;render();out.push(crop());K.f=0;}
      return out;});
    await br.close();return [r,errs];};
  const A=await one(fa),B=fb?await one(fb):null;
  const {br,pg}=await open(fa,{width:512,height:288});
  const png=await pg.evaluate(async([A,B])=>{const cols=B?2:1,lab=['10-2 敵彈 低','10-2 敵彈 高','3-2 衝鋒槍 Lv4 低','3-2 衝鋒槍 Lv4 高','3-2 散彈 Lv4 低','3-2 散彈 Lv4 高','火焰 Lv1','火焰 Lv2','火焰 Lv3','火焰 Lv4'];
    const rowsN=B?A.length:Math.ceil(A.length/2),c=document.createElement('canvas');c.width=cols*516*(B?1:2)/ (B?1:1);c.width=(B?2:2)*516;c.height=rowsN*306;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
    const ld=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});
    for(let i=0;i<A.length;i++){const set=B?[A[i],B[i]]:[A[i]];for(let j=0;j<set.length;j++){const im=await ld(set[j]);
      const X=B?j*516:(i%2)*516,Y=(B?i:Math.floor(i/2))*306+16;x.drawImage(im,X,Y);x.fillStyle='#fff';x.font='13px sans-serif';x.fillText(lab[i]+(B?(j?' (B)':' (A)'):''),X+2,Y-3);}}
    return c.toDataURL();},[A[0],B&&B[0]]);
  fs.writeFileSync(outp,Buffer.from(png.split(',')[1],'base64'));await br.close();
  const e=A[1].concat(B?B[1]:[]);console.log('已存',outp);console.log('錯誤',e.length?e.slice(0,5):'無');return e.length;
}

// 火焰剪影沿射程對照(v0.36):火焰 Lv1~4,3 隻敵人固定在射程 35%、60%、85% 處(地面同高),噴 30 幀後截槍口到射程末端 240×80 放大 2 倍;
// 列為等級,欄為各檔案(可給多個),用來看火身尾段會不會蓋住剪影
async function fsil(outp,files){
  const cells=[];
  for(const f of files){const {br,pg,errs}=await open(f,{width:512,height:288});
    const r=await pg.evaluate(()=>{const out=[];
      for(let lv=1;lv<=4;lv++){Math.random=(()=>{let z=12345;return()=>(z=(z*16807)%2147483647)/2147483647;})();HX.go(3,2);HX.run(20);HX.crowd();HX.run(40);
        P.x=Math.max(40,P.x);P.face=1;wep='flame';wlvl=lv;G.shakeT=0;const L=flameRange();
        const pin=()=>{const m=muzzle();let k=0;for(const e of ens){if(k>=3)break;e.x=m[0]+L*[0.35,0.6,0.85][k]-e.w/2;e.y=P.y+P.h-e.h;e.vx=0;e.vy=0;e.hp=999;k++;}};
        K.f=1;for(let i=0;i<30;i++){P.inv=999;pin();update();G.shakeT=0;render();}pin();HX.warm();G.shakeT=0;render();K.f=0;   // 火團只在 render 推進(drawFlame),每幀都要畫
        const c=document.createElement('canvas');c.width=480;c.height=160;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const k=cv.width/W;
        const cx=Math.max(0,Math.min(W-240,Math.round(muzzle()[0]-cam.x-12))),cy=Math.max(0,Math.min(H-80,Math.round(P.y-cam.y-50)));
        x.drawImage(cv,cx*k,cy*k,240*k,80*k,0,0,480,160);out.push(c.toDataURL());}
      return out;});
    cells.push([path.basename(f),r,errs]);await br.close();}
  const {br,pg}=await open(files[0],{width:512,height:288});
  const png=await pg.evaluate(async C=>{const c=document.createElement('canvas');c.width=C.length*484;c.height=4*178;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
    const ld=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});
    for(let j=0;j<C.length;j++)for(let i=0;i<4;i++){const im=await ld(C[j][1][i]);x.drawImage(im,j*484,i*178+16);x.fillStyle='#fff';x.font='13px sans-serif';x.fillText(C[j][0]+' 火焰 Lv'+(i+1),j*484+2,i*178+13);}
    return c.toDataURL();},cells.map(q=>[q[0],q[1]]));
  fs.writeFileSync(outp,Buffer.from(png.split(',')[1],'base64'));await br.close();
  const e=[].concat(...cells.map(q=>q[2]));console.log('已存',outp);console.log('錯誤',e.length?e.slice(0,5):'無');return e.length;
}

// v0.31 新舊版放大對照(11/13):10 王第 2 段扇形彈、6 王光柱內的主角;各取 128×72 放大 4 倍,給兩個檔案時左右並排(A 左、B 右)
async function vcmp(outp,fa,fb){   // v0.33 加環狀彈;v0.37 加 7 王、10 王第 2 段光柱內的主角
  const one=async f=>{const {br,pg,errs}=await open(f,{width:512,height:288});
    const r=await pg.evaluate(()=>{const out=[];
      const crop=(fx,fy)=>{const c=document.createElement('canvas');c.width=512;c.height=288;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
        const cx=Math.max(0,Math.min(W-128,Math.round(fx-cam.x-64))),cy=Math.max(0,Math.min(H-72,Math.round(fy-cam.y-36))),k=cv.width/W;x.drawImage(cv,cx*k,cy*k,128*k,72*k,0,0,512,288);return c.toDataURL();};
      const seed=()=>{Math.random=(()=>{let z=12345;return()=>(z=(z*16807)%2147483647)/2147483647;})();};
      const idle=n=>{for(let i=0;i<n;i++){P.inv=999;P.lives=5;for(const q in K)K[q]=0;update();}};
      seed();HX.go(10,5);startBoss(0,2);G.state='play';idle(185);boss.ai=2;boss.cd=0;idle(24);HX.warm();G.shakeT=0;render();
      const f=ebul.find(q=>q.vk==='b10s');out.push(f?crop(f.x,f.y):crop(P.x,P.y));
      seed();HX.go(10,5);startBoss(0,2);G.state='play';idle(185);boss.ai=0;boss.cd=0;idle(24);HX.warm();G.shakeT=0;render();
      const g=ebul.find(q=>q.vk==='b10c'&&q.x-cam.x>40&&q.x-cam.x<W-40&&q.y>40&&q.y<H-40);out.push(g?crop(g.x,g.y):crop(P.x,P.y));
      seed();HX.go(6,5);idle(320);P.x=200;P.y=14*TS-P.h;P.vy=0;idle(2);
      for(const k of[8,20]){hazs.length=0;const z=haz(P.x-8,0,24,14*TS,44,26,'#d0ffe8','b6pw');z.fx='b6p';z.t=z.warn+k;HX.warm();G.shakeT=0;P.inv=0;render();out.push(crop(P.x+5,P.y+7));}
      // v0.37:7 王虹彩光柱、10 王第 2 段青白光柱內的主角
      seed();HX.go(7,5);idle(320);hazs.length=0;{const z=haz(P.x-8,0,26,H,50,90,'#ffffff','beam');z.fx='b7beam';z.nw=1;z.t=z.warn+20;HX.warm();G.shakeT=0;P.inv=0;render();out.push(crop(P.x+5,P.y+7));}
      seed();HX.go(10,5);startBoss(0,2);G.state='play';idle(185);hazs.length=0;{const z=haz(P.x-4,0,18,14*TS,30,18,'#c8fbff','beam');z.fx='b10col';z.t=z.warn+8;HX.warm();G.shakeT=0;P.inv=0;render();out.push(crop(P.x+5,P.y+7));}
      return out;});
    await br.close();return [r,errs];};
  const A=await one(fa),B=fb?await one(fb):null;
  const {br,pg}=await open(fa,{width:512,height:288});
  const png=await pg.evaluate(async([A,B])=>{const lab=['10 王第 2 段扇形彈','10 王第 2 段環狀彈','6 王光柱生效第 8 幀','6 王光柱生效第 20 幀','7 王虹彩光柱內的主角','10 王第 2 段青白光柱內的主角'],cols=B?2:1;
    const c=document.createElement('canvas');c.width=cols*516;c.height=A.length*306;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
    const ld=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});
    for(let i=0;i<A.length;i++){const set=B?[A[i],B[i]]:[A[i]];for(let j=0;j<set.length;j++){const im=await ld(set[j]);const X=j*516,Y=i*306+16;
      x.drawImage(im,X,Y);x.fillStyle='#fff';x.font='13px sans-serif';x.fillText(lab[i]+(B?(j?' (B)':' (A)'):''),X+2,Y-3);}}
    return c.toDataURL();},[A[0],B&&B[0]]);
  fs.writeFileSync(outp,Buffer.from(png.split(',')[1],'base64'));await br.close();
  const e=A[1].concat(B?B[1]:[]);console.log('已存',outp);console.log('錯誤',e.length?e.slice(0,5):'無');return e.length;
}

// v0.31 桌機實測頁:複製 index.html,加一條可收起的控制列 → preview/perf-test.html(不提交,由使用者在測試機開啟,Claude 不代跑)。
// 控制列只在按鈕被按時改狀態(跳關、無限命、魔王剩 5%、特攻充滿、換武器),不改繪製;開啟時強制高畫質。
// F4 收起/打開控制列(量測時收起);B 魔王剩 5%;N 特攻充滿(這兩鍵遊戲本身沒用到)
function perfpage(file){
  const src=path.resolve(file||path.join(ROOT,'index.html'));let s=fs.readFileSync(src,'utf8');
  const ver=(s.match(/VERSION: (v[\d.]+)/)||[])[1]||'?';
  const btn=(a,t)=>`<button ${a}>${t}</button>`;
  const bar=`
<div id="pt" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18f0;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>桌機實測頁 ${ver}</b>
 <span>跳到:</span>${btn('data-w="10" data-s="1"','第 10 大關 1-1')}${[1,2,3,4,5,6,7,8,9].map(w=>btn(`data-w="${w}" data-s="5"`,w+' 王')).join('')}${btn('data-w="10" data-s="5"','10 王')}
 <span>| 武器 Lv4:</span>${btn('data-p="smg"','衝鋒槍')}${btn('data-p="flame"','火焰')}${btn('data-p="shot"','散彈')}
 ${btn('id="ptInv"','')}${btn('id="ptHp"','魔王剩 5%(B)')}${btn('id="ptSp"','特攻充滿(N)')}
 <span id="ptSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">F4 收起/打開這條控制列(量測時請收起)。F3 效能面板:按一次開始量測,再按一次關掉,重開即從零開始。畫質已固定為高。</div>
</div>
<script>
(()=>{const bar=document.getElementById('pt'),st=document.getElementById('ptSt');let inv=1;
  FX.q='high';
  const u0=update;window.update=function(){u0();if(inv&&P.lives<3)P.lives=3;};   // 無限命:命數不低於 3(照常被打、照常無敵閃爍)
  function jump(w,s){resetRun();G.world=w;G.sub=s;hudEl.style.display='flex';startLevel();if(wep0){wep=wep0;wlvl=4;}}
  let wep0=null;
  function hp(){if(boss&&boss.alive&&G.state==='play'){boss.hp=Math.min(boss.hp,Math.ceil(boss.max*0.05));msg('魔王剩 5%');}}
  function sp(){G.charge=100;msg('特攻充滿');}
  function msg(t){st.textContent=t;clearTimeout(msg.t);msg.t=setTimeout(()=>st.textContent='',1500);}
  function ref(){document.getElementById('ptInv').textContent='無限命:'+(inv?'開':'關');}ref();
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.blur();
    if(b.dataset.w){jump(+b.dataset.w,+b.dataset.s);msg('已跳到 '+b.textContent);}
    else if(b.dataset.p){wep0=b.dataset.p;wep=wep0;wlvl=4;msg(b.textContent+' Lv4');}
    else if(b.id==='ptInv'){inv^=1;ref();}else if(b.id==='ptHp')hp();else if(b.id==='ptSp')sp();});
  addEventListener('keydown',e=>{if(e.code==='F4'){e.preventDefault();bar.style.display=bar.style.display==='none'?'flex':'none';}
    else if(e.code==='KeyB')hp();else if(e.code==='KeyN')sp();});
})();
</script>
`;
  s=s.replace(/<\/body>/i,bar+'</body>');
  const out=path.join(ROOT,'preview','perf-test.html');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,s);
  console.log('已存',out,'(',ver,')');return 0;
}

// v0.28.2 魔王死後清場(使用者 11/13 授權 1A):每隻魔王打到場上有敵彈或危險區時擊倒,跑完死亡演出到傳送門出現,
// 記錄當下殘留的敵彈、危險區、雜兵,之後主角不無敵、站著不動 300 幀,看會不會被扣命。10 王用第 3 段(最後一段)
async function bclear(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[];let bad=0;
    for(let w=1;w<=10;w++){
      if(w===10){HX.go(10,5);startBoss(0,3);G.state='play';HX.run(185);}else{HX.go(w,5);HX.run(320);}
      let i=0;for(;i<6000&&!(ebul.length+hazs.length>=2&&ens.length+ebul.length+hazs.length>=3);i++)HX.run(1);
      const e0=ebul.length,h0=hazs.length,n0=ens.length;
      bossDie();let k=0;while(G.state==='win'&&k<400){P.inv=999;update();k++;}
      const e1=ebul.length,h1=hazs.length,n1=ens.length,L=P.lives=5;P.inv=0;
      for(let t=0;t<300;t++){for(const q in K)K[q]=0;update();if(G.state!=='play')break;}
      const lost=L-P.lives,ok=e1+h1+n1===0&&lost===0;if(!ok)bad++;
      o.push(`王${w} 擊倒時 敵彈${e0} 危險區${h0} 雜兵${n0} → 傳送門出現時 敵彈${e1} 危險區${h1} 雜兵${n1};之後 300 幀扣命 ${lost}${ok?'':' ← 殘留'}`);}
    o.push(`未通過 ${bad} 隻(共 10 隻)`);return [o,bad];});
  console.log(r[0].join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return r[1]+errs.length;
}

// v0.28.2 暫停只在遊玩中(使用者 11/13 授權 2A):各狀態按 P,看 G.paused 是否改變;死亡畫面按過 P 後接續挑戰,不得處於暫停
async function pstate(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const key=c=>{dispatchEvent(new KeyboardEvent('keydown',{code:c}));dispatchEvent(new KeyboardEvent('keyup',{code:c}));};
    const chk=(nm,want)=>{G.paused=false;key('KeyP');const ok=G.paused===want;if(!ok)bad++;o.push(`${nm} 按 P → ${G.paused?'暫停':'未暫停'}(應為${want?'暫停':'未暫停'})${ok?'':' ← 錯'}`);G.paused=false;};
    HX.go(1,1);G.state='play';chk('遊玩中',true);
    HX.go(1,1);G.state='intro';G.sT=0;chk('進關開場',false);
    HX.go(2,5);HX.run(320);bossDie();chk('勝利演出',false);
    HX.go(2,5);HX.run(320);G.state='over';G.sT=0;G.overBoss=true;chk('死亡畫面',false);
    G.paused=true;startLevel();const ok=!G.paused;if(!ok)bad++;o.push(`暫停中進關 → ${G.paused?'暫停(錯)':'已解除'}`);
    o.push(`未通過 ${bad} 項`);return [o,bad];});
  console.log(r[0].join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return r[1]+errs.length;
}

// v0.29 選單鍵盤操作(使用者 11/13 指定):以模擬按鍵走過標題、選關、進關選彈種、撿武器箱、死亡畫面、6 王特攻選單
async function menu(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[];let bad=0;
    const key=(c,rep)=>{dispatchEvent(new KeyboardEvent('keydown',{code:c,repeat:!!rep}));dispatchEvent(new KeyboardEvent('keyup',{code:c}));};
    const step=n=>{for(let i=0;i<n;i++){update();render();}};
    const ck=(nm,ok,info)=>{if(!ok)bad++;o.push(`${ok?'OK':'錯'} ${nm}${info?' ('+info+')':''}`);};
    toTitle();step(2);key('KeyZ');step(1);ck('標題按 Z 進選關',G.state==='levelselect');
    key('KeyZ');ck('選關開啟 20 幀內按 Z 不作用',G.state==='levelselect');
    step(25);key('ArrowDown');key('ArrowRight');key('ArrowDown');key('ArrowUp');key('ArrowUp');key('ArrowDown');key('ArrowRight');
    ck('選關游標移動',G.mc===3,'游標 '+G.mc);key('KeyZ',true);ck('按住連發不確認',G.state==='levelselect');
    key('KeyZ');ck('選關按 Z 從 3-1 開始',G.world===3&&G.sub===1&&G.state==='intro',G.world+'-'+G.sub+' '+G.state);
    toTitle();step(2);key('Enter');step(26);key('KeyZ');ck('選關游標預設正常遊玩',G.world===1&&G.state==='intro');
    debugStartWorld(7);step(90);const ch=G.modal&&G.modal.choose;ck('7-1 出現選彈種',!!ch);
    key('ArrowRight');key('KeyZ');ck('選彈種按右再 Z',ch&&!G.modal&&wep===ch[1]&&wlvl===2&&!K.f,wep+' Lv'+wlvl);
    HX.go(3,1);wep='smg';wlvl=1;G.modal={wt:'flame'};step(1);key('KeyZ');ck('武器箱開啟立刻按 Z 不作用(防誤按)',!!G.modal&&wep==='smg');
    step(25);key('KeyZ');ck('武器箱按 Z 替換',!G.modal&&wep==='flame'&&!K.f,wep+' Lv'+wlvl);
    G.modal={wt:'shot'};step(25);key('ArrowRight');key('KeyZ');ck('武器箱按右再 Z 取消',!G.modal&&wep==='flame');
    G.modal={wt:'shot'};step(2);key('Escape');ck('武器箱 Esc 取消',!G.modal&&wep==='flame'&&!G.paused);
    HX.go(2,2);G.state='over';G.sT=0;G.overBoss=false;step(60);key('KeyZ');ck('死亡畫面 90 幀前按 Z 不作用',G.state==='over');
    step(60);key('KeyZ');ck('死亡畫面按 Z 接續',G.state==='intro'&&G.world===2&&G.sub===1);
    HX.go(2,2);G.state='over';G.sT=0;step(120);key('ArrowRight');key('KeyZ');ck('死亡畫面按右再 Z 回標題',G.state==='title');
    HX.go(6,5);HX.run(320);G.charge=100;HX.press();const sp=!!(G.modal&&G.modal.spPick);step(25);const k0=boss.kh,c0=boss.ch;
    key('ArrowRight');key('KeyZ');HX.run(400);ck('6 王選單按右再 Z 打詠嘆者',sp&&!G.modal&&boss.ch<c0&&boss.kh===k0);
    G.charge=100;HX.press();step(25);key('ArrowDown');key('KeyZ');ck('6 王選單按下再 Z 取消',!G.modal&&G.charge===100);
    G.charge=100;HX.press();step(25);key('Digit3');HX.run(5);ck('6 王選單數字鍵照常',!G.modal&&G.charge<100);
    o.push(`未通過 ${bad} 項`);return [o,bad];});
  console.log(r[0].join('\n'));console.log('錯誤',errs.length?errs.slice(0,5):'無');await br.close();return r[1]+errs.length;
}

async function mshot(pre,file){   // v0.29 各選單截圖:<前綴>-title/ls/choose/wt/over/sp.png;v0.38 加 pause/intro/warn/card/win/finish/msg/msg5
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const S={title:()=>{toTitle();},ls:()=>{toTitle();G.state='levelselect';G.mk=null;mSel();G.mc=7;},
    choose:()=>{debugStartWorld(7);HX.run(70);mSel();G.mc=1;},wt:()=>{HX.go(3,1);G.modal={wt:'flame'};HX.run(1);},
    over:()=>{HX.go(2,2);G.state='over';G.sT=95;G.overBoss=false;},
    // v0.38 像素字:補上暫停、進關字卡、WARNING、魔王字卡、擊破、破關、招式字幕與特攻通訊
    pause:()=>{HX.go(3,1);HX.run(5);G.paused=true;},intro:()=>{HX.go(9,3);G.state='intro';G.sT=30;},introb:()=>{HX.go(9,4);G.sub=5;G.state='intro';G.sT=30;},warn:()=>{HX.go(4,5);HX.run(58);},card:()=>{HX.go(5,5);HX.run(260);},
    win:()=>{HX.go(1,5);HX.run(320);G.state='win';G.sT=120;},finish:()=>{toTitle();G.state='finish';G.sT=0;G.score=123400;},
    msg:()=>{HX.go(2,1);HX.run(30);G.charge=100;HX.press();HX.run(50);G.msg='骨影閃瞬 → 左上';G.msgT=60;},msg5:()=>{HX.go(5,5);HX.run(320);G.charge=100;HX.press();HX.run(70);},sp:()=>{HX.go(6,5);HX.run(320);G.charge=100;HX.press();mSel();G.mc=1;}};
  for(const k in S){
    await pg.evaluate(src=>{(0,eval)('('+src+')')();HX.warm();render();},S[k].toString());
    await pg.waitForTimeout(300);await pg.evaluate(()=>render());await pg.screenshot({path:`${pre}-${k}.png`});}
  console.log('已存',pre+'-*.png','錯誤',errs.length?errs:'無');await br.close();
}

// v0.38 像素字烘焙:把 index.html 用到的字(ASCII 32~126 加檔案內所有非 ASCII 字)以俐方體 11 號畫成 16×14 的 1 位元點陣(筆尖在第 2 欄、基線在第 10 列下緣;中文字身落在第 1~11 列),
// 寫回 index.html 尾端資料區塊的 /*PF-BEGIN*/…/*PF-END*/。每字 29 位元組:第 1 個是字寬(前進量),其餘 28 個是點陣(逐列、高位在左)。
// 做法:字放大 8 倍畫,再取每格中心點(避免瀏覽器平滑字邊);以兩種不同的備援字型各畫一次,結果不同就是字型缺這個字。
async function fontbake(file){
  const f=file||path.join(ROOT,'index.html');let src=fs.readFileSync(f,'utf8');
  const A='/*PF-BEGIN',Z='/*PF-END*/',i0=src.indexOf(A),i1=src.indexOf(Z);
  if(i0<0||i1<0){console.log('找不到 PF-BEGIN/PF-END 標記');return 1;}
  const body=src.slice(0,i0)+src.slice(i1+Z.length),set=new Set();for(const ch of body)if(ch.codePointAt(0)>127)set.add(ch);
  const extra=[...set].sort((a,b)=>a.codePointAt(0)-b.codePointAt(0)),chars=[];for(let i=32;i<127;i++)chars.push(String.fromCharCode(i));chars.push(...extra);
  const font=fs.readFileSync(path.join(ROOT,'art-src/fonts/cubic11/Cubic_11.woff2')).toString('base64');
  const br=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});const pg=await br.newPage();
  await pg.setContent('<style>@font-face{font-family:C11;src:url(data:font/woff2;base64,'+font+')}</style><body>x</body>');
  const r=await pg.evaluate(async chars=>{await document.fonts.load('96px C11','按Z');
    const Q=8,CW=16,CH=14,PW=24,PH=24,c=document.createElement('canvas');c.width=PW*Q;c.height=PH*Q;const x=c.getContext('2d',{willReadFrequently:true});
    const draw=(ch,fb)=>{x.clearRect(0,0,c.width,c.height);x.font=(12*Q)+'px C11,'+fb;x.textBaseline='alphabetic';x.fillStyle='#fff';x.fillText(ch,6*Q,14*Q);
      const d=x.getImageData(0,0,c.width,c.height).data,m=[];for(let yy=0;yy<PH;yy++)for(let xx=0;xx<PW;xx++)m.push(d[((yy*Q+Q/2)*c.width+xx*Q+Q/2)*4+3]>127?1:0);return m;};
    const out=[],miss=[],clip=[];
    for(const ch of chars){const m=draw(ch,'"Courier New",MingLiU'),m2=draw(ch,'Arial,"Microsoft JhengHei"');
      x.font=(12*Q)+'px C11,"Courier New",MingLiU';let adv=Math.round(x.measureText(ch).width/Q);
      const bad=m.some((v,i)=>v!==m2[i]);if(bad)miss.push(ch);
      const bytes=new Array(29).fill(0);bytes[0]=bad?13:Math.max(1,Math.min(15,adv));let cl=0;
      for(let yy=0;yy<PH;yy++)for(let xx=0;xx<PW;xx++){if(!m[yy*PW+xx])continue;const gx=xx-4,gy=yy-4;
        if(gx<0||gy<0||gx>=CW||gy>=CH){cl=1;continue;}if(!bad){const b=gy*CW+gx;bytes[1+(b>>3)]|=128>>(b&7);}}
      if(cl&&!bad)clip.push(ch);out.push(...bytes);}
    let bin='';for(const b of out)bin+=String.fromCharCode(b);return {b64:btoa(bin),miss,clip};},chars);
  await br.close();
  const blk=A+' 像素字點陣(俐方體 11 號,授權見 art-src/fonts/cubic11/OFL.txt;由 node tools/harness.js fontbake 產生,勿手改)*/const PFC="'+extra.join('')+'",PFD="'+r.b64+'";'+Z;
  fs.writeFileSync(f,src.slice(0,i0)+blk+src.slice(i1+Z.length));
  console.log('字數',chars.length,'(非 ASCII',extra.length+')','資料',r.b64.length,'字元');
  console.log('字型缺字(畫成空白)',r.miss.length?r.miss.join(' '):'無');console.log('超出 16×14 格(被裁)',r.clip.length?r.clip.join(' '):'無');return 0;
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
    const on=+FX.only||0,sh=document.createElement('canvas');sh.width=on?1024:512*5;sh.height=on?576:288*2;const sx=sh.getContext('2d');sx.imageSmoothingEnabled=false; // only=N:只截第 N 大關,放大 2 倍
    const sd=+FX.seed||0;                               // seed=N:固定亂數,兩種方案可用同一批地圖對照(11/1)
    for(let w=on||1;w<=(on||10);w++){if(sd){let a=(sd*1000+w)*2654435761>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
      HX.go(w,s);FX.q=q;HX.run(s===5?320:20);if(s<5){HX.crowd();HX.run(90,true);}else HX.run(60,true);render();
      if(on)sx.drawImage(cv,0,0,1024,576);else sx.drawImage(cv,((w-1)%5)*512,Math.floor((w-1)/5)*288,512,288);}
    return sh.toDataURL('image/png');},[+s,q,opt||'']);
  fs.writeFileSync(outp,Buffer.from(data.split(',')[1],'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();
}

/* 火焰對照圖(抓蟲 d):列=Lv1~4,欄=側噴第 a 幀、側噴第 a+5 幀、斜上、正上;每格以主角為中心裁 208×104 放大 2 倍。
   FX 設定同 sheet(如 pvf=2,w=3,pvf 為預覽頁方案);w=大關(預設 3)。清掉敵人與敵彈,只看火焰本身 */
/* 墜崖復活保護(v0.30.1):每大關第 1~5 小關找第一個整欄沒有地面的坑,站在坑左緣後推進坑裡;復活那一幀起按住右與跳,
   核對 20 幀內水平不動(傳送帶推動另列 dx)、沒有起跳、沒有再次墜崖,第 21 幀起恢復可走。也測繩梯:最後立足處在繩梯上時,復活應抓住繩梯 */
async function fall(file){
  const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const out=[];
    const step=k=>{K.l=0;K.r=k.r?1:0;K.j=k.j?1:0;K.u=K.d=K.f=0;P.inv=999;P.lives=5;G.modal=null;update();};
    for(let w=1;w<=10;w++)for(let s=1;s<=5;s++){HX.go(w,s);if(s===5)HX.run(320);
      let pit=-1;for(let x=3;x<map.w-2&&pit<0;x++){let e=true;for(let y=0;y<GH;y++)if(T(x,y)!==0&&T(x,y)!==4)e=false;
        let top=-1;for(let y=0;y<GH;y++)if(isSolid(T(x-1,y))){top=y;break;}if(e&&top>0&&!isSolid(T(x-1,top-1)))pit=x;}
      if(pit<0){out.push(w+'-'+s+' 無坑');continue;}
      let top=0;for(let y=0;y<GH;y++)if(isSolid(T(pit-1,y))){top=y;break;}
      ens.length=0;ebul.length=0;P.x=(pit-1)*16+4;P.y=top*16-P.h;P.vx=P.vy=0;P.climb=false;for(let i=0;i<8;i++)step({});
      P.x=pit*16+3;let n=0;while(!(P.fl===20)&&n++<300)step({});
      if(P.fl!==20){out.push(w+'-'+s+' 坑'+pit+' 未觸發復活');continue;}
      const x0=P.x,y0=P.y;let moved=0,jump=0,ref=0,cv=Math.abs(G.conveyor||0)*20;
      for(let i=0;i<20;i++){const fl0=P.fl;step({r:1,j:i===0||i===10});if(Math.abs(P.x-x0)>cv+0.01)moved=1;if(P.vy<-1)jump=1;if(P.fl>fl0)ref=1;}
      const xa=P.x;for(let i=0;i<5;i++)step({r:1});
      out.push(w+'-'+s+' 坑'+pit+(moved||jump||ref?' 失敗(移動'+moved+' 起跳'+jump+' 再墜'+ref+')':' OK')+(P.x>xa?'':' 解鎖後不能走')+(cv?' 傳送帶推動'+(P.x-x0).toFixed(1):''));}
    // 繩梯:第 1 大關找第一條繩梯,站上去當最後立足處,再瞬移到坑上方掉落
    HX.go(1,1);let vx=-1,vy=-1;for(let x=2;x<map.w&&vx<0;x++)for(let y=2;y<GH-2;y++)if(T(x,y)===2&&T(x,y+1)===2){vx=x;vy=y;break;}
    if(vx>=0){ens.length=0;P.x=vx*16+3;P.y=vy*16;P.climb=true;step({});const cl=P.climb;
      P.climb=false;P.y=map.h*16+40;step({});const got=P.fl===20&&P.climb;let hold=true;for(let i=0;i<20;i++){step({r:1});if(!P.climb)hold=false;}
      out.push('繩梯 '+(cl&&got&&hold?'OK(復活即抓住,20 幀內不掉)':'失敗 cl'+cl+' got'+got+' hold'+hold));}
    return out;});
  console.log(r.join('\n'));console.log('錯誤',errs.length?errs:'無');await br.close();
}
async function fshot(outp,file,opt){
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const data=await pg.evaluate(opt=>{
    if(opt)for(const kv of opt.split(',')){const [k,v]=kv.split('=');FX[k]=v;}
    const CW=208,CH=104,Z=2,sh=document.createElement('canvas');sh.width=CW*Z*4;sh.height=CH*Z*4;const sx=sh.getContext('2d');sx.imageSmoothingEnabled=false;
    const aims=[[0,0,0],[0,0,5],[1,1,0],[1,0,0]];   // [上,右,額外幀]
    for(let lv=1;lv<=4;lv++)for(let c=0;c<4;c++){const [u,r,ex]=aims[c];
      HX.go(+FX.w||3,1);HX.run(30);ens.length=0;ebul.length=0;wep='flame';wlvl=lv;P.face=1;
      K.f=1;K.u=u;K.r=r;for(let i=0;i<14+ex;i++){P.inv=999;if(r)P.x-=1.7;update();ens.length=0;ebul.length=0;render();}
      K.f=0;K.u=0;K.r=0;
      const k=cv.width/512,ox=P.x-cam.x-40,oy=P.y-cam.y-(u?78:46);
      sx.drawImage(cv,ox*k,oy*k,CW*k,CH*k,c*CW*Z,(lv-1)*CH*Z,CW*Z,CH*Z);}
    return sh.toDataURL('image/png');},opt||'');
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
    {const prep=()=>{seed(99);HX.p3();clr();};prep();run('王10 第三型態',prep);}
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
      if(ph===3)HX.p3();
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
  for(let i=0;i<A.r.log.length;i++){const [n,a]=A.r.log[i].split(':'),b=B.r.log[i].split(':')[1];const same=a===b;
    if(n.startsWith('10王')&&process.env.STRAND10!=='1'){console.log(n+' v0.22 起三段分開打(機制已授權改動),不比對舊新版;設 STRAND10=1 強制比對');continue;}
    if(!same)bad++;
    let d=-1;if(!same){const x=a.split('|'),y=b.split('|');d=x.findIndex((v,j)=>v!==y[j])*30;}
    console.log(`${n} 舊新版邏輯狀態(每 30 幀,共 1800 幀)${same?'完全相同':'不同,第 '+d+' 幀起'}`);}
  console.log(B.r.sync);for(const k in B.r.ms)console.log(k,B.r.ms[k]);if(B.r.sync.includes('NG'))bad++;
  const m=/(\d+)\/(\d+)/.exec(B.r.sync);if(m&&m[1]!==m[2])bad++;
  console.log('錯誤',[...A.errs,...B.errs].slice(0,3).join(' / ')||'無');
  if(outp){const {br,pg}=await open(fb,{width:1024,height:576});let i=0;
    for(const sc of ['slam','retract','b10','b10p3']){await pg.evaluate(sc=>{HX.go(sc==='slam'||sc==='retract'?3:10,5);HX.run(320);ebul.length=0;hazs.length=0;
      if(sc==='slam'){boss.slamPhase='center';boss.slamT=180;boss.slamTx=15*16;boss.eyeY=13*16-44;P.x=60;P.y=13*16-14;for(let i=0;i<20;i++)render();}
      if(sc==='retract'){boss.retract=-299;boss.eye=0;for(let i=0;i<6;i++)update();} // 判定消失後第 6 幀(抽回動畫進行到一半)
      if(sc==='b10p3'){HX.p3();HX.run(60);}
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
  ['命匣受擊(提燈移到旁邊)',b=>{P.x=b.x-120;b.v8=null;b.rayCd=200;b.ph[0].alive=true;b.ph[0].x=b.x-44;b.ph[0].y=b.y+10;b.hf={ph0:4};}]],
  // v0.22 10 王第 1 段:六姿勢、朝向、閃白、核心狀態(z 為揮砍範圍,t 設在生效期)
  10:[['待機朝左',b=>{P.x=b.x-120;b.vlx=b.x;b.st='';b.v10=undefined;}],['待機朝右',b=>{P.x=b.x+140;b.vlx=b.x;b.st='';b.v10=undefined;}],
  ['走路',b=>{P.x=b.x-120;b.vlx=b.x+1;b.st='';b.v10=undefined;G.t=8;}],
  ['揮砍',b=>{P.x=b.x-120;b.vlx=b.x;b.st='';const z=haz(b.x-34,b.y,36,28,10,10,'#ffe0a0','area');z.fx='b10slash';z.d=-1;z.t=z.warn+4;}],
  ['突刺',b=>{P.x=b.x-120;b.vlx=b.x;b.st='dash';b.stT=20;b.vtr=null;}],
  ['拄劍施法',b=>{P.x=b.x-120;b.vlx=b.x;b.st='';b.v10=G.t;}],
  ['受擊閃白',b=>{P.x=b.x-120;b.vlx=b.x;b.st='';b.v10=undefined;b.hf={core:4};}],
  ['核心暗灰(無敵)',b=>{P.x=b.x-120;b.vlx=b.x;b.st='';b.v10=undefined;b.invin=1;}],
  ['突刺朝右',b=>{P.x=b.x+140;b.vlx=b.x;b.st='dash';b.face=1;b.vtr=null;b.invin=0;}]]};
async function bpose(outp,w,file){
  const {br,pg,errs}=await open(file,{width:1024,height:576});
  const d=await pg.evaluate(async([w,L])=>{HX.go(w,5);HX.run(320);render();await new Promise(r=>setTimeout(r,300));HX.warm();   // v0.22:等專屬場景內嵌圖載入
    const cv=document.querySelector('canvas'),sc=cv.width/512,cw=150,ch=110,o=document.createElement('canvas');
    o.width=cw*2*3;o.height=(ch*2+24)*Math.ceil(L.length/3);const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);
    for(let i=0;i<L.length;i++){ebul.length=0;hazs.length=0;ens.length=0;const b=boss;b.x=232;b.hf=null;b.invin=0;b.vslE=undefined;eval('('+L[i][1]+')')(b);
      for(const q of[bul])q.length=0;b.vf=undefined;bossFxTick();render();
      const X=(b.x+13-cw/2),Y=(b.y+17-ch/2-6),c=i%3,r=Math.floor(i/3);
      x.drawImage(cv,X*sc,Y*sc,cw*sc,ch*sc,c*cw*2,r*(ch*2+24)+24,cw*2,ch*2);
      x.fillStyle='#fff';x.font='16px sans-serif';x.fillText(L[i][0],c*cw*2+6,r*(ch*2+24)+18);}
    return o.toDataURL().split(',')[1];},[+w,BPOSE[+w].map(([n,f])=>[n,f.toString()])]);
  fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();}

// v0.20:王關爬繩梯到頂再往旁邊走,回報落腳處;8 王另測站在新平台往上射能打到右上命匣
async function bclimb(w,col,dir,file){const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(([w,col,dir])=>{HX.go(w,5);HX.run(320);ebul.length=0;hazs.length=0;ens.length=0;
    const z=()=>{ebul.length=0;hazs.length=0;ens.length=0;if(boss){boss.cd=999;boss.rayCd=999;if(w===3&&!boss.vinesGone)boss.retract=-10;}};   // v0.21:3 王暫停觸手抽回
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

// v0.21:3 王招式特效截圖(整個畫面,2 欄)並核對招式數字:下刺範圍、彈雨卵數與彈速、光束範圍、下砸落點
async function b3fx(outp,file){const {br,pg,errs}=await open(file,{width:1024,height:576});
  await pg.evaluate(()=>{HX.go(3,5);render();});await pg.waitForTimeout(300);
  const r=await pg.evaluate(()=>{HX.go(3,5);HX.run(320);const b=boss;P.x=60;
    const cv=document.querySelector('canvas'),o=document.createElement('canvas');o.width=1024;o.height=288*6;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=lab=>{HX.warm();render();x.drawImage(cv,0,0,cv.width,cv.height,(n%2)*512,Math.floor(n/2)*288,512,288);x.fillStyle='#fff';x.font='16px sans-serif';x.fillText(lab,(n%2)*512+20,Math.floor(n/2)*288+40);n++;};
    const z0=()=>{P.inv=999;b.retract=-10;};const log={};const go=ai=>{ebul.length=0;hazs.length=0;b.eggs.length=0;b.cd=0;b.ai=ai;z0();update();};
    go(0);const z=hazs[0];log.stab=[hazs.length,z.y,z.h,z.w,z.warn,z.live];
    for(let i=1;z.t<z.warn+z.live-1;i++){z0();update();const d=z.t-z.warn;if(d===2)grab('下刺 刺到底');if(d===9)grab('下刺 停留');if(d===15)grab('下刺 收回(土石崩碎)');}
    go(1);log.eggs=b.eggs.length;for(let i=1;i<=80;i++){z0();update();if(i===40)grab('彈雨 卵在頂端鼓動');if(i===61)log.eggSpd=ebul.length+'發 vy='+ebul[0].vy+' y0='+ebul[0].y;if(i===80)grab('彈雨 落下中');}
    P.y=150;go(2);const zb=hazs[0];log.beam=[zb.x,zb.y,zb.w,zb.h,zb.warn,zb.live];
    for(let i=1;i<=zb.warn+20;i++){z0();update();if(i===zb.warn-20)grab('光束 預警');if(i===zb.warn+12)grab('光束 生效');}
    P.y=192;go(3);log.slamTx=b.slamTx;let land=0;
    for(let i=1;i<=150;i++){z0();update();if(b.slamPhase==='fall'&&!land){land=1;grab('下砸 拉出眼窩');}if(b.slamPhase==='center'&&land===1){land=2;update();update();grab('下砸 落水第 3 幀');}if(land===2&&i===land+60){}}
    for(let i=0;i<40;i++){z0();update();}b.hf={core:4};grab('下砸停留 受擊閃白');b.hf=null;
    hazs.length=0;b.slamPhase='';b.eyeY=null;b.slamTx=null;b.retract=-270;b.cd=999;for(let i=0;i<2;i++)update();b.cd=999;grab('觸手抽回預警(抽回前約 28 幀)');
    return {d:o.toDataURL().split(',')[1],log};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}

// v0.22:10 王三段分開打。逐項核對血量、特攻、暗紅傳送門、登場長度、補給、接續點、平台龜裂預警、第 3 段開場位置、擊破分數
async function b10seg(file){const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(n,ok,v)=>{o.push(`${ok?'OK':'NG'} ${n}${v!==undefined?'('+v+')':''}`);if(!ok)bad++;};
    const kill=()=>{for(const q of bossParts())if(boss.alive)bossDamage(q,1e7);};
    const toPortal=()=>{let n=0;while(G.state==='win'&&n<260){update();n++;}return n;};
    const enter=()=>{P.x=portal.x+6;P.y=portal.y+10;P.vy=0;uE=true;updatePortal();uE=false;let n=0;while(G.state==='intro'&&n<100){update();n++;}};
    resetRun();G.world=10;G.sub=5;P.lives=3;wlvl=1;startLevel();G.modal=null;G.state='play';
    const it1=items.length,snap=JSON.stringify(bossSnapshot);
    ck('第 1 段血量為原總血量 1/3',boss.max===8000,boss.max);ck('第 1 段登場 300 幀',boss.introT===300);ck('第 1 段給補給',it1>0,it1);
    HX.run(300);ck('第 1 段可用特攻',!G.noSpecial);
    const sc0=G.score;kill();ck('第 1 段打倒不給擊破分數',G.score===sc0);ck('不顯示 VICTORY(bSegMid)',bSegMid());
    let n=toPortal();ck('第 1 段傳送門為暗紅並指向第 2 段',!!portal&&portal.seg===2,'第 '+n+' 幀');
    enter();ck('進傳送門開第 2 段',boss&&boss.seg===2&&boss.alive);ck('第 2 段登場 180 幀',boss.introT===180,boss.introT);
    ck('第 2 段血條重新填滿',boss.hp===boss.max&&boss.max===8000);ck('第 2 段禁用特攻',G.noSpecial);ck('第 2 段不給補給',items.length===0,items.length);
    ck('接續點維持第 1 段',JSON.stringify(bossSnapshot)===snap);
    const bx0=boss.x,by0=boss.y;HX.run(180);update();ck('第 2 段解鎖時不瞬移',Math.abs(boss.x-bx0)<2&&Math.abs(boss.y-by0)<2,(boss.x-bx0).toFixed(2)+','+(boss.y-by0).toFixed(2));
    // 平台龜裂預警:直接觸發扇形彈那一招
    boss.cd=0;boss.ai=2;HX.run(1);const pc=boss.pc&&boss.pc.c;const solid=()=>T(pc[0],pc[1])===3;
    let keep=0;for(let i=0;i<39;i++){HX.run(1);if(solid())keep++;}const before=solid();HX.run(1);
    ck('平台龜裂 40 幀後才消失',!!pc&&keep===39&&before&&!solid(),pc?'第 '+pc[0]+'~'+pc[2]+' 欄':'無');
    kill();n=toPortal();ck('第 2 段傳送門指向第 3 段',!!portal&&portal.seg===3);
    enter();ck('第 3 段登場 180 幀',boss.seg===3&&boss.introT===180);
    const vOK=boss.vxs&&boss.vxs.length===8;HX.run(185);
    {const c=Math.floor((P.x+5)/16);ck('第 3 段主角站在左上平台(v0.22 平台隨藤蔓平移)',!P.climb&&T(c,6)===3&&Math.abs(P.y+14-6*16)<1,Math.round(P.x)+','+Math.round(P.y));}
    ck('第 3 段 8 條藤蔓',vOK);ck('第 3 段禁用特攻',G.noSpecial);
    const sc1=G.score;kill();ck('第 3 段打倒給擊破分數 5000',G.score===sc1+5000);ck('第 3 段顯示 VICTORY',!bSegMid());
    n=toPortal();ck('第 3 段為一般傳送門',!!portal&&!portal.seg);
    P.x=portal.x+6;P.y=portal.y+10;uE=true;updatePortal();uE=false;ck('進入後通關',G.state==='finish');
    // 第 3 段陣亡後接續:回到第 1 段
    resetRun();G.world=10;G.sub=5;P.lives=3;startLevel();G.modal=null;G.state='play';const lv=P.lives;
    HX.run(300);kill();toPortal();enter();HX.run(200);kill();toPortal();enter();HX.run(200);
    P.inv=0;P.lives=1;hurtPlayer();ck('第 3 段陣亡進入 GAME OVER',G.state==='over'&&G.overBoss);
    G.world=bossSnapshot.world;G.sub=bossSnapshot.sub;P.lives=bossSnapshot.lives;startBoss(1);
    ck('接續挑戰回到第 1 段',boss.seg===1&&boss.max===8000&&P.lives===lv,'命數 '+P.lives);
    return {o,bad};});
  console.log(r.o.join('\n'));console.log('錯誤',errs.length?errs.slice(0,3):'無');await br.close();return errs.length+r.bad;}

// v0.20:魔王登場與死亡逐幀截圖。intro 幀號為登場時間軸 t(0~299),die 幀號為死亡後第 n 幀;裁 [x,y,w,h] 區域放大 3 倍拼成 4 欄
async function bseq(outp,w,ins,dies,reg,file){const {br,pg,errs}=await open(file,{width:1024,height:576});
  await pg.evaluate((w)=>{HX.go(w,5);render();},+w);await pg.waitForTimeout(300);     // 先畫一幀觸發內嵌圖載入,再等載入
  const d=await pg.evaluate(([w,ins,dies,reg])=>{const [rx,ry,rw,rh]=reg,cv=document.querySelector('canvas'),sc=cv.width/512,Z=3,C=4,L=ins.length+dies.length;
    const o=document.createElement('canvas');o.width=rw*Z*C;o.height=(rh*Z+20)*Math.ceil(L/C);const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);
    let n=0;const grab=lab=>{HX.warm();render();const c=n%C,r=Math.floor(n/C);x.drawImage(cv,rx*sc,ry*sc,rw*sc,rh*sc,c*rw*Z,r*(rh*Z+20)+20,rw*Z,rh*Z);x.fillStyle='#fff';x.font='14px sans-serif';x.fillText(lab,c*rw*Z+4,r*(rh*Z+20)+15);n++;};
    for(const t of ins){HX.go(w,5);for(let i=0;i<t;i++)update();grab('登場 t='+t);}
    if(dies.length){HX.go(w,5);for(let i=0;i<300;i++)update();HX.run(30);ebul.length=0;hazs.length=0;ens.length=0;
      for(const q of bossParts())if(boss.alive)bossDamage(q,1e7);if(Array.isArray(boss.ph))for(const p of boss.ph)p.alive=false;for(const q of bossParts())if(boss.alive)bossDamage(q,1e7);
      let k=0;for(const t of dies){while(k<t){update();k++;}grab('死亡 第 '+t+' 幀');}}
    return o.toDataURL().split(',')[1];},[+w,ins,dies,reg]);
  fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();}

// v0.22:10 王第 1 段招式特效、場景與暗紅傳送門整張截圖(2×2 拼接);同時核對招式數字(範圍與時間)不變
async function b10fx(outp,file){const {br,pg,errs}=await open(file,{width:1024,height:576});
  await pg.evaluate(()=>{HX.go(10,5);render();});await pg.waitForTimeout(300);
  const r=await pg.evaluate(()=>{HX.go(10,5);HX.run(320);const b=boss,cv=document.querySelector('canvas'),L=[],o=document.createElement('canvas');
    o.width=1024*2;o.height=(576+24)*4;const x=o.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);let n=0,num={};
    const grab=lab=>{HX.warm();render();const c=n%2,rw=Math.floor(n/2);x.drawImage(cv,0,0,cv.width,cv.height,c*1024,rw*600+24,1024,576);x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(lab,c*1024+6,rw*600+18);n++;};
    const z0=()=>{ebul.length=0;hazs.length=0;ens.length=0;b.cd=9999;};
    const fresh=()=>{HX.go(10,5);HX.run(320);z0();P.inv=999;};
    fresh();P.x=120;boss.x=300;HX.run(20);grab('場景(待機)');
    fresh();P.x=120;boss.x=300;boss.ai=2;boss.cd=0;HX.run(1);const g=hazs.find(z=>z.fx==='b10fis');num.fis=g?[g.w,g.h,g.warn,g.live]:null;HX.run(g?g.warn+6:1);grab('地裂噴青焰');
    HX.run(80);ebul.forEach(q=>{});grab('火流星懸停(拄劍施法)');num.met=ebul.filter(q=>q.meteor).length;
    HX.run(40);grab('火流星落下');
    fresh();P.x=120;boss.x=300;boss.ai=0;boss.cd=0;HX.run(1);const s=hazs.find(z=>z.fx==='b10slash');num.sl=s?[s.w,s.h,s.warn,s.live]:null;HX.run(s?s.warn-8:1);grab('揮砍預警(預備動作、劍尖一閃)');HX.run(12);grab('揮砍刃光');HX.run(8);grab('揮砍收招');
    fresh();P.x=60;boss.x=300;boss.ai=0;boss.cd=0;HX.run(1);const s2=hazs.find(z=>z.fx==='b10slash');if(s2){const x0=boss.x,g0=boss.x-(s2.x+s2.w);let mv=0,xl=x0;while(hazs.includes(s2)){update();if(hazs.includes(s2))xl=boss.x;}mv=+(xl-x0).toFixed(2);num.walkSl=[mv,+g0.toFixed(2)];}   // 行進間揮砍:期間魔王位移應為 0(v0.22 授權站定),框與身體距離固定
    fresh();for(const q of bossParts())bossDamage(q,1e7);for(let i=0;i<260;i++)update();grab('暗紅傳送門(死亡後第 260 幀)');
    return {d:o.toDataURL().split(',')[1],num};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.num),'錯誤',errs.length?errs:'無');await br.close();return errs.length;}

async function b10fx2(mode,outp,file){const {br,pg,errs}=await open(file,{width:1024,height:576});   // v0.22 10 王第 2 段:mode=fx 招式特效、seq 登場與死亡
  await pg.evaluate(()=>{HX.go(10,5);startBoss(0,2);G.state='play';render();});await pg.waitForTimeout(400);
  const r=await pg.evaluate(mode=>{const cv=document.querySelector('canvas'),o=document.createElement('canvas');
    o.width=1024*2;o.height=(576+24)*4;const x=o.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);let n=0,num={};
    const grab=lab=>{HX.warm();render();const c=n%2,rw=Math.floor(n/2);x.drawImage(cv,0,0,cv.width,cv.height,c*1024,rw*600+24,1024,576);x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(lab,c*1024+6,rw*600+18);n++;};
    const seg2=()=>{HX.go(10,5);startBoss(0,2);G.state='play';};
    const fresh=()=>{seg2();HX.run(185);ebul.length=0;hazs.length=0;ens.length=0;boss.cd=9999;P.x=60;};
    if(mode==='fx'){
      fresh();HX.run(20);grab('場景(待機)');
      fresh();boss.ai=0;boss.cd=0;HX.run(1);num.ring=ebul.filter(q=>q.vk==='b10c').length;HX.run(5);grab('環狀彈:裂縫迸出光環、黑曜碎晶彈');
      fresh();boss.ai=1;boss.cd=0;HX.run(1);const z=hazs.find(q=>q.fx==='b10col');num.col=z?[hazs.length,z.w,z.h,z.warn,z.live]:null;HX.run(z?Math.round(z.warn*0.7):1);grab('縱柱預警:天頂裂縫');HX.run(z?z.warn-Math.round(z.warn*0.7)+6:1);grab('縱柱生效:青白光柱');
      fresh();boss.ai=2;boss.cd=0;HX.run(1);num.fan=ebul.filter(q=>q.vk==='b10s').length;num.pc=boss.pc?[boss.pc.t,...boss.pc.c]:null;HX.run(3);grab('扇形彈:眼縫迸紅光,平台開始龜裂');
      HX.run(30);grab('平台龜裂末期(閃爍)');HX.run(10);grab('平台消失:碎塊落下');const pc0=num.pc&&num.pc.slice(1);HX.run(60);boss.pc={c:pc0,t:40};HX.run(20);num.goneCrack=boss.pc&&T(pc0[0],pc0[1])===3?'平台仍在':'平台已消失';grab('同一座平台已消失時再被挑中:不畫龜裂');
      fresh();boss.hf={core:6};HX.run(0);grab('受擊閃白');
    }else{
      seg2();num.spawnY=P.y;let land=-1;for(let i=0;i<180;i++){HX.run(1);if(land<0&&P.onG)land=i;if(i===14)grab('登場 k=0.15:暗紅裂口、主角落下');if(i===45)grab('登場 k=0.45:碎塊由天空聚合');if(i===75)grab('登場 k=0.75');if(i===92)grab('登場 k=0.92:眼縫睜開');}
      num.land=land;num.unlockY=Math.round(P.y);
      seg2();HX.run(185);ebul.length=0;hazs.length=0;boss.cd=9999;for(const q of bossParts())bossDamage(q,1e7);
      for(let i=1;i<=230;i++){update();if(i===30)grab('死亡 30:紅裂紋爬滿');if(i===50)grab('死亡 50:崩落成碎塊');if(i===110)grab('死亡 110:紅光飄向傳送門');if(i===190)grab('死亡 190:地面裂出暗紅裂口');}
      grab('死亡後第 230 幀:暗紅傳送門');
    }
    return {d:o.toDataURL().split(',')[1],num};},mode);
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.num),'錯誤',errs.length?errs:'無');await br.close();return errs.length;}

async function b10fx3(mode,outp,file){const {br,pg,errs}=await open(file,{width:1024,height:576});   // v0.22 10 王第 3 段:mode=fx 心跳、三招子彈與藤蔓閃光、受擊閃白;seq 登場與死亡
  await pg.evaluate(()=>{HX.go(10,5);startBoss(0,3);G.state='play';render();});await pg.waitForTimeout(400);
  const r=await pg.evaluate(mode=>{const cv=document.querySelector('canvas'),o=document.createElement('canvas');
    o.width=1024*2;o.height=(576+24)*6;const x=o.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);let n=0,num={};
    const grab=lab=>{HX.warm();render();const c=n%2,rw=Math.floor(n/2);x.drawImage(cv,0,0,cv.width,cv.height,c*1024,rw*600+24,1024,576);x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(lab,c*1024+6,rw*600+18);n++;};
    const seg3=()=>{HX.go(10,5);startBoss(0,3);G.state='play';};
    const fresh=()=>{seg3();HX.run(185);ebul.length=0;hazs.length=0;ens.length=0;boss.cd=9999;};
    const per=()=>{let last=-1,ps=[];for(let i=0;i<400;i++){HX.run(1);P.inv=999;if(boss.vbp<last)ps.push(i);last=boss.vbp;}return ps.length>1?Math.round((ps[ps.length-1]-ps[0])/(ps.length-1)):0;};
    if(mode==='fx'){
      fresh();boss.vbp=0.5;HX.run(1);grab('場景與心臟(靜止)');
      fresh();boss.vbp=0.99;HX.run(2);num.beat=boss.vbp.toFixed(2);grab('強拍');
      fresh();num.per100=per();boss.hp=Math.round(boss.max*0.3);num.per30=per();boss.hp=Math.round(boss.max*0.05);num.per5=per();
      const shot=(ai,lab)=>{fresh();boss.ai=ai;boss.cd=0;HX.run(1);const B=ebul.filter(q=>q.vk==='b10h');num['b'+ai]=[B.length,B[0]&&B[0].c,B[0]&&+Math.hypot(B[0].vx,B[0].vy).toFixed(2),B[0]&&B[0].r,B[0]&&B[0].life];
        num['beat'+ai]=b10Beat(boss);num['near'+ai]=b10Near(boss).join('/');HX.run(10);grab(lab);};
      shot(0,'螺旋彈(冷青):最近 2 條藤蔓閃光、強拍');shot(1,'缺口環(淡紫)');shot(2,'瞄準扇形(粉紅)');
      fresh();boss.hf={core:6};HX.run(0);grab('受擊閃白');
    }else{
      seg3();for(let i=0;i<180;i++){HX.run(1);if(i===8)grab('登場 k=0.08:主角頭上暗紅裂口');if(i===35)grab('登場 k=0.35:藤蔓由上往下長出');if(i===70)grab('登場 k=0.70:碎片覆住心臟');if(i===88)grab('登場 k=0.88:碎片散開、第一下強拍');}
      num.unlock=boss.introT;num.ks=boss.def.strands(boss).map(q=>q.k).join(',');
      seg3();HX.run(185);ebul.length=0;hazs.length=0;boss.cd=9999;for(const q of bossParts())bossDamage(q,1e7);
      for(let i=1;i<=230;i++){update();if(i===12)grab('死亡 12:外側藤蔓斷裂閃光');if(i===40)grab('死亡 40:心臟連串小爆炸');if(i===76)grab('死亡 76:塌縮');if(i===90)grab('死亡 90:白光淡出');if(i===130)grab('死亡 130:褪成黎明前深藍');if(i===190)grab('死亡 190');}
      grab('死亡後第 230 幀');let vt=0,vs=0;for(let x=1;x<31;x++)for(let y=0;y<GH;y++)if(T(x,y)===2){if(y>=5)vt++;else vs++;}num.vineAfter='第 5 列以下可攀格 '+vt+'、殘段 '+vs;
    }
    return {d:o.toDataURL().split(',')[1],num};},mode);
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.num),'錯誤',errs.length?errs:'無');await br.close();return errs.length;}

async function b10hop(file){const {br,pg,errs}=await open(file);   // v0.22 10 王第 3 段平台(使用者 11/7):藤蔓五種平移下,三座平台的位置規則與「中央跳右方」不靠藤蔓的成功率
  const r=await pg.evaluate(()=>{const out=[];let bad=0;
    for(let sh=0;sh<=4;sh++){const mr=Math.random;Math.random=()=>(sh+0.5)/5;HX.go(10,5);startBoss(0,3);Math.random=mr;G.state='play';HX.run(185);boss.cd=1e9;
      const seg=row=>{const L=[];for(let x=1;x<31;x++)if(T(x,row)===3&&T(x-1,row)!==3){let e=x;while(T(e+1,row)===3)e++;L.push([x,e]);}return L;};
      const Lf=seg(6),M=seg(12),Rt=seg(10),v4=B10.vxs[3];
      const rule=Lf.length===1&&M.length===1&&Rt.length===1&&Lf[0][1]-Lf[0][0]===3&&M[0][1]-M[0][0]===2&&Rt[0][1]-Rt[0][0]===3&&M[0][0]+1===v4&&M[0][0]-Lf[0][1]===2&&Rt[0][0]-M[0][1]===2;
      const sp=Math.round(P.x);   // 開場點(取完登場後的位置前先記:HX.run 之後主角應仍在左上平台)
      const onL=P.onG&&Math.abs(P.y+14-6*TS)<1.5&&P.x+5>=Lf[0][0]*TS&&P.x+5<(Lf[0][1]+1)*TS;
      for(let x=1;x<31;x++)for(let y=0;y<GH;y++)if(T(x,y)===2)setT(x,y,0);   // 移除藤蔓(只看平台)
      const [c0,c1]=M[0],top=12*TS,goal=10*TS;
      const set=sx=>{P.x=sx;P.y=top-14;P.vx=0;P.vy=0;P.climb=false;ebul.length=0;for(const k in K)K[k]=0;HX.run(6);return Math.abs(P.y+14-top)<1.5;};
      const land=()=>P.onG&&Math.abs(P.y+14-goal)<1.5;
      const trial=(jd,mode)=>{let jumped=false;for(let i=0;i<200;i++){K.r=mode==='walk'||(jumped&&i>=jd)?1:0;
          K.j=(!jumped&&(mode!=='walk'||i>=jd)&&P.onG)?1:0;if(K.j)jumped=true;
          if(mode==='walk'&&!jumped&&i>=1&&!P.onG&&P.vy>0.8)return null;   // 沒跳就走出平台:不算一次嘗試
          P.inv=999;update();K.j=0;if(jumped&&i>2&&land())return 1;if(P.y>300)break;}return 0;};
      let ok=0,tot=0,zo=0,zt=0;
      for(let sx=c0*TS-5;sx<=c1*TS+11;sx++){if(!set(sx))continue;const z=sx+5>=c0*TS+19;   // z:主角中心在平台左端 19 像素以外
        const add=g=>{tot++;ok+=g;if(z){zt++;zo+=g;}};
        for(let jd=0;jd<60;jd++){set(sx);const g=trial(jd,'walk');if(g===null)break;add(g);}   // 按住右走,第 jd 幀起跳
        for(let rd=0;rd<=4;rd+=2){set(sx);add(trial(rd,'stand'));}}   // 原地起跳,rd 幀後才按右
      for(const k in K)K[k]=0;
      if(!rule||!onL||zo!==zt)bad++;
      out.push(`平移 ${sh}:左上 ${Lf[0]} 中央 ${M[0]}(第 4 根藤蔓 ${v4})右方 ${Rt[0]} 規則${rule?'OK':'NG'} 開場在左上平台${onL?'OK':'NG'} 中央跳右方:左端 19 像素外 ${zo}/${zt}${zo===zt?' OK':' NG'}、全部 ${ok}/${tot}`);}
    return {out,bad};});
  console.log(r.out.join('\n'),'\n錯誤',errs.length?errs:'無');
  await br.close();return errs.length+r.bad;}
// 5 王判定稽核(11/7):在遊戲畫面上疊出實際會扣血的範圍(紅)與實際安全範圍(綠),對照畫面上看到的東西;並統計魔王飄移範圍與衝撞位移
async function b5hit(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  const r=await pg.evaluate(()=>{HX.go(5,5);HX.run(320);const b=boss;
    const cv=document.querySelector('canvas'),CW=640,CH=360,S=CW/512,o=document.createElement('canvas');o.width=CW*2;o.height=CH*3;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const cell=()=>[(n%2)*CW,Math.floor(n/2)*CH];
    const grab=(lab,ov)=>{P.inv=0;HX.warm();render();const [ox,oy]=cell();x.drawImage(cv,0,0,cv.width,cv.height,ox,oy,CW,CH);
      x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(S,S);x.lineWidth=1/S*2;ov&&ov();x.restore();
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,26);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,ox+8,oy+18);n++;};
    const ctr=()=>[b.x+b.w/2,b.y+b.h/2];
    const band=(R,c)=>{const [cx,cy]=ctr();x.fillStyle=c;x.beginPath();x.arc(cx,cy,R+11,0,6.283);x.moveTo(cx+Math.max(0,R-11),cy);x.arc(cx,cy,Math.max(0,R-11),0,2*Math.PI,true);x.fill('evenodd');};
    const safe=p=>{const old=typeof b5Safe!=='function',cx=(p.x+p.w/2)*TS,cy=p.y*TS,r=p.w*TS/2;x.strokeStyle='#3fff6a';x.setLineDash([3,2]);x.fillStyle='rgba(63,255,106,.18)';   // v0.22 以前為長方形,v0.23 起為半圓(主角中心)
      if(old){x.strokeRect(p.x*TS-6,p.y*TS-40+7,p.w*TS+12,80);x.fillRect(p.x*TS-6,p.y*TS-40+7,p.w*TS+12,80);}else{x.beginPath();x.arc(cx,cy,r,Math.PI,0);x.closePath();x.stroke();x.fill();}x.setLineDash([]);};
    const body=()=>{x.strokeStyle='#ff3030';x.strokeRect(b.x,b.y,b.w,b.h);};
    const hold=()=>{P.inv=999;b.cd=999;};
    P.x=4*TS;P.y=12*TS-14;b.ringCd=999;b.cannonCd=999;b.cd=999;
    // 1 平時
    for(let i=0;i<5;i++){hold();update();}
    grab('1 平時:紅框=本體碰撞判定(76×60,碰到就扣血)',body);
    // 2 掃描警示
    b.ringCd=121;hold();update();for(let i=0;i<60;i++){hold();update();}
    grab('2 掃描警示:綠=主角中心在這範圍內才安全(畫面是半圓罩)',()=>{for(const i of b.shieldPlats)safe(b.plats[i]);});
    // 3 環狀掃描進行
    for(let i=0;i<60+44;i++){hold();update();}
    grab('3 環狀掃描:紅帶=主角中心落在帶內就扣血(帶寬 22)',()=>{band(b.ring,'rgba(255,40,40,.35)');for(const i of b.shieldPlats)safe(b.plats[i]);});
    for(let i=0;i<120;i++){hold();update();}
    // 4 無限大砲警示
    b.ring=-1;b.ringWarn=0;b.cannonCd=1;hold();update();for(let i=0;i<120;i++){hold();update();}
    grab('4 大砲警示:唯一安全區=新出現的黃色平台(綠)',()=>safe(b.extraPlat));
    b.cannonT=1;hold();update();for(let i=0;i<36;i++){hold();update();}
    grab('5 大砲發射:紅帶=扣血(速度 5,共兩發間隔 90 幀)',()=>{band(b.fireRing,'rgba(255,40,40,.35)');safe(b.extraPlat);});
    while(b.cannonPhase){hold();update();}
    // 6 衝撞
    b.ringCd=999;b.cannonCd=999;b.ai=1;b.cd=0;P.x=3*TS;P.y=12*TS-14;const x0=b.x,y0=b.y,tr=[];
    for(let i=0;i<36;i++){P.inv=999;update();tr.push([b.x,b.y]);}
    const ch={dx:+(b.x-x0).toFixed(1),dy:+(b.y-y0).toFixed(1)};
    grab(`6 衝撞(無預警):白線=實際 34 幀位移 dx ${ch.dx} dy ${ch.dy}`,()=>{x.strokeStyle='#fff';x.beginPath();x.moveTo(x0+b.w/2,y0+b.h/2);for(const [a,c] of tr)x.lineTo(a+b.w/2,c+b.h/2);x.stroke();x.strokeStyle='rgba(255,48,48,.6)';x.strokeRect(x0,y0,b.w,b.h);body();});
    // 統計:正常出招 20000 幀的本體 x 範圍與每次衝撞位移
    HX.go(5,5);HX.run(320);let mn=1e9,mx=-1e9;const cs=[];let lastSt='';
    for(let i=0;i<20000;i++){P.inv=999;const bx=boss.x;update();if(boss.st==='charge'&&lastSt!=='charge')cs.push(boss.cvx.toFixed(2)+'/'+boss.cvy.toFixed(2));lastSt=boss.st;mn=Math.min(mn,boss.x);mx=Math.max(mx,boss.x+boss.w);}
    return {d:o.toDataURL().split(',')[1],log:{xRange:[Math.round(mn),Math.round(mx)],charges:cs.length,sampleV:cs.slice(0,8),plats:boss.plats.length}};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}
// v0.23 5 王:fx 為場景、各招特效、登場、死亡逐格截圖(2 欄);並核對半圓防護罩判定、機身不出畫面、衝撞預兆框與實際落點、招式數字
async function b5fx(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(n,ok,v)=>{o.push(`${ok?'OK':'NG'} ${n}${v!==undefined?'('+v+')':''}`);if(!ok)bad++;};
    const cv=document.querySelector('canvas'),CW=640,CH=360,cel=document.createElement('canvas');cel.width=CW*2;cel.height=CH*10;const x=cel.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,c)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const sc=cv.width/512,q=c||[0,0,512,288];   // c:以遊戲座標裁切放大(預設整個畫面)
      x.drawImage(cv,q[0]*sc,q[1]*sc,q[2]*sc,q[3]*sc,(n%2)*CW,Math.floor(n/2)*CH,CW,CH);
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect((n%2)*CW,Math.floor(n/2)*CH,CW,24);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,(n%2)*CW+8,Math.floor(n/2)*CH+17);n++;};
    const fresh=()=>{HX.go(5,5);HX.run(320);const b=boss;b.ringCd=9999;b.cannonCd=9999;b.cd=9999;P.x=4*TS;P.y=12*TS-14;return b;};
    // 1 半圓判定(直接核對 b5Safe 與實際掃描是否扣血)
    let b=fresh();const p=b.plats[2],cx=(p.x+p.w/2)*TS,cy=p.y*TS,R=p.w*TS/2;
    const at=(X,Y)=>{P.x=X-5;P.y=Y-7;return b5Safe(p);};
    ck('站在平台正中安全',at(cx,cy-7));ck('站在邊緣仍在罩內安全',at(cx+R-2,cy-7));ck('超出罩外 1 像素不安全',!at(cx+R+1,cy-7));
    ck('平台下方不安全',!at(cx,cy+10));ck('跳高超出罩頂不安全',!at(cx,cy-R-1));
    const scan=(X,Y)=>{b=fresh();b.shieldPlats=[2];b.ring=0;let hit=0;for(let i=0;i<140;i++){P.x=X-5;P.y=Y-7;P.vy=0;P.inv=0;P.lives=5;const l=P.lives;update();if(P.lives<l)hit=1;if(b.ring<0)break;}return hit;};
    ck('掃描:罩內站著不扣血',!scan(cx,cy-7));ck('掃描:罩外平台邊緣扣血',scan(cx+R+3,cy-7));
    // 2 機身不出畫面
    let mn=1e9,mx=-1e9;for(const px_ of[20,480]){b=fresh();b.ringCd=300;b.cannonCd=520;b.cd=0;for(let i=0;i<12000;i++){P.inv=999;P.x=px_;P.y=40;P.vy=0;update();mn=Math.min(mn,b.x);mx=Math.max(mx,b.x+b.w);}}
    ck('機身水平範圍在 0~512',mn>=0&&mx<=512,Math.round(mn)+'~'+Math.round(mx));
    // 3 衝撞預兆框 vs 實際落點(主角站在左、右、下方)
    let dmax=0;for(const [X,Y] of[[60,178],[440,98],[200,130]]){b=fresh();b.ai=1;b.cd=30;let pr=null;
      let was=0;for(let i=0;i<80;i++){P.inv=999;P.x=X;P.y=Y;P.vy=0;update();if(b.cd===0&&b.st===''&&!pr)pr=b5Pred(b);   // 衝撞前一幀的預兆框
        if(was&&b.st===''){dmax=Math.max(dmax,Math.abs(pr.x-b.x),Math.abs(pr.y-b.y));break;}was=b.st==='charge';}}
    ck('預兆框與實際衝撞結束位置差 2 像素內',dmax<=2,dmax.toFixed(2));
    // 4 主角在正下方時延後衝撞(v0.23 授權):3000 幀內正下方 0 次衝撞且仍召喚;站左側照常衝撞
    const cnt=below=>{b=fresh();b.ai=0;b.cd=0;let c=0,m=0,was='',ai=b.ai;for(let i=0;i<3000;i++){P.inv=999;if(below){P.x=b.x+b.w/2-5;P.y=12*TS-14;}else{P.x=20;P.y=178;}P.vy=0;update();
      if(b.st==='charge'&&was!=='charge')c++;was=b.st;if(b.ai!==ai&&(b.ai-1)%2===0)m++;ai=b.ai;}return [c,m];};
    // 5 掃描環不會在空中停住(v0.23 修正:原本衝撞期間停 34 幀);主角左右來回讓衝撞與掃描重疊
    {b=fresh();b.ringCd=300;b.cannonCd=520;b.cd=0;let prev=-1,st=0,ov=0;for(let i=0;i<20000;i++){P.inv=999;P.x=40+((i>>9)&1)*400;P.y=178;P.vy=0;update();
      if(b.ring>=0&&prev>=0){if(b.ring===prev)st++;if(b.st==='charge')ov++;}prev=b.ring;}ck('掃描環 20000 幀內從不停住(含衝撞重疊幀)',st===0&&ov>0,'停住 '+st+' 幀、重疊 '+ov+' 幀');}
    const [c1,m1]=cnt(1),[c2,m2]=cnt(0);ck('正下方 3000 幀不衝撞、照常召喚',c1===0&&m1>=5,'衝撞 '+c1+' 召喚 '+m1);ck('站左側照常衝撞',c2>=5,'衝撞 '+c2+' 召喚 '+m2);
    // 截圖
    b=fresh();grab('平時(力場殼=碰撞範圍、推進光、浮空板推進光)');
    b.ringCd=121;update();for(let i=0;i<70;i++){P.inv=999;update();}grab('掃描警示:鏡頭亮起與紅色脈衝、光槽轉紅、六角罩');
    for(let i=0;i<95;i++){P.inv=999;update();}grab('環狀掃描:連續雷射環(光暈寬 22=判定)、光槽標出雷射掃過處');
    b=fresh();b.cannonCd=1;update();for(let i=0;i<180;i++){P.inv=999;update();}grab('大砲警示 3/4:警報色、裝甲環張開、琥珀聚能、琥珀罩與燈條');
    b.cannonT=1;update();for(let i=0;i<40;i++){P.inv=999;update();}grab('大砲發射:琥珀雷射環');
    b=fresh();b.ai=1;b.cd=12;P.x=60;P.y=178;for(let i=0;i<3;i++){P.inv=999;update();}grab('衝撞預兆:橘紅框=衝撞結束時機身位置、推進器點火');
    for(let i=0;i<30;i++){P.inv=999;update();}grab('衝撞中');
    b=fresh();b.ai=0;b.cd=4;for(let i=0;i<10;i++){P.inv=999;update();}grab('召喚:6 個艙門打開、出口迸光(放大)',[b.x-82,0,240,135]);
    b=fresh();b.hp=b.max*0.4;for(let i=0;i<40;i++){P.inv=999;update();}grab('受損 40%:2 條裂縫與火花(放大)',[b.x-82,0,240,135]);
    b=fresh();b.hp=b.max*0.2;for(let i=0;i<40;i++){P.inv=999;update();}grab('受損 20%:4 條裂縫、火花加黑煙(放大)',[b.x-82,0,240,135]);
    for(const [t,lab] of[[138,'登場 k0.18:天花板艙門開啟'],[170,'登場 k0.5:由中央艙門降下'],[204,'登場 k0.84:艙門一格格亮起'],[214,'登場 k0.94:鏡頭眼睜開']]){HX.go(5,5);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab+'(放大)',[128,0,240,135]);}
    for(const [t,lab] of[[30,'死亡 30:鏡頭過載、小爆炸、艙門熄燈脫落'],[78,'死亡 78:墜入深井'],[119,'死亡 119:落底悶響揚塵'],[132,'死亡 132:井底爆炸(火光減輕)']]){b=fresh();b.introT=0;bossDamage(bossParts()[0],1e8);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab,t<60?[b.x-82,0,240,135]:null);}
    o.push('招式數字:掃描間隔 340、預警 120、環速 3.4;大砲預警 240、環速 5、間隔 90(程式未改,見 diff)');
    return {d:cel.toDataURL().split(',')[1],o,bad};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log(r.o.join('\n'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();return r.bad+errs.length;}
// 7 王判定稽核(11/8):十二格截圖(最後兩格不疊框)疊出實際扣血範圍(紅)、預警期不扣血的範圍(黃虛線)、可站立的平台(綠),對照畫面;另跑 20000 幀統計變色順序與主角腳下平台的變化
async function b7hit(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  const r=await pg.evaluate(()=>{HX.go(7,5);HX.run(320);
    const cv=document.querySelector('canvas'),CW=640,CH=360,S=CW/512,o=document.createElement('canvas');o.width=CW*2;o.height=CH*6;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,ov)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const ox=(n%2)*CW,oy=Math.floor(n/2)*CH;x.drawImage(cv,0,0,cv.width,cv.height,ox,oy,CW,CH);
      x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(S,S);x.lineWidth=1/S*2;ov&&ov();x.restore();
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,26);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,ox+8,oy+18);n++;};
    const box=(q,c,fill,dash)=>{x.strokeStyle=c;dash&&x.setLineDash([3,2]);x.strokeRect(q.x,q.y,q.w,q.h);if(fill){x.fillStyle=fill;x.fillRect(q.x,q.y,q.w,q.h);}x.setLineDash([]);};
    const cells=(c,fill,dash)=>{for(const [cx,cy] of boss.cells)box({x:cx*TS,y:cy*TS,w:TS,h:TS},c,fill,dash);};
    const hold=()=>{P.inv=999;boss.cd=999;boss.colT=999;};   // 每次 fresh() 會換新的 boss 物件,一律讀全域 boss
    const core=()=>box({x:boss.x,y:boss.y,w:boss.w,h:boss.h},'#ff3030');
    const fresh=()=>{HX.go(7,5);HX.run(320);hazs.length=0;ebul.length=0;boss.decoys=[];boss.cd=999;boss.colT=999;P.x=4*TS;P.y=15*TS-14;return boss;};
    fresh();
    // 1 藍:平台可站
    B7.setCol(boss,1);for(let i=0;i<5;i++){hold();update();}
    grab('1 藍(安全):紅框=本體碰撞 22×22;綠=可站立平台',()=>{core();cells('#3fff6a','rgba(63,255,106,.15)');});
    // 2 紅警示
    B7.setCol(boss,0);for(let i=0;i<60;i++){hold();update();}
    grab('2 紅警示(120 幀,此時仍可站):60 幀後',()=>{core();cells('#ffd23a',null,1);});
    // 3 灼燒
    for(let i=0;i<65;i++){hold();update();}
    grab('3 灼燒:紅=碰到扣血,且不能站(會穿過去)',()=>{core();cells('#ff3030','rgba(255,40,40,.35)');});
    // 4 紫:消失
    B7.setCol(boss,2);for(let i=0;i<5;i++){hold();update();}
    grab('4 紫(消失,無預警):虛線=原平台位置,站在上面會直接掉下',()=>{core();cells('#c080ff',null,1);});
    // 5、6 紅藍光柱
    fresh();B7.setCol(boss,1);boss.ai=0;boss.cd=0;update();const zs=hazs.slice();for(let i=0;i<50;i++){hold();update();}
    grab('5 紅藍光柱預警(95 幀,不扣血):黃虛線=之後的判定 26 寬',()=>{core();for(const z of zs)box(z,'#ffd23a',null,1);});
    for(let i=0;i<55;i++){hold();update();}
    grab('6 紅藍光柱生效(90 幀):紅=扣血。藍柱也扣血',()=>{core();for(const z of zs)box(z,'#ff3030','rgba(255,40,40,.3)');});
    // 7 假結晶
    fresh();B7.setCol(boss,1);boss.ai=1;boss.cd=0;update();for(let i=0;i<20;i++){hold();update();}
    const dz=boss.decoys.map(d=>({x:d.x,y:d.y,w:22,h:22}));
    grab('7 假結晶:紅=本體(碰撞並受傷);橘=假結晶 22×22(打中扣特攻量 15%)',()=>{core();for(const q of dz)box(q,'#ffa030');});
    // 8 共鳴引爆
    {const d=boss.decoys[0];bossDamage({x:d.x,y:d.y,w:22,h:22,key:'f0'},1);}
    for(let i=0;i<60;i++){hold();update();}
    grab('8 打中假結晶後 60 幀:3 道光柱尚未出現(90 幀後才開始預警)',()=>{core();for(const q of dz)box({x:q.x,y:0,w:22,h:288},'#ffd23a',null,1);});
    // 9 12 方向彈
    fresh();B7.setCol(boss,1);boss.ai=3;boss.cd=0;update();for(let i=0;i<40;i++){hold();update();}
    grab('9 12 方向彈:紅框=子彈判定(半徑 3 的方形)',()=>{core();for(const e of ebul)box({x:e.x-e.r,y:e.y-e.r,w:e.r*2,h:e.r*2},'#ff3030');});
    // 10 方向錯亂
    fresh();B7.setCol(boss,1);boss.ai=2;boss.cd=0;update();for(let i=0;i<30;i++){hold();update();}
    grab(`10 方向錯亂:左右鍵對調 ${G.invertT+30} 幀;畫面只有 70 幀字幕`,()=>{core();box(playerBox(),'#c080ff');});
    // 11、12 不疊框的原始畫面:紫接紅的警示期(平台此時是空格)、灼燒格(第 7 關灼燒面材質 K2)
    fresh();B7.setCol(boss,2);B7.setCol(boss,0);for(let i=0;i<16;i++){hold();update();}
    grab('11 原畫面:紫接紅的警示期,平台看不見,只有閃紅的那 8 幀出現');
    for(let i=0;i<110;i++){hold();update();}
    grab('12 原畫面:灼燒中(會穿過、碰到扣血)');
    // 統計:正常出招 20000 幀(主角無敵,站在中央平台上)
    HX.go(7,5);HX.run(320);const B=boss,seq=[],tr={};let prev=B.col,fallP=0,burnStand=0,colorChg=0,lastT=B.colT;let onPlat=0;
    for(let i=0;i<20000;i++){P.inv=999;P.lives=5;if(i%600===0){P.x=15*TS;P.y=10*TS-14;P.vy=0;}
      const wasOn=P.onG&&P.y<10*TS;const c0=B.col;update();
      if(B.col!==c0||B.colT===240){colorChg++;const k=c0+'>'+B.col;tr[k]=(tr[k]||0)+1;if(seq.length<24)seq.push(B.col);
        if(B.col===2&&wasOn)fallP++;}
      if(wasOn&&T(Math.floor((P.x+5)/TS),10)===5)burnStand++;}
    const nm=['紅','藍','紫'],trn={};for(const k in tr)trn[k.split('>').map(v=>nm[v]).join('→')]=tr[k];
    return {d:o.toDataURL().split(',')[1],log:{變色次數:colorChg,轉換:trn,前24次:seq.map(v=>nm[v]).join(''),紫色時主角正站在平台上:fallP,站在灼燒格上的幀數:burnStand}};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}
// 1 王判定稽核(11/9):紅=扣血、黃虛線=預警期不扣血、藍=裝甲板(可打)、橘=核心、灰虛線=本體範圍(不扣血);另統計砲彈消失高度、無人機同時數量
async function b1hit(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  const r=await pg.evaluate(()=>{HX.go(1,5);HX.run(320);
    const cv=document.querySelector('canvas'),CW=640,CH=360,S=CW/512,o=document.createElement('canvas');o.width=CW*2;o.height=CH*4;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,ov)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const ox=(n%2)*CW,oy=Math.floor(n/2)*CH;x.drawImage(cv,0,0,cv.width,cv.height,ox,oy,CW,CH);
      x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(S,S);x.lineWidth=1/S*2;ov&&ov();x.restore();
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,26);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,ox+8,oy+18);n++;};
    const box=(q,c,fill,dash)=>{x.strokeStyle=c;dash&&x.setLineDash([3,2]);x.strokeRect(q.x,q.y,q.w,q.h);if(fill){x.fillStyle=fill;x.fillRect(q.x,q.y,q.w,q.h);}x.setLineDash([]);};
    const parts=()=>{box({x:boss.x,y:boss.y,w:boss.w,h:boss.h},'#a0a0a0',null,1);for(const p of bossParts())box(p,p.key==='core'?'#ffa030':'#40b0ff');};
    const vines=()=>{for(let ty=0;ty<GH;ty++)for(let tx=0;tx<32;tx++){const t=T(tx,ty);if(t===2)box({x:tx*TS,y:ty*TS,w:TS,h:TS},'#3fff6a',null,1);if(t===3)box({x:tx*TS,y:ty*TS,w:TS,h:4},'#3fff6a','rgba(63,255,106,.2)');}};
    const hold=()=>{P.inv=999;boss.cd=999;};
    const fresh=()=>{HX.go(1,5);HX.run(320);hazs.length=0;ebul.length=0;ens.length=0;boss.cd=999;P.x=4*TS;P.y=13*TS-14;};
    fresh();for(let i=0;i<5;i++){hold();update();}
    grab('1 平時:藍=裝甲板 36×26、橘=核心 40×40;灰虛線=本體(碰到不扣血);綠=繩梯與平台',()=>{parts();vines();});
    fresh();boss.ai=0;boss.cd=0;update();let zs=hazs.slice();for(let i=0;i<60;i++){hold();update();}
    grab(`2 電流條預警(${zs[0].warn} 幀,不扣血):黃虛線=之後的判定`,()=>{parts();for(const z of zs)box(z,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-60+20;i++){hold();update();}
    grab(`3 電流條生效(${zs[0].live} 幀):紅=扣血(地面上 12 像素高,全寬)`,()=>{parts();for(const z of zs)box(z,'#ff3030','rgba(255,40,40,.35)');});
    fresh();boss.ai=1;boss.cd=0;update();const trail=[];let last=[];
    for(let i=0;i<59;i++){hold();update();for(const e of ebul)trail.push([e.x,e.y]);last=ebul.map(e=>({x:e.x,y:e.y,r:e.r}));}
    grab('4 迫擊砲彈:紅點=飛行軌跡(碰到扣血)、紅框=砲彈判定;砲彈在這個高度消失',()=>{parts();x.fillStyle='#ff3030';for(const [a,b] of trail)x.fillRect(a-.5,b-.5,1,1);for(const e of last)box({x:e.x-e.r,y:e.y-e.r,w:e.r*2,h:e.r*2},'#ff3030');});
    hold();update();hold();update();zs=hazs.slice();
    grab(`5 砲彈消失那一幀:地面火圈預警(${zs[0]?zs[0].warn:'?'} 幀,黃虛線)`,()=>{parts();for(const z of zs)box(z,'#ffd23a',null,1);for(const e of last)box({x:e.x-e.r,y:e.y-e.r,w:e.r*2,h:e.r*2},'#ff3030',null,1);});
    for(let i=0;i<40;i++){hold();update();}
    grab(`6 火圈生效(${zs[0]?zs[0].live:'?'} 幀):紅=扣血 40×14`,()=>{parts();for(const z of zs)box(z,'#ff3030','rgba(255,40,40,.35)');});
    fresh();boss.ai=2;boss.cd=0;update();for(let i=0;i<30;i++){hold();update();}
    grab('7 召喚無人機:紅=無人機判定(碰到扣血)',()=>{parts();for(const e of ens)box(e,'#ff3030');});
    fresh();boss.plates=[0,0,0];for(let i=0;i<5;i++){hold();update();}
    grab('8 裝甲全破:核心全額受傷,480 幀後三片裝甲同時復原(目前沒有預兆)',()=>{parts();});
    // 統計 20000 幀(主角無敵站在左方地面)
    HX.go(1,5);HX.run(320);let vy=[],maxD=0,wall=0,maxE=0,fires=0,onPlat=0;const seen=new Set();
    for(let i=0;i<20000;i++){P.inv=999;P.lives=5;const before=ebul.filter(e=>e.mortar).map(e=>({e,x:e.x,y:e.y,t:e.t,l:e.life}));const hz0=hazs.length;update();
      for(const q of before)if(!ebul.includes(q.e)){if(q.t+1>=q.l){vy.push(Math.round(q.y));fires++;}else wall++;}
      maxD=Math.max(maxD,ens.filter(e=>e.type==='drone').length);}
    vy.sort((a,b)=>a-b);
    return {d:o.toDataURL().split(',')[1],log:{砲彈正常消失次數:fires,撞牆或命中提早消失:wall,消失高度範圍:[vy[0],vy[vy.length-1]],地表:13*TS,同時最多無人機:maxD,魔王血量:boss.max,裝甲每片:1400}};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}
// 9 王判定稽核(11/10,v0.25 舊版行為):十格截圖疊出本體範圍(灰虛線,碰到不扣血)、核心(橘)、實際實心格(青)、繩梯與平台(綠)、坑洞(紫)、各招扣血範圍與軌跡;另印出艦體翻轉、傳送帶、坑洞的統計
async function b9hit(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  const r=await pg.evaluate(()=>{HX.go(9,5);HX.run(320);
    const cv=document.querySelector('canvas'),CW=640,CH=360,S=CW/512,o=document.createElement('canvas');o.width=CW*2;o.height=CH*5;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,ov)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const ox=(n%2)*CW,oy=Math.floor(n/2)*CH;x.drawImage(cv,0,0,cv.width,cv.height,ox,oy,CW,CH);
      x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(S,S);x.lineWidth=1/S*2;ov&&ov();x.restore();
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,26);x.fillStyle='#fff';x.font='14px sans-serif';x.fillText(lab,ox+8,oy+18);n++;};
    const box=(q,c,fill,dash)=>{x.strokeStyle=c;dash&&x.setLineDash([3,2]);x.strokeRect(q.x,q.y,q.w,q.h);if(fill){x.fillStyle=fill;x.fillRect(q.x,q.y,q.w,q.h);}x.setLineDash([]);};
    const parts=()=>{box({x:boss.x,y:boss.y,w:boss.w,h:boss.h},'#a0a0a0',null,1);for(const p of bossParts())box(p,'#ffa030');};
    const tiles=()=>{for(let ty=0;ty<GH;ty++)for(let tx=0;tx<32;tx++){const t=T(tx,ty);if(t===1&&ty===14)box({x:tx*TS,y:ty*TS,w:TS,h:4},'#40e0ff','rgba(64,224,255,.25)');if(t===2)box({x:tx*TS,y:ty*TS,w:TS,h:TS},'#3fff6a',null,1);if(t===3)box({x:tx*TS,y:ty*TS,w:TS,h:4},'#3fff6a','rgba(63,255,106,.2)');}
      for(let tx=1;tx<31;tx++)if(T(tx,14)===0)box({x:tx*TS,y:14*TS,w:TS,h:64},'#c060ff','rgba(192,96,255,.25)');};
    const hold=()=>{P.inv=999;boss.cd=999;};
    const fresh=()=>{HX.go(9,5);HX.run(320);hazs.length=0;ebul.length=0;boss.cd=999;boss.lockT=0;P.x=3*TS;P.y=14*TS-14;};
    const trail=(k,pick)=>{const tr=[];for(let i=0;i<k;i++){hold();update();for(const e of ebul)tr.push([e.x,e.y,e.r]);}return tr;};
    const dots=(tr,c)=>{x.fillStyle=c;for(const [a,b] of tr)x.fillRect(a-.5,b-.5,1,1);};
    fresh();for(let i=0;i<5;i++){hold();update();}
    grab('1 平時:灰虛線=本體 150×120(碰到不扣血)、橘=核心 60×60;青=實心地面;紫=坑洞(掉下扣血);綠=繩梯與平台',()=>{parts();tiles();});
    fresh();boss.ai=0;boss.cd=0;update();let tr=trail(70);
    grab('2 五向扇形彈(r=3):紅點=軌跡,由核心中央朝主角',()=>{parts();dots(tr,'#ff3030');});
    fresh();P.y=8*TS-14;P.x=15*TS;boss.ai=1;boss.cd=0;update();let zs=hazs.slice();for(let i=0;i<40;i++){hold();update();}
    grab(`3 橫向光束預警(${zs[0].warn} 幀,不扣血):黃虛線=之後的判定,4 條全寬 22 高,1 條對準主角高度`,()=>{parts();for(const z of zs)box(z,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-40+10;i++){hold();update();}
    grab(`4 橫向光束生效(${zs[0].live} 幀):紅=扣血`,()=>{parts();for(const z of zs)box(z,'#ff3030','rgba(255,40,40,.3)');});
    fresh();P.x=8*TS;boss.ai=2;boss.cd=0;update();tr=trail(80);
    grab('5 兩側齊射(各 3 發 r=3):紅點=軌跡,發射點在本體左下與右下',()=>{parts();dots(tr,'#ff3030');});
    fresh();P.x=10*TS;boss.ai=3;boss.cd=0;update();const lk=[];for(let i=0;i<118;i++){hold();P.x=10*TS+Math.round(40*Math.sin(i/14));update();lk.push([boss.lockX,boss.lockY]);}
    grab('6 狙擊鎖定 120 幀:黃點=準星追著主角的路徑(準星本身不扣血)',()=>{parts();x.fillStyle='#ffd23a';for(const [a,b] of lk)x.fillRect(a-.5,b-.5,1,1);});
    tr=trail(30);grab('7 狙擊彈(r=4,速度約 11.6):紅點=軌跡',()=>{parts();dots(tr,'#ff3030');});
    fresh();for(let i=0;i<5;i++){hold();update();}grab('8 艦體翻轉前',()=>{parts();tiles();});
    boss.ai=4;boss.cd=0;update();for(let i=0;i<20;i++){hold();update();}
    grab('9 艦體翻轉後 20 幀:地形左右鏡像(青、紫、綠=實際判定),畫面上的地面沒有跟著變',()=>{parts();tiles();});
    grab('10 同上,不疊框的原畫面',null);
    // 統計:傳送帶、坑洞、翻轉
    const fallT=(x0)=>{HX.go(9,5);HX.run(320);boss.cd=9999;P.x=x0;P.y=14*TS-14;P.vy=0;for(let i=0;i<600;i++){P.inv=999;boss.cd=9999;update();if(P.y>14*TS)return i+1;if(P.x<=16)return '撞左牆';}return '未掉落';};
    HX.go(9,5);HX.run(320);let flips=0,overPit=0,climbDrop=0;const d0=map.d.slice();
    for(let i=0;i<20000;i++){P.inv=999;P.lives=5;const a=boss.ai,c=boss.cd,cl=P.climb;update();if(c===0&&(a%5)===4){flips++;if(P.onG===false&&P.y<14*TS){}const cx=Math.floor((P.x+5)/TS);if(T(cx,14)===0&&P.y+P.h<=14*TS+1)overPit++;if(cl)climbDrop++;}}
    return {d:o.toDataURL().split(',')[1],log:{傳送帶每幀:-0.84,主角走速:1.7,從坑右緣靜止滑落幀數:fallT(8*TS),從第3欄靜止:fallT(3*TS),'20000幀翻轉次數':flips,翻轉時主角正下方變成坑:overPit,翻轉時正在攀爬被甩下:climbDrop,翻轉間隔幀:(120+130+110+170+200)*BOSS_CD_MULT,魔王血量:boss.max}};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}
// 4 王判定稽核(11/11,v0.26 舊版行為):十二格截圖疊出本體範圍(灰虛線,碰到不扣血)、蛇頭(橘=受傷部件,同時是碰撞扣血範圍)、繩梯與平台(綠)、
// 沿層推進、鎖定範圍、骨石落下的預警(黃虛線)與生效(紅)、骨影閃瞬隱身與四個現身位置、上層崩毀;另印出 20000 幀內的統計
async function b4hit(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  const r=await pg.evaluate(()=>{HX.go(4,5);HX.run(320);
    const cv=document.querySelector('canvas'),CW=640,CH=360,S=CW/512,o=document.createElement('canvas');o.width=CW*2;o.height=CH*6;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,ov)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const ox=(n%2)*CW,oy=Math.floor(n/2)*CH;x.drawImage(cv,0,0,cv.width,cv.height,ox,oy,CW,CH);
      x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(S,S);x.lineWidth=1/S*2;ov&&ov();x.restore();
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,26);x.fillStyle='#fff';x.font='14px sans-serif';x.fillText(lab,ox+8,oy+18);n++;};
    const box=(q,c,fill,dash)=>{x.strokeStyle=c;dash&&x.setLineDash([3,2]);x.strokeRect(q.x,q.y,q.w,q.h);if(fill){x.fillStyle=fill;x.fillRect(q.x,q.y,q.w,q.h);}x.setLineDash([]);};
    const parts=()=>{box({x:boss.x,y:boss.y,w:boss.w,h:boss.h},'#a0a0a0',null,1);for(const p of bossParts())box(p,'#ffa030','rgba(255,160,48,.2)');};
    const tiles=()=>{for(let ty=0;ty<GH;ty++)for(let tx=0;tx<32;tx++){const t=T(tx,ty);if(t===2)box({x:tx*TS,y:ty*TS,w:TS,h:TS},'#3fff6a',null,1);if(t===3)box({x:tx*TS,y:ty*TS,w:TS,h:4},'#3fff6a','rgba(63,255,106,.2)');}};
    const hold=()=>{P.inv=999;boss.cd=999;};
    const fresh=()=>{HX.go(4,5);HX.run(320);hazs.length=0;ebul.length=0;boss.cd=999;boss.lockT=0;P.x=10*TS;P.y=14*TS-14;};
    const zb=(zs,c,f,d)=>{for(const z of zs)box(z,c,f,d);};
    fresh();for(let i=0;i<5;i++){hold();update();}
    grab('1 平時:灰虛線=本體 150×120(碰到不扣血);橘=蛇頭 46×34(唯一受傷部件,碰到也扣血);綠=繩梯與平台',()=>{parts();tiles();});
    fresh();P.y=9*TS-14;P.x=8*TS;boss.ai=0;boss.cd=0;update();let zs=hazs.slice();for(let i=0;i<30;i++){hold();update();}
    grab(`2 沿層推進預警(${zs[0].warn} 幀):黃虛線=判定 64×24,停在 x=-60 畫面外,只露出 4 像素`,()=>{parts();zb(zs,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-30+45;i++){hold();update();}
    grab(`3 沿層推進生效(${zs[0].live} 幀,每幀往右 3.3):紅=扣血,三層隨機一層,穿過整個畫面與魔王`,()=>{parts();zb(zs,'#ff3030','rgba(255,40,40,.35)');});
    fresh();P.x=12*TS;boss.ai=1;boss.cd=0;update();zs=hazs.slice();for(let i=0;i<30;i++){hold();update();}
    grab(`4 鎖定範圍預警(${zs[0].warn} 幀):黃虛線=87×45,以發動時主角位置為中心,之後不跟`,()=>{parts();zb(zs,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-30+5;i++){hold();update();}
    grab(`5 鎖定範圍生效(只有 ${zs[0].live} 幀):紅=扣血`,()=>{parts();zb(zs,'#ff3030','rgba(255,40,40,.35)');});
    fresh();boss.ai=2;boss.cd=0;update();zs=hazs.slice();for(let i=0;i<30;i++){hold();update();}
    grab(`6 骨石落下預警(${zs[0].warn} 幀):6 條 16 寬,從畫面頂到地面,穿過平台(平台擋不住)`,()=>{parts();tiles();zb(zs,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-30+5;i++){hold();update();}
    grab(`7 骨石落下生效(${zs[0].live} 幀):紅=扣血(整條同時生效,不是由上往下落)`,()=>{parts();zb(zs,'#ff3030','rgba(255,40,40,.35)');});
    fresh();boss.hp=boss.max*0.29;hold();boss.cd=0;update();const tg=boss.flashTarget;for(let i=0;i<60;i++){hold();update();}
    grab(`8 骨影閃瞬隱身(180 幀,招式暫停,沒有判定):只有字幕「→ ${tg.label}」,黃虛線=現身後蛇頭位置`,()=>{tiles();box({x:tg.x+40,y:tg.hy,w:46,h:34},'#ffd23a',null,1);});
    const POS=[{x:402,hy:8,label:'右上'},{x:402,hy:14*TS-30,label:'右下'},{x:-16,hy:8,label:'左上'},{x:-16,hy:14*TS-30,label:'左下'}];
    for(const k of [2,3,1]){fresh();boss.hp=boss.max*0.29;hold();boss.cd=0;update();boss.flashTarget=POS[k];boss.flashT=1;hold();update();for(let i=0;i<3;i++){hold();update();}
      grab(`${9+[2,3,1].indexOf(k)} 現身於${POS[k].label}:本體框 x=${boss.x},蛇頭碰撞即時生效(定住 90 幀後再追主角高度)`,()=>{parts();tiles();});}
    fresh();boss.hp=boss.max*0.49;hold();update();for(let i=0;i<5;i++){hold();update();}
    grab('12 血量 50%:上層平台(第 5 列)瞬間消失,站在上面的主角直接掉落',()=>{parts();tiles();});
    // 統計(主角無敵站在中央地面)
    HX.go(4,5);HX.run(320);let vol=0,dupCol=0,adj=0,waveL={},headMin=999,headMax=-999,pY=[];
    for(let i=0;i<20000;i++){P.inv=999;P.lives=5;const h0=hazs.length,c=boss.cd,a=boss.ai;update();
      if(c===0&&a%3===2){vol++;const xs=hazs.slice(h0).map(z=>z.x).sort((p,q)=>p-q);for(let j=1;j<xs.length;j++){if(xs[j]===xs[j-1])dupCol++;else if(xs[j]-xs[j-1]===TS)adj++;}}
      if(c===0&&a%3===0){const z=hazs[hazs.length-1];waveL[z.y]=(waveL[z.y]||0)+1;}
      headMin=Math.min(headMin,boss.headY);headMax=Math.max(headMax,boss.headY);}
    return {d:o.toDataURL().split(',')[1],log:{魔王血量:boss.max,骨石齊落次數:vol,同一欄重複:dupCol,相鄰兩欄:adj,沿層推進各層次數:waveL,蛇頭y範圍:[Math.round(headMin),Math.round(headMax)],
      預警幀:{沿層:Math.round(40*1.7)+10,鎖定:Math.round(34*1.7)+10,骨石:Math.round(36*1.7)+10},招式間隔幀:[150,110,140].map(v=>Math.round(v*BOSS_CD_MULT))}};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}
// 6 王判定稽核(11/12,v0.27 舊版行為):十二格截圖加統計(招式預警幀、衝刺中掉頭、骷髏累積、詠嘆者平台可達性、各位置打不打得到詠嘆者)
async function b6hit(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  const r=await pg.evaluate(()=>{HX.go(6,5);HX.run(320);
    const cv=document.querySelector('canvas'),CW=640,CH=360,S=CW/512,o=document.createElement('canvas');o.width=CW*2;o.height=CH*6;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,ov)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const ox=(n%2)*CW,oy=Math.floor(n/2)*CH;x.drawImage(cv,0,0,cv.width,cv.height,ox,oy,CW,CH);
      x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(S,S);x.lineWidth=1/S*2;ov&&ov();x.restore();
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,26);x.fillStyle='#fff';x.font='14px sans-serif';x.fillText(lab,ox+8,oy+18);n++;};
    const box=(q,c,fill,dash)=>{x.strokeStyle=c;dash&&x.setLineDash([3,2]);x.strokeRect(q.x,q.y,q.w,q.h);if(fill){x.fillStyle=fill;x.fillRect(q.x,q.y,q.w,q.h);}x.setLineDash([]);};
    const parts=()=>{for(const p of bossParts())box(p,p.key==='k'?'#ffa030':'#40e0ff',p.key==='k'?'rgba(255,160,48,.2)':'rgba(64,224,255,.2)');};
    const tiles=()=>{for(let ty=0;ty<GH;ty++)for(let tx=0;tx<32;tx++){const t=T(tx,ty);if(t===2)box({x:tx*TS,y:ty*TS,w:TS,h:TS},'#3fff6a',null,1);if(t===3)box({x:tx*TS,y:ty*TS,w:TS,h:4},'#3fff6a','rgba(63,255,106,.2)');}};
    const hold=()=>{P.inv=999;boss.kcd=999;boss.ccd=999;};
    const fresh=()=>{HX.go(6,5);HX.run(320);hazs.length=0;ebul.length=0;boss.kcd=999;boss.ccd=999;P.x=13*TS;P.y=14*TS-14;boss.x=300;};
    const zb=(zs,c,f,d)=>{for(const z of zs)box(z,c,f,d);};
    // 抽到指定騎士招式為止(招式為亂數):0 揮砍(寬 36)、1 衝刺、2 橫掃(寬 90)
    const kmove=want=>{for(let k=0;k<200;k++){fresh();boss.lastK=-1;boss.kcd=0;update();const z=hazs[hazs.length-1];const got=boss.st==='dash'?1:z&&z.w===36?0:z&&z.w===90?2:-1;if(got===want)return;}};
    const cmove=want=>{for(let k=0;k<200;k++){fresh();boss.ccd=0;update();const z=hazs[hazs.length-1];const got=boss.zap>0?2:z&&z.k==='ground'?0:z&&z.k==='beam'?1:-1;if(got===want)return;}};
    fresh();for(let i=0;i<5;i++){hold();update();}
    grab('1 平時:橘=騎士 22×30(碰到不扣血,只有衝刺中扣);青=詠嘆者 18×26(不動,碰到不扣血);綠=繩梯與平台',()=>{parts();tiles();});
    kmove(0);let zs=hazs.slice();for(let i=0;i<20;i++){hold();update();}
    grab(`2 騎士揮砍預警(${zs[0].warn} 幀;狂化 ${Math.round(Math.round(14/1.4)*1.7)+10}):黃虛線=36×26,發動時貼在身前後固定,騎士照常往前走`,()=>{parts();zb(zs,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-20+4;i++){hold();update();}
    grab(`3 騎士揮砍生效(${zs[0].live} 幀):紅=扣血`,()=>{parts();zb(zs,'#ff3030','rgba(255,40,40,.35)');});
    kmove(2);zs=hazs.slice();for(let i=0;i<20;i++){hold();update();}
    grab(`4 騎士橫掃預警(${zs[0].warn} 幀;狂化 ${Math.round(Math.round(20/1.4)*1.7)+10}):黃虛線=90×36,以發動時騎士為中心後固定`,()=>{parts();zb(zs,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-20+4;i++){hold();update();}
    grab(`5 騎士橫掃生效(${zs[0].live} 幀):紅=扣血`,()=>{parts();zb(zs,'#ff3030','rgba(255,40,40,.35)');});
    kmove(1);const d0=boss.x-boss.face*3;const tr=[{x:boss.x,y:boss.y,w:22,h:30}];while(boss.st==='dash'){hold();update();tr.push({x:boss.x,y:boss.y,w:22,h:30});}
    grab(`6 騎士衝刺(沒有預警,抽到當幀就動):${tr.length} 幀、位移 ${Math.round(Math.abs(boss.x-d0))} 像素(狂化 ×1.4),紅=衝刺中身體扣血的範圍`,()=>{zb(tr,'#ff3030','rgba(255,40,40,.08)');parts();});
    cmove(0);zs=hazs.slice();const g0=zs[0].x;for(let i=0;i<40;i++){hold();update();}P.x+=90;for(let i=0;i<40;i++){hold();update();}
    grab(`7 詠嘆者地面圈預警(${zs[0].warn} 幀):黃虛線=34×16,預警期間追著主角(每幀最多 2 像素);白虛線=發動位置`,()=>{parts();box({x:g0,y:zs[0].y,w:34,h:16},'#ffffff',null,1);zb(zs,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-80+6;i++){hold();update();}
    grab(`8 地面圈生效(${zs[0].live} 幀):紅=扣血,生效後不再追`,()=>{parts();zb(zs,'#ff3030','rgba(255,40,40,.35)');});
    cmove(1);zs=hazs.slice();for(let i=0;i<30;i++){hold();update();}
    grab(`9 詠嘆者縱柱預警(${zs[0].warn} 幀):黃虛線=24 寬,畫面頂到地面,穿過平台,位置固定`,()=>{parts();tiles();zb(zs,'#ffd23a',null,1);});
    for(let i=0;i<zs[0].warn-30+6;i++){hold();update();}
    grab(`10 縱柱生效(${zs[0].live} 幀):紅=扣血`,()=>{parts();zb(zs,'#ff3030','rgba(255,40,40,.35)');});
    cmove(2);for(let i=0;i<30;i++){hold();update();}
    grab(`11 「繩索通電」:兩條繩梯當幀消失 ${boss.zap+30} 幀,沒有預警,攀爬中直接掉落;只有字幕`,()=>{parts();tiles();});
    fresh();boss.kh=0;let mx=0;for(let i=0;i<1500;i++){hold();update();mx=Math.max(mx,ens.length);}
    grab(`12 騎士先死:詠嘆者每 90 幀召喚 1 隻骷髏,沒有上限(1500 幀不開槍累積 ${ens.length} 隻)`,()=>{parts();for(const e of ens)box(e,'#ff3030',null);});
    // 統計 1:衝刺中掉頭(主角在騎士左右來回跳)
    HX.go(6,5);HX.run(320);let dash=0,flip=0,pf=0,inD=0,skMax=0;
    for(let i=0;i<20000;i++){P.inv=999;P.lives=5;boss.ccd=999;K.l=(i%160<80)?1:0;K.r=K.l?0:1;K.j=i%40<12?1:0;update();
      if(boss.st==='dash'){if(!inD){dash++;inD=1;}else if(boss.face!==pf)flip++;pf=boss.face;}else inD=0;}
    K.l=K.r=K.j=0;
    HX.go(6,5);HX.run(320);boss.kh=0;for(let i=0;i<20000;i++){P.inv=999;P.lives=5;update();skMax=Math.max(skMax,ens.length);}
    // 統計 2:從右繩梯(第 17 欄)各高度往右跳,能否站上詠嘆者平台(第 7 列第 21~29 欄,頂面 y=112)
    const reach=[];for(let y0=24;y0<=200;y0+=8)for(const jh of [1,6,20]){fresh();P.x=17*16+3;P.y=y0;P.vy=0;K.u=1;hold();HX.run(2);K.u=0;hold();HX.run(1);if(!P.climb)continue;
      K.r=1;K.j=1;let ok=0;for(let i=0;i<80;i++){if(i===jh)K.j=0;hold();boss.x=-300;HX.run(1);if(P.onG&&Math.abs(P.y+14-112)<1)ok=1;}K.r=K.j=0;if(ok)reach.push('y'+y0+'/按跳'+jh);}
    // 統計 3:各位置各射向 90 幀內能否打到詠嘆者(衝鋒槍 Lv1;騎士移出畫面)
    const shoot={};const tryS=(lab,px,py,keys,climb)=>{fresh();wep='smg';wlvl=1;P.x=px;P.y=py;P.vy=0;K.l=K.r=K.u=K.j=K.f=0;
      if(climb){K.u=1;hold();HX.run(2);K.u=0;}for(let i=0;i<8;i++){hold();boss.x=-300;HX.run(1);}
      const c0=boss.ch;for(const k of keys)K[k]=1;K.f=1;for(let i=0;i<90;i++){hold();boss.x=-300;if(!climb&&keys.includes('r')&&!keys.includes('u')&&0)P.x=px;HX.run(1);}K.l=K.r=K.u=K.f=0;
      (shoot[lab]=shoot[lab]||[]).push(Math.round(px)+':'+(boss.ch<c0?'中':'x'));};
    for(let px=40;px<=480;px+=40){tryS('地面 正上',px,14*16-14,['u']);tryS('地面 右上斜',px,14*16-14,['u','r']);tryS('地面 左上斜',px,14*16-14,['u','l']);tryS('地面 平射右',px,14*16-14,['r']);}
    for(let px=70;px<=170;px+=50){tryS('左平台 平射右',px,10*16-14,['r']);tryS('左平台 右上斜',px,10*16-14,['u','r']);}
    for(const py of [40,72,88,104,136])tryS('右繩梯 y'+py+' 平射右',17*16+3,py,['r'],1);
    HX.go(6,5);HX.run(320);
    return {d:o.toDataURL().split(',')[1],log:{魔王血量:boss.max,騎士血:boss.kMax,詠嘆者血:boss.cMax,詠嘆者位置:[boss.cx,boss.cy],
      衝刺次數:dash,衝刺中掉頭幀數:flip,騎士死後20000幀骷髏最多:skMax,右繩梯跳上詠嘆者平台:reach.length?reach:'全部失敗',打得到詠嘆者:shoot}};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log('已存',outp,JSON.stringify(r.log),'錯誤',errs.length?errs:'無');await br.close();}
// v0.27 4 王:核對授權(上層橋第 6~18 欄、左繩梯移到第 5 欄第 5~8 列、上層崩毀龜裂 40 幀)與招式數字;場景、各招特效、閃瞬、左右鏡像、登場、死亡逐格截圖(2 欄)
// v0.28 6 王:核對五項授權與招式數字不變,並截場景、兩種騎士外觀、各招預警與生效、繩索隱形、骷髏出現、受損、先死者短演出、登場、最後死亡
async function b6fx(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  await pg.evaluate(async()=>{HX.go(6,5);HX.run(130,true);await new Promise(ok=>setTimeout(ok,600));});   // 內嵌圖非同步載入
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(n,ok,v)=>{o.push((ok?'OK':'NG')+' '+n+(v!==undefined?'('+v+')':''));if(!ok)bad++;};
    const cv=document.querySelector('canvas'),CW=640,CH=360,cel=document.createElement('canvas');cel.width=CW*2;cel.height=CH*24;const x=cel.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,c,ov)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const sc=cv.width/512,q=c||[0,0,512,288],ox=(n%2)*CW,oy=Math.floor(n/2)*CH;
      x.drawImage(cv,q[0]*sc,q[1]*sc,q[2]*sc,q[3]*sc,ox,oy,CW,CH);
      if(ov){x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(CW/q[2],CH/q[3]);x.translate(-q[0],-q[1]);x.lineWidth=1;ov();x.restore();}
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,24);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,ox+8,oy+17);n++;};
    const box=(q,c,d)=>{x.strokeStyle=c;d&&x.setLineDash([3,2]);x.strokeRect(q.x+.5,q.y+.5,q.w-1,q.h-1);x.setLineDash([]);};
    const ovl=()=>{for(const p of bossParts())box(p,p.key==='k'?'#ffa030':'#3ff0e0');for(const z of hazs)box(z,z.t<=z.warn?'#ffd23a':'#ff3030',z.t<=z.warn);};
    const MR=Math.random;let force=null;Math.random=()=>force!==null?(force+0.5)/3:MR();
    const fresh=()=>{force=null;HX.go(6,5);for(let i=0;i<320;i++){P.inv=999;update();}hazs.length=0;ebul.length=0;parts.length=0;ens.length=0;const b=boss;b.kcd=9999;b.ccd=9999;b.st='';b.stT=0;b.x=330;b.rw=0;if(b.zap>0){b.zap=0;vineAt(6,2,13);vineAt(17,2,13);}P.x=6*TS;P.y=14*TS-14;return b;};
    const run=(b,k,hold)=>{for(let i=0;i<k;i++){P.inv=999;if(hold){b.kcd=Math.max(b.kcd,9999);b.ccd=Math.max(b.ccd,9999);}update();}};
    const cast=(b,who,r)=>{b.lastK=-1;force=r;if(who==='k')b.kcd=0;else b.ccd=0;update();force=null;if(who==='k')b.kcd=9999;else b.ccd=9999;};
    let b=fresh();
    ck('騎士 22×30、詠嘆者 18×26 位置不變',bossParts().length===2&&bossParts()[0].w===22&&bossParts()[0].h===30&&bossParts()[1].x===400&&bossParts()[1].y===86&&bossParts()[1].w===18);
    b=fresh();cast(b,'k',0);let z=hazs[0];ck('揮砍 36×26、預警 34、生效 12',z.w===36&&z.h===26&&z.warn===34&&z.live===12&&z.fx==='b6chop',[z.w,z.h,z.warn,z.live].join('/'));
    {const d0=z.x-b.x;P.x=26*TS;run(b,20,1);const d1=z.x-b.x;P.x=2*TS;run(b,10,1);ck('(4) 揮砍判定框跟著騎士移動、身前側鎖定(主角越過後仍在原側)',Math.abs(d1-d0)<0.01&&Math.abs(z.x-b.x-d0)<0.01&&b6KF(b)===-1,[d0,(z.x-b.x).toFixed(1)].join('→'));}
    b=fresh();cast(b,'k',2);z=hazs[0];ck('橫掃 90×36、預警 44、生效 14、跟著騎士',z.w===90&&z.h===36&&z.warn===44&&z.live===14&&(run(b,10,1),Math.abs(z.x-(b.x-34))<0.01),[z.w,z.h,z.warn,z.live].join('/'));
    b=fresh();P.x=4*TS;cast(b,'k',1);{const f0=b.dface,x0=b.x;let turn=0,fr=0;P.x=28*TS;while(b.st==='dash'&&fr<40){run(b,1,1);fr++;if(b.dface!==f0||b6KF(b)!==f0)turn++;}
      ck('(1) 衝刺方向在發動那一幀鎖定(主角繞到身後也不掉頭)、位移與原版相同(20 幀 × 3 = 60)',turn===0&&Math.round(x0-b.x)===60,'幀數 '+(fr+1)+'、位移 '+Math.round(x0-b.x));}
    b=fresh();cast(b,'c',0);z=hazs[0];ck('地面圈 34×16、預警 95、生效 40',z.w===34&&z.h===16&&z.warn===95&&z.live===40);
    b=fresh();cast(b,'c',1);z=hazs[0];ck('縱柱 24×224、預警 85、生效 26',z.w===24&&z.h===224&&z.warn===85&&z.live===26);
    b=fresh();cast(b,'c',2);{let ok=G.msg==='繩索隱形';run(b,38,1);ok=ok&&climbT(6,8)&&climbT(17,8);run(b,1,1);ok=ok&&climbT(6,8);run(b,1,1);const a=climbT(6,8);run(b,189,1);const g=!climbT(6,8)&&!climbT(17,8);run(b,1,1);
      ck('(2) 繩索隱形:字幕改名、發動後第 39 幀照常可爬、第 40 幀消失、190 幀後回來',ok&&!a&&g&&climbT(6,8)&&climbT(17,13),[ok,a,g,climbT(6,8),G.msg].join('/'));
      b=fresh();force=2;b.ccd=0;update();force=null;ck('(2) 該招冷卻 260',b.ccd===260,b.ccd);}
    b=fresh();{cast(b,'k',0);const zz=hazs[0],t0=zz.t;bossDamage(bossParts()[0],1e8);const p0=b.b6p;run(b,10);ck('(5) 騎士先死:全場停頓 20 幀(招式計時不動)',p0===20&&zz.t===t0&&b.b6p===10&&b.alive,'b6p '+p0+'、預警計時 '+t0+'→'+zz.t);run(b,10);run(b,1);ck('(5) 停頓結束後戰鬥照常進行',zz.t===t0+1||!hazs.includes(zz));}
    {const pm=(lab,prep,k)=>{prep();for(let i=0;i<3;i++){P.inv=999;update();render();}const ts=[];for(let i=0;i<k;i++){P.inv=999;update();const t0=performance.now();render();ts.push(performance.now()-t0);}ts.sort((p,q)=>p-q);o.push('效能 '+lab+':render 平均 '+(ts.reduce((s,v)=>s+v,0)/k).toFixed(2)+' / 最差 '+ts[k-1].toFixed(2)+' ms(沙盒相對值)');};
      pm('平時',()=>{b=fresh();},120);pm('橫掃加縱柱加地面圈',()=>{b=fresh();cast(b,'k',2);cast(b,'c',1);cast(b,'c',0);run(b,40,1);},20);pm('登場',()=>{HX.go(6,5);for(let i=0;i<150;i++)update();},60);pm('最後死亡',()=>{b=fresh();bossDamage(bossParts()[1],1e8);run(b,90,1);bossDamage(bossParts()[0],1e8);},90);}
    const kz=[250,150,140,90],cz=[370,60,90,70];
    b=fresh();run(b,30,1);grab('1 場景:聖殿正殿、詠嘆者在唱詩高台、騎士在地面');grab('1b 判定疊圖:橘=騎士、青=詠嘆者',null,ovl);
    grab('2 騎士 冷甲(平時,放大)',kz);grab('2c 詠嘆者(放大)',cz);
    b.hf={k:6,c:6};grab('3 受擊白化(騎士)',kz);grab('3b 受擊白化(詠嘆者)',cz);b.hf={};
    b=fresh();P.x=4*TS;cast(b,'k',1);run(b,8,1);grab('4 衝刺:熾燃加三重殘影',[230,150,150,90],ovl);
    b=fresh();cast(b,'k',0);run(b,14,1);grab('5 揮砍預警中段:地面餘燼',kz,ovl);run(b,20,1);grab('5b 揮砍生效第 1 幀',kz,ovl);run(b,3,1);grab('5c 生效第 4 幀:月牙刃光',kz,ovl);
    b=fresh();cast(b,'k',2);run(b,40,1);grab('6 橫掃預警末段',[260,150,160,90],ovl);run(b,6,1);grab('6b 橫掃生效第 2 幀:火環',[260,150,160,90],ovl);run(b,6,1);grab('6c 生效第 8 幀',[260,150,160,90],ovl);
    b=fresh();P.x=12*TS;cast(b,'c',0);run(b,60,1);grab('7 地面圈預警:聖紋法陣',[140,170,140,70],ovl);run(b,40,1);grab('7b 地面圈生效',[140,170,140,70],ovl);
    b=fresh();P.x=12*TS;cast(b,'c',1);run(b,30,1);grab('8 縱柱預警前段:頂端光斑與塵埃',null,ovl);run(b,50,1);grab('8b 縱柱預警末段');run(b,10,1);grab('8c 縱柱生效');
    b=fresh();cast(b,'c',2);run(b,20,1);grab('9 繩索隱形預警第 20 幀:青綠音紋');run(b,21,1);grab('9b 消失後第 1 幀:散成光點');run(b,170,1);grab('9c 回來前閃現');
    b=fresh();bossDamage(bossParts()[0],1e8);run(b,20);run(b,30);grab('10 騎士先死 短演出第 30 幀:跪地冷卻成灰、詠嘆者低頭');run(b,30);grab('10b 第 60 幀:戟與灰堆留在場上');
    b.scd=1;run(b,2,1);grab('11 骷髏出現第 1 幀:灰燼柱加白閃');run(b,8,1);grab('11b 第 9 幀');
    b=fresh();bossDamage(bossParts()[1],1e8);run(b,20);run(b,20);grab('12 詠嘆者先死 短演出第 20 幀:面具裂開、騎士暴燃');run(b,30);grab('12b 第 50 幀:鐘落在高台');
    b=fresh();b.kh=b.kMax*0.2;b.ch=b.cMax*0.2;run(b,2,1);grab('13 受損 25% 以下(騎士裂縫、淡煙)',kz);grab('13b 受損 25% 以下(詠嘆者袍底破損、面具裂痕)',cz);
    for(const [t,lab] of [[60,'登場 WARNING:高台獨唱、冷灰插著戟'],[150,'登場 k0.3:灰燼聚起'],[180,'登場 k0.6:灰燼成形'],[200,'登場 k0.8:冷甲'],[212,'登場 k0.92:爐心點燃']]){force=null;HX.go(6,5);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    for(const [t,lab] of [[10,'最後死亡(騎士)10:爐心燒盡'],[45,'45:跪地冷卻'],[80,'80:由上往下崩落'],[150,'150:戟與灰堆留下']]){b=fresh();bossDamage(bossParts()[1],1e8);run(b,90,1);bossDamage(bossParts()[0],1e8);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    for(const [t,lab] of [[20,'最後死亡(詠嘆者)20:面具裂開'],[60,'60:化成灰與光點'],[150,'150:鐘留在高台']]){b=fresh();bossDamage(bossParts()[0],1e8);run(b,90,1);bossDamage(bossParts()[0],1e8);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    Math.random=MR;
    return {d:cel.toDataURL().split(',')[1],o,bad,n};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log(r.o.join('\n'));console.log('已存',outp,'格數',r.n,'錯誤',errs.length?errs:'無');await br.close();return r.bad+errs.length;}
async function b4fx(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  await pg.evaluate(async()=>{HX.go(4,5);HX.run(130,true);await new Promise(ok=>setTimeout(ok,600));});   // 內嵌圖非同步載入
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(n,ok,v)=>{o.push((ok?'OK':'NG')+' '+n+(v!==undefined?'('+v+')':''));if(!ok)bad++;};
    const cv=document.querySelector('canvas'),CW=640,CH=360,cel=document.createElement('canvas');cel.width=CW*2;cel.height=CH*20;const x=cel.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,c,ov)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const sc=cv.width/512,q=c||[0,0,512,288],ox=(n%2)*CW,oy=Math.floor(n/2)*CH;
      x.drawImage(cv,q[0]*sc,q[1]*sc,q[2]*sc,q[3]*sc,ox,oy,CW,CH);
      if(ov){x.save();x.beginPath();x.rect(ox,oy,CW,CH);x.clip();x.translate(ox,oy);x.scale(CW/q[2],CH/q[3]);x.translate(-q[0],-q[1]);x.lineWidth=1;ov();x.restore();}
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(ox,oy,CW,24);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,ox+8,oy+17);n++;};
    const box=(q,c,d)=>{x.strokeStyle=c;d&&x.setLineDash([3,2]);x.strokeRect(q.x+.5,q.y+.5,q.w-1,q.h-1);x.setLineDash([]);};
    const ovl=()=>{for(const p of bossParts())box(p,'#ffa030');for(let ty=0;ty<GH;ty++)for(let tx=0;tx<32;tx++){const t=T(tx,ty);if(t===2)box({x:tx*TS,y:ty*TS,w:TS,h:TS},'#3fff6a',1);if(t===3)box({x:tx*TS,y:ty*TS,w:TS,h:4},'#3fff6a');}for(const z of hazs)box(z,z.t<=z.warn?'#ffd23a':'#ff3030',z.t<=z.warn);box(P,'#ffe040');};
    const fresh=()=>{HX.go(4,5);HX.run(320);hazs.length=0;ebul.length=0;parts.length=0;const b=boss;b.cd=9999;P.x=10*TS;P.y=14*TS-14;return b;};
    const run=(b,k,hold)=>{for(let i=0;i<k;i++){P.inv=999;if(hold)b.cd=9999;update();}};
    let b=fresh();
    ck('左繩梯移到第 5 欄第 5~8 列,第 2 欄已無繩梯',[5,6,7,8].every(y=>climbT(5,y))&&[4,9].every(y=>!climbT(5,y))&&[2,5,8].every(y=>!climbT(2,y)));
    ck('上層橋第 6~18 欄,第 5 欄不是平台',T(5,5)!==3&&[6,12,18].every(c=>T(c,5)===3)&&T(19,5)===0);
    ck('中層橋第 3~20 欄、右繩梯第 21 欄第 6~13 列不變',[3,20].every(c=>T(c,9)===3)&&[6,13].every(y=>climbT(21,y)));
    ck('蛇頭判定 46×34、本體框 150×120 不變',bossParts()[0].w===46&&bossParts()[0].h===34&&b.w===150&&b.h===120);
    b=fresh();b.ai=0;b.cd=0;update();let z=hazs[0];ck('沿層推進 64×24、預警 78、生效 300、每幀 3.3',z.w===64&&z.h===24&&z.warn===78&&z.live===300&&z.vx===3.3&&z.x===-60&&z.fx==='b4wave',[z.w,z.h,z.warn,z.live,z.vx].join('/'));
    b=fresh();b.ai=1;b.cd=0;update();z=hazs[0];ck('鎖定範圍 87×45、預警 68、生效 14',z.w===87&&z.h===45&&z.warn===68&&z.live===14,[z.w,z.h,z.warn,z.live].join('/'));
    b=fresh();b.ai=2;b.cd=0;update();ck('骨矛 6 條 16×224、預警 71、生效 20',hazs.length===6&&hazs.every(q=>q.w===16&&q.h===224&&q.y===0&&q.warn===71&&q.live===20&&q.fx==='b4spear'));
    b=fresh();b.hp=b.max*0.49;run(b,1,1);let ok1=T(10,5)===3&&b.crT===40;run(b,39,1);ok1=ok1&&T(10,5)===3&&b.crT===1;run(b,1,1);ck('上層崩毀:觸發後 39 幀照常可站,第 40 幀才移除',ok1&&T(10,5)===0&&T(6,5)===0&&T(18,5)===0);
    {const pm=(lab,prep,k)=>{prep();for(let i=0;i<3;i++){P.inv=999;update();render();}const ts=[];for(let i=0;i<k;i++){P.inv=999;update();const t0=performance.now();render();ts.push(performance.now()-t0);}ts.sort((p,q)=>p-q);o.push('效能 '+lab+':render 平均 '+(ts.reduce((s,v)=>s+v,0)/k).toFixed(2)+' / 最差 '+ts[k-1].toFixed(2)+' ms(沙盒相對值)');};
      pm('平時',()=>{b=fresh();},120);pm('骨矛加毒霧',()=>{b=fresh();b.ai=2;b.cd=0;update();for(let i=0;i<70;i++){P.inv=999;b.cd=9999;update();}b.ai=0;b.cd=0;update();b.ai=1;b.cd=0;update();},20);
      pm('登場',()=>{HX.go(4,5);for(let i=0;i<130;i++)update();},80);pm('死亡',()=>{b=fresh();b.introT=0;bossDamage(bossParts()[0],1e8);},90);
      pm('閃瞬崩解',()=>{b=fresh();b.hp=b.max*0.29;b.cd=0;update();},30);}
    // 截圖
    b=fresh();run(b,30,1);grab('1 場景:屍骨峽谷、骨龍在右上角、脊椎骨鏈繩梯');grab('1b 骨龍(放大)',[356,-4,156,154]);
    grab('1c 判定疊圖:橘=蛇頭(唯一部件)、綠=繩梯與平台',null,ovl);
    b.hf={core:6};grab('2 受擊:只白化頭骨(放大)',[380,40,100,56]);b.hf={};
    b.headY=20;run(b,1,1);b.headY=20;grab('3 蛇頭在最高 y=20:頸往上彎(放大)',[356,-4,156,154]);b.headY=150;run(b,1,1);b.headY=150;grab('3b 蛇頭在最低 y=150',[356,30,156,154]);
    b=fresh();P.y=9*TS-14;P.x=8*TS;b.ai=0;b.cd=0;update();run(b,50,1);grab('4 沿層推進預警(左緣牆縫滲出霧泡)',[0,90,160,90]);run(b,50,1);grab('5 沿層推進生效:翻滾毒霧團',null,ovl);
    b=fresh();P.x=12*TS;b.ai=1;b.cd=0;update();run(b,50,1);grab('6 鎖定範圍預警:毒霧種',null,ovl);run(b,20,1);grab('7 鎖定範圍生效第 2 幀',[100,140,200,112]);run(b,6,1);grab('7b 生效第 8 幀',[100,140,200,112]);
    b=fresh();b.ai=2;b.cd=0;update();run(b,40,1);grab('8 骨矛預警(落點影子)');run(b,30,1);grab('9 預警倒數第 2 幀:骨矛落下中(矛尖 y=24,不扣血)',null,ovl);run(b,1,1);grab('9b 預警最後一幀(矛尖 y=60,不扣血)',null,ovl);run(b,1,1);grab('10 生效第 1 幀:整條插到地、穿過斷橋(與判定一致)',null,ovl);run(b,9,1);grab('11 生效第 10 幀');{const z=hazs.find(q=>q.fx==='b4spear');ck('骨矛:預警最後 2 幀畫落下、生效第 1 幀起整條',!!z&&z.t-z.warn===10,z&&z.t-z.warn);}
    b=fresh();b.hp=b.max*0.49;run(b,20,1);grab('12 上層崩毀龜裂第 20 幀',[80,60,240,60]);run(b,16,1);grab('12b 龜裂第 36 幀',[80,60,240,60]);run(b,6,1);grab('13 崩落後');
    b=fresh();b.hp=b.max*0.29;b.cd=0;update();b.flashTarget={x:-16,hy:8,label:'左上'};run(b,12,1);grab('14 骨影閃瞬:崩解成骨片與黑霧(第 12 幀)');run(b,100,1);grab('15 閃瞬剩 60 幀:目標位置魂火浮現');run(b,40,1);grab('16 剩 20 幀:骨片螺旋聚集',[0,0,200,112]);
    run(b,22,1);grab('17 左上現身(鏡像)',null,ovl);run(b,100);grab('17b 左側追主角高度');
    for(const [X,hy,lab] of[[-16,194,'18 左下現身:蹲伏加收合翼'],[402,8,'19 右上現身(往右移 46)'],[402,194,'20 右下現身:蹲伏加收合翼'],[-16,8,'20b 左上現身(完整鏡像)']]){b=fresh();b.x=X;b.headY=hy;b.holdT=999;b.v4w=b4Lw(b);run(b,20,1);grab(lab,null,ovl);}
    b=fresh();b.x=402;b.headY=194;b.v4w=1;b.holdT=0;P.y=2*TS;P.x=10*TS;for(let i=0;i<24;i++){P.y=2*TS;P.vy=0;P.inv=999;b.cd=9999;update();}grab('21 右下現身後頭往上追:身軀切回高姿勢中');for(let i=0;i<60;i++){P.y=2*TS;P.vy=0;P.inv=999;b.cd=9999;update();}grab('21b 切換完成');
    b=fresh();b.ai=0;b.cd=0;update();run(b,110,1);{const z=hazs[0];grab('22 毒霧團頭尾(放大)',[Math.round(z.x)-24,Math.round(z.y)-6,112,63]);}b=fresh();P.x=12*TS;b.ai=1;b.cd=0;update();run(b,70,1);grab('23 鎖定範圍頭尾(放大)',[130,180,120,50]);
    for(const [t,lab] of[[60,'登場 WARNING'],[150,'登場 k0.3:骨片由兩側屍骨堆飛出'],[175,'登場 k0.55:翼與胸廓聚合'],[198,'登場 k0.78:頸與頭骨聚合'],[214,'登場 k0.94:點燃眼窩']]){HX.go(4,5);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    for(const [t,lab] of[[10,'死亡 10:魂火熄滅'],[36,'死亡 36:頭骨崩散'],[60,'死亡 60:骨架由頭往尾崩散'],[90,'死亡 90:骨片落地'],[170,'死亡 170:化為散布全場的骨堆']]){b=fresh();b.introT=0;bossDamage(bossParts()[0],1e8);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    return {d:cel.toDataURL().split(',')[1],o,bad,n};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log(r.o.join('\n'));console.log('已存',outp,'格數',r.n,'錯誤',errs.length?errs:'無');await br.close();return r.bad+errs.length;}
// v0.27 4 王:上層橋(第 5 列)可達性。各種地形方案下,從左右繩梯頂端與中層橋,以不同的起跳時機(放開上鍵後幾幀按方向、跳躍鍵按住幾幀)嘗試跳上第 5 列,回報成功組數
async function b4reach(file){const {br,pg,errs}=await open(file);
  const r=await pg.evaluate(()=>{const out={};
    const CF={'A 第 2 回授權原案(左繩梯 6~8 列、橋 6~18 欄)':[6,6],'B 左繩梯 4~8 列、橋 6~18 欄':[4,6],'C 左繩梯 5~8 列、橋 6~18 欄':[5,6],'D 左繩梯 6~8 列、橋 5~18 欄':[6,5],'E 原版(左繩梯 2~8 列、橋 5~18 欄)':[2,5],'F 左繩梯 2~8 列、橋 6~18 欄':[2,6],'G 左繩梯 3~8 列、橋 6~18 欄':[3,6],'H 左繩梯 3~8 列、橋 5~18 欄':[3,5],'I 左繩梯移到第 5 欄 2~8 列、橋 6~18 欄':[2,6,5],'J 第 5 欄 4~8 列':[4,6,5],'K 現行(第 5 欄 5~8 列、橋 6~18 欄)':[5,6,5]};
    for(const [lab,[vt,bl,vc]] of Object.entries(CF)){const VC=vc||2;let ok=0,tot=0;const how=[];
      for(const src of ['左繩梯','右繩梯','中層橋'])for(let dl=0;dl<=8;dl+=2)for(const jh of [1,6,20]){
        HX.go(4,5);HX.run(320);for(let c=5;c<=18;c++)setT(c,5,c>=bl?3:0);for(let y=2;y<=8;y++){setT(2,y,0);if(T(VC,y)!==3)setT(VC,y,y>=vt?2:0);}
        const z=()=>{ebul.length=0;hazs.length=0;ens.length=0;boss.cd=999;boss.headY=150;boss.holdT=999;};
        const dir=src==='右繩梯'?'l':'r';K.l=K.r=K.u=K.j=0;
        if(src==='中層橋'){P.x=(src==='中層橋'?bl*16+8:0);P.y=9*16-14;P.vy=0;for(let i=0;i<10;i++){z();HX.run(1);}}
        else{const col=src==='左繩梯'?VC:21;P.x=col*16+3;P.y=8*16;P.vy=0;K.u=1;for(let i=0;i<300;i++){z();HX.run(1);}K.u=0;}
        for(let i=0;i<dl;i++){z();HX.run(1);}
        K[dir]=1;K.j=1;let best=0;for(let i=0;i<70;i++){if(i===jh)K.j=0;z();HX.run(1);if(P.onG&&Math.abs(P.y+14-80)<1)best=1;}
        K[dir]=0;K.j=0;tot++;if(best){ok++;how.push(src+' 延遲'+dl+' 按跳'+jh);}}
      out[lab]=ok+'/'+tot+(how.length?'('+how.slice(0,4).join('、')+(how.length>4?'…':'')+')':'');}
    return out;});
  console.log(JSON.stringify(r,null,1),'錯誤',errs.length?errs:'無');await br.close();return errs.length;}
// v0.26 9 王:核對兩項授權(本體碰撞 150×120、左繩梯第 21 欄、死後傳送帶停止)、翻轉後畫面同步與招式數字;場景、各招特效、翻轉預告、登場、死亡逐格截圖(2 欄)
async function b9fx(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  await pg.evaluate(async()=>{HX.go(9,5);HX.run(130,true);await new Promise(ok=>setTimeout(ok,500));});   // 內嵌圖非同步載入
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(n,ok,v)=>{o.push(`${ok?'OK':'NG'} ${n}${v!==undefined?'('+v+')':''}`);if(!ok)bad++;};
    const cv=document.querySelector('canvas'),CW=640,CH=360,cel=document.createElement('canvas');cel.width=CW*2;cel.height=CH*16;const x=cel.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,c)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const sc=cv.width/512,q=c||[0,0,512,288];
      x.drawImage(cv,q[0]*sc,q[1]*sc,q[2]*sc,q[3]*sc,(n%2)*CW,Math.floor(n/2)*CH,CW,CH);
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect((n%2)*CW,Math.floor(n/2)*CH,CW,24);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,(n%2)*CW+8,Math.floor(n/2)*CH+17);n++;};
    const fresh=()=>{HX.go(9,5);HX.run(320);hazs.length=0;ebul.length=0;const b=boss;b.cd=9999;b.lockT=0;P.x=4*TS;P.y=14*TS-14;return b;};
    const run=(b,k,hold)=>{for(let i=0;i<k;i++){P.inv=999;if(hold)b.cd=9999;update();}};
    let b=fresh();
    ck('左繩梯第 21 欄第 2~10 列可攀',[2,4,6,8,10].every(y=>climbT(21,y)));ck('第 22 欄不再有繩梯',[2,5,8,10].every(y=>!climbT(22,y)));
    const hurt=(X,Y)=>{b=fresh();P.inv=0;P.lives=5;P.x=X;P.y=Y;P.vy=0;b.cd=9999;update();return P.lives<5;};
    ck('碰到本體左緣扣血',hurt(347,60));ck('本體左邊 2 像素外不扣血',!hurt(344,60));ck('碰到本體底緣扣血',hurt(420,127));
    ck('左下圓弧外(方框角落)不扣血',!hurt(349,130));ck('左上圓弧外(方框角落)不扣血',!hurt(349,8));ck('右下圓弧外不扣血',!hurt(500,137));ck('左緣甲殼弧中段扣血',hurt(347,98));   // 11/10 使用者授權:碰撞跟著圓弧外形 B9MK
    {b=fresh();P.x=24*TS;P.y=11*TS-14;P.vy=0;run(b,5,1);P.inv=0;P.lives=5;P.vy=-6.05;P.onG=false;let mn=999;for(let i=0;i<30;i++){P.inv=0;b.cd=9999;update();mn=Math.min(mn,P.y);}ck('右平台往上跳滿會撞到艦腹(使用者知悉)',P.lives<5,'頭頂最高 '+Math.round(mn));}
    b=fresh();ck('攀爬時主角右緣離本體 7 像素',356-(21*TS+TS/2-P.w/2+P.w)===7);
    b=fresh();b.ai=1;b.cd=0;update();const z=hazs[0];ck('光束全寬 22 高、預警 71、生效 40、4 條',hazs.length===4&&z.w===512&&z.h===22&&z.warn===71&&z.live===40&&z.fx==='b9beam',[hazs.length,z.w,z.h,z.warn,z.live].join('/'));
    b=fresh();b.ai=0;b.cd=0;update();ck('扇形 5 發 r=3 速度 3.3',ebul.length===5&&ebul.every(e=>e.r===3&&e.vk==='b9p'&&Math.abs(Math.hypot(e.vx,e.vy)-3.3)<0.01));
    b=fresh();b.ai=2;b.cd=0;update();ck('齊射 6 發 r=3 速度 2.86',ebul.length===6&&ebul.every(e=>e.r===3&&e.vk==='b9a'&&Math.abs(Math.hypot(e.vx,e.vy)-2.86)<0.01));
    b=fresh();b.ai=3;b.cd=0;update();let lk=b.lockT;for(let i=0;i<121;i++){P.inv=999;b.cd=9999;update();}const sn=ebul.filter(e=>e.vk==='b9k');ck('狙擊鎖定 120 幀後 1 發 r=4 速度 11.55',lk===120&&sn.length===1&&sn[0].r===4&&Math.abs(Math.hypot(sn[0].vx,sn[0].vy)-11.55)<0.01);
    b=fresh();const d0=Array.from(map.d);b.ai=4;b.cd=0;update();let mir=true;for(let y=0;y<GH;y++)for(let xx=0;xx<32;xx++)if(map.d[y*32+xx]!==d0[y*32+31-xx])mir=false;ck('翻轉後地形左右鏡像(與原本相同)',mir);
    let k=0;for(;k<40;k++){render();if(Array.from(MAT.done).every(v=>v))break;P.inv=999;b.cd=9999;update();}ck('翻轉後地面快取重烘焙完成(幀數)',k<12,k);
    b=fresh();b.introT=0;bossDamage(bossParts()[0],1e8);for(let i=0;i<3;i++){P.inv=999;update();}ck('死亡後傳送帶停止',G.conveyor===0,G.conveyor);
    // 截圖
    b=fresh();run(b,30,1);grab('1 場景:寧靜深空、我方甲板、利維坦-零頭部');grab('1b 頭部(放大)',[330,0,182,102]);
    b.hf={core:6};grab('2 受擊:半數小眼閉合、其餘白化(放大)',[370,40,100,56]);b.hf={};
    b=fresh();b.ai=0;b.cd=0;update();run(b,24,1);grab('3 扇形孢子(發射眼噴出)');
    b=fresh();P.y=8*TS-14;P.x=15*TS;b.ai=1;b.cd=0;update();run(b,40,1);grab('4 光束預警:右緣生物砲管伸出、砲口蓄光');run(b,40,1);grab('5 光束生效:紫色電漿帶');
    b=fresh();P.x=8*TS;b.ai=2;b.cd=0;update();run(b,8,1);grab('6 齊射:砲囊張開、酸液彈');run(b,30,1);grab('6b 酸液彈飛行(放大)',[150,120,200,112]);
    b=fresh();P.x=10*TS;b.ai=3;b.cd=0;update();run(b,40,1);grab('7 狙擊鎖定 40 幀:像素圓圈十字加虛線');run(b,62,1);grab('8 狙擊鎖定最後 30 幀:準星收縮、加快閃爍');run(b,22,1);grab('9 骨刺狙擊彈');
    b=fresh();b.ai=4;b.cd=45;run(b,1);grab('10 翻轉預告 50%:新坑、新平台、新繩梯的投影');run(b,40);grab('11 翻轉預告 95%');run(b,10);grab('12 翻轉後 6 幀:畫面橫向壓扁');
    b=fresh();b.hp=b.max*0.4;run(b,40,1);grab('13 血量 40%:暗紫體液滲出');b.hp=b.max*0.2;run(b,40,1);grab('14 血量 20%:部分複眼閉合、黑煙');
    for(const [t,lab] of[[60,'登場 WARNING:寧靜深空'],[140,'登場 k0.2:巨大黑影在深空掠過'],[175,'登場 k0.55:頭部由右滑入、眼睛閉著'],[200,'登場 k0.8:複眼一顆顆睜開'],[216,'登場 k0.96:核心亮起']]){HX.go(9,5);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    for(const [t,lab] of[[24,'死亡 24:複眼逐一爆破'],[60,'死亡 60:肉質湧出抽搐'],[97,'死亡 97:核心大爆炸'],[140,'死亡 140:頭部往右後方漂走'],[199,'死亡 199:漂出畫面']]){b=fresh();b.introT=0;bossDamage(bossParts()[0],1e8);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    return {d:cel.toDataURL().split(',')[1],o,bad};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log(r.o.join('\n'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();return r.bad+errs.length;}
// v0.25 1 王:核對四項授權(砲彈真的落地、艦體碰撞、右鐵鍊第 18 欄、無人機上限 10)與招式數字;場景、各招特效、登場、死亡逐格截圖(2 欄)
async function b1fx(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  await pg.evaluate(async()=>{HX.go(1,5);HX.run(130,true);await new Promise(ok=>setTimeout(ok,400));});   // 內嵌圖非同步載入
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(n,ok,v)=>{o.push(`${ok?'OK':'NG'} ${n}${v!==undefined?'('+v+')':''}`);if(!ok)bad++;};
    const cv=document.querySelector('canvas'),CW=640,CH=360,cel=document.createElement('canvas');cel.width=CW*2;cel.height=CH*19;const x=cel.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,c)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const sc=cv.width/512,q=c||[0,0,512,288];
      x.drawImage(cv,q[0]*sc,q[1]*sc,q[2]*sc,q[3]*sc,(n%2)*CW,Math.floor(n/2)*CH,CW,CH);
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect((n%2)*CW,Math.floor(n/2)*CH,CW,24);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,(n%2)*CW+8,Math.floor(n/2)*CH+17);n++;};
    const fresh=()=>{HX.go(1,5);HX.run(320);hazs.length=0;ebul.length=0;ens.length=0;const b=boss;b.cd=9999;P.x=4*TS;P.y=13*TS-14;return b;};
    const run=(b,k,hold)=>{for(let i=0;i<k;i++){P.inv=999;if(hold)b.cd=9999;update();}};
    // 1 迫擊砲彈:飛行 77 幀、最高點不變、真的落到地面才出火圈
    let b=fresh();b.ai=1;b.cd=0;update();const sh=ebul.filter(e=>e.vk==='b1s').map(e=>({e,x0:e.x,vx:e.vx,vy:e.vy}));let land=[],top=999,fire=[];
    for(let i=0;i<90;i++){const h0=hazs.length;P.x=4*TS;P.y=-200;P.vy=0;run(b,1,1);for(const e of ebul)top=Math.min(top,e.y);for(const q of sh)if(!q.done&&!ebul.includes(q.e)){q.done=1;land.push([Math.round(q.e.y),i+2,Math.round(q.e.x-(q.x0+q.vx*78))]);}
      for(let j=h0;j<hazs.length;j++)fire.push(i+2);}
    ck('3 顆砲彈、life 77、初速 -5.4',sh.length===3&&sh.every(q=>q.e.life===77&&(Math.abs(q.vy+5.4)<0.05||Math.abs(q.vy+5.22)<0.05)),sh.map(q=>q.e.life+'/'+q.vy.toFixed(2)).join(' '));
    ck('砲彈消失時中心在地表(208)上方 0~6 像素',land.length===3&&land.every(v=>v[0]>=202&&v[0]<=208),land.map(v=>'y'+v[0]+' 第'+v[1]+'幀 落點差'+v[2]).join('、'));
    ck('最高點約 y=2(初速不變,與原本相同)',top>-2&&top<8,Math.round(top));ck('火圈在砲彈消失那一幀出現',fire.length===3&&fire.every(v=>land.some(l=>l[1]===v)),fire.join(' '));
    // 2 艦體碰撞(整個 160×112)
    const hurt=(X,Y)=>{b=fresh();P.inv=0;P.lives=5;P.x=X;P.y=Y;P.vy=0;b.cd=9999;update();return P.lives<5||P.inv>0;};
    ck('碰到艦體左緣扣血',hurt(332,60));ck('碰到艦體底緣扣血',hurt(420,125));ck('艦體左邊 2 像素外不扣血',!hurt(328,60));
    {b=fresh();P.x=420;P.y=13*TS-14;P.vy=0;run(b,5,1);let mn=999;P.vy=-6.05;P.onG=false;for(let i=0;i<60;i++){run(b,1,1);mn=Math.min(mn,P.y);}ck('艦底地面原地跳滿不會撞到(頭頂最高 > 138)',mn>138,Math.round(mn));}
    // 3 右鐵鍊第 18 欄
    b=fresh();ck('第 18 欄第 3~12 列可攀',[3,4,5,6,7,8,9,10,11,12].every(y=>climbT(18,y)));ck('第 22 欄不再有鐵鍊',[3,6,9,12].every(y=>!climbT(22,y)));
    ck('攀爬時主角右緣(x=301)離艦體 39 像素',18*TS+TS/2-P.w/2+P.w===301,18*TS+TS/2-P.w/2+P.w);
    // 4 無人機上限 10 隻(主角無敵、不開槍 20000 幀)
    HX.go(1,5);HX.run(320);let mx=0;for(let i=0;i<20000;i++){P.inv=999;P.lives=5;update();mx=Math.max(mx,ens.filter(e=>e.type==='drone').length);}ck('同時最多無人機 ≤ 10',mx<=10,mx);
    // 5 電流條數字不變
    b=fresh();b.ai=0;b.cd=0;update();const z=hazs[0];ck('電流條全寬 12 高、預警 104、生效 70',z&&z.w===512&&z.h===12&&z.y===196&&z.warn===104&&z.live===70&&z.fx==='b1beam',z&&[z.w,z.h,z.y,z.warn,z.live].join('/'));
    // 截圖
    b=fresh();run(b,30,1);grab('1 場景:飛艇墳場、左上月亮、吊鉤鐵鍊(右鍊第 18 欄)');grab('1b 艦首(放大)',[300,0,212,119]);
    b.ai=0;b.cd=0;update();run(b,50,1);grab('2 電流條預警 50%:電極放下、接縫亮點');run(b,44,1);grab('3 電流條預警 90%:接縫電弧');run(b,20,1);grab('4 電流條生效:粗電流鋸齒');
    b=fresh();b.ai=1;b.cd=0;update();run(b,24,1);grab('5 燃燒彈出膛 24 幀(核心噴出)');run(b,48,1);grab('6 燃燒彈將落地(第 72 幀)');run(b,10,1);grab('7 落地出火圈');
    for(const v of['A','B']){B1PF=v;b=fresh();b.ai=1;b.cd=0;update();P.x=4*TS;for(let i=0;i<78;i++){P.y=-200;P.vy=0;run(b,1,1);}const z=hazs.find(q=>q.fx==='b1fire');const zc=z?[clamp(z.x-44,0,384),150,128,72]:[0,150,128,72];
      for(const [d,lab] of[[3,'落地小爆炸(預警,不扣血)'],[8,'爆炸擴散'],[22,'焦痕餘燼(預警末段)'],[40,'起火(扣血 40×14)'],[110,'熄滅前']]){while(z&&z.t<d){P.y=-200;P.vy=0;run(b,1,1);}grab('火圈 '+v+' 第 '+d+' 幀:'+lab+'(放大)',zc);}}B1PF='A';
    b=fresh();b.ai=2;b.cd=20;run(b,12);grab('8 召喚前:機庫艙門亮燈開啟(放大)',[300,30,128,72]);run(b,10);grab('9 無人機出生(放大)',[280,30,160,90]);
    b=fresh();b.plates=[0,0,0];run(b,20,1);grab('10 裝甲全破:百葉打開露出熾核');
    for(const v of['A','B','C']){B1PV=v;b.exposedT=420;HX.warm();grab('11'+v+' 裝甲復原預兆 '+v+' 案 50%(放大)',[330,20,128,72]);}B1PV='A';b.exposedT=455;HX.warm();grab('12 復原前最後 30 幀閃爍(亮拍,放大)',[330,20,128,72]);
    b=fresh();b.hp=b.max*0.4;run(b,40,1);grab('13 血量 40%:火花');b.hp=b.max*0.2;run(b,40,1);grab('14 血量 20%:黑煙與局部失火');
    for(const [t,lab] of[[60,'登場 WARNING:熄火殘骸斜躺'],[140,'登場 k0.2:逐段亮燈'],[170,'登場 k0.5:推進器點火扶正、揚塵'],[196,'登場 k0.76:裝甲鎖上'],[214,'登場 k0.94:核心點亮']]){HX.go(1,5);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    for(const [t,lab] of[[20,'死亡 20:核心過熱、連串爆炸'],[45,'死亡 45:裝甲脫落'],[64,'死亡 64:斷成兩截墜落'],[82,'死亡 82:落地揚塵'],[110,'死亡 110:大爆炸後'],[199,'死亡 199:殘骸留在場上冒煙']]){b=fresh();b.introT=0;bossDamage(bossParts().find(p=>p.key==='core'),1e8);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab);}
    return {d:cel.toDataURL().split(',')[1],o,bad};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log(r.o.join('\n'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();return r.bad+errs.length;}
// 1 王效能(11/9):同一條件下量 render 平均與最差(電流條生效加 3 顆燃燒彈、裝甲全破熾核、登場),新舊版各跑一次比較;另量 b1Bake 一次性烘焙
async function b1perf(file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  await pg.evaluate(async()=>{HX.go(1,5);HX.run(130,true);await new Promise(ok=>setTimeout(ok,500));});
  const r=await pg.evaluate(async()=>{const o={};const m=(lab,prep,n)=>{prep();for(let i=0;i<20;i++){P.inv=999;update();render();}const ts=[];
      for(let i=0;i<n;i++){P.inv=999;update();const t0=performance.now();render();ts.push(performance.now()-t0);}ts.sort((a,b)=>a-b);o[lab]=(ts.reduce((s,v)=>s+v,0)/n).toFixed(3)+' / 最差 '+ts[n-1].toFixed(2)+' ms';};
    const fresh=()=>{HX.go(1,5);HX.run(320);hazs.length=0;ebul.length=0;ens.length=0;boss.cd=9999;};
    m('平時',()=>{fresh();},240);
    m('電流條生效加燃燒彈',()=>{fresh();boss.ai=0;boss.cd=0;update();boss.ai=1;boss.cd=0;update();for(let i=0;i<100;i++){P.inv=999;boss.cd=9999;update();}},60);
    m('裝甲全破',()=>{fresh();boss.plates=[0,0,0];boss.exposedT=400;},60);
    m('登場',()=>{HX.go(1,5);for(let i=0;i<150;i++)update();},60);
    if(typeof b1Bake==='function'){const s=new Image(),a=new Image();s.src=IMGD.b1ship;a.src=IMGD.b1arena;await s.decode();await a.decode();const t0=performance.now();b1Bake(s,a);o['b1Bake 一次性']=(performance.now()-t0).toFixed(1)+' ms';}
    return o;});
  console.log(JSON.stringify(r,null,1),'錯誤',errs.length?errs:'無');await br.close();}
// 9 王效能(11/10):同一條件下量 render 平均與最差(平時、4 條光束生效加扇形與齊射彈、翻轉預告、翻轉壓扁、登場),新舊版各跑一次比較;另量 b9Bake 一次性烘焙
async function b9perf(file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  await pg.evaluate(async()=>{HX.go(9,5);HX.run(130,true);await new Promise(ok=>setTimeout(ok,500));});
  const r=await pg.evaluate(async()=>{const o={};const m=(lab,prep,n,hold)=>{prep();for(let i=0;i<4;i++){P.inv=999;update();render();}const ts=[];
      for(let i=0;i<n;i++){P.inv=999;if(hold)boss.cd=9999;update();const t0=performance.now();render();ts.push(performance.now()-t0);}ts.sort((a,b)=>a-b);o[lab]=(ts.reduce((s,v)=>s+v,0)/n).toFixed(3)+' / 最差 '+ts[n-1].toFixed(2)+' ms';};
    const fresh=()=>{HX.go(9,5);HX.run(320);hazs.length=0;ebul.length=0;boss.cd=9999;boss.lockT=0;};
    m('平時',()=>{fresh();},240,1);
    m('光束生效加扇形與齊射',()=>{fresh();boss.ai=1;boss.cd=0;update();for(let i=0;i<70;i++){P.inv=999;boss.cd=9999;update();}boss.ai=0;boss.cd=0;update();boss.ai=2;boss.cd=0;update();},30,1);
    m('翻轉預告',()=>{fresh();boss.ai=4;boss.cd=80;},60);
    m('翻轉壓扁',()=>{fresh();boss.ai=4;boss.cd=4;},10);
    m('登場',()=>{HX.go(9,5);for(let i=0;i<150;i++)update();},60);
    if(typeof b9Bake==='function'){const s=new Image(),a=new Image();s.src=IMGD.b9body;a.src=IMGD.b9arena;await s.decode();await a.decode();const t0=performance.now();b9Bake(s,a);o['b9Bake 一次性']=(performance.now()-t0).toFixed(1)+' ms';}
    return o;});
  console.log(JSON.stringify(r,null,1),'錯誤',errs.length?errs:'無');await br.close();}
// v0.24 7 王:場景、各招特效、登場、死亡逐格截圖(2 欄);並核對變色規則(不連續同色、預告 90 幀、一輪 270 幀、只在切換那一幀改地形)、灼燒格扣血範圍、招式數字
async function b7fx(outp,file){const {br,pg,errs}=await open(file,{width:1280,height:720});
  await pg.evaluate(async()=>{HX.go(7,5);HX.run(130,true);await new Promise(ok=>setTimeout(ok,400));});   // 場景內嵌圖非同步載入
  const r=await pg.evaluate(()=>{const o=[];let bad=0;const ck=(n,ok,v)=>{o.push(`${ok?'OK':'NG'} ${n}${v!==undefined?'('+v+')':''}`);if(!ok)bad++;};
    const cv=document.querySelector('canvas'),CW=640,CH=360,cel=document.createElement('canvas');cel.width=CW*2;cel.height=CH*13;const x=cel.getContext('2d');x.imageSmoothingEnabled=false;
    let n=0;const grab=(lab,c)=>{const pi=P.inv;P.inv=0;HX.warm();render();P.inv=pi;const sc=cv.width/512,q=c||[0,0,512,288];
      x.drawImage(cv,q[0]*sc,q[1]*sc,q[2]*sc,q[3]*sc,(n%2)*CW,Math.floor(n/2)*CH,CW,CH);
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect((n%2)*CW,Math.floor(n/2)*CH,CW,24);x.fillStyle='#fff';x.font='15px sans-serif';x.fillText(lab,(n%2)*CW+8,Math.floor(n/2)*CH+17);n++;};
    const fresh=()=>{HX.go(7,5);HX.run(320);hazs.length=0;ebul.length=0;const b=boss;b.decoys=[];b.cd=9999;P.x=4*TS;P.y=15*TS-14;return b;};
    const run=(b,k,hold)=>{for(let i=0;i<k;i++){P.inv=999;if(hold)b.cd=9999;update();}};
    // 1 變色規則:30000 幀
    let b=fresh();let prev=b.col,sw=0,same=0,lens=[],last=0,pv=[],terr=0,tc={},bad90=0;const tv=()=>T(b.cells[0][0],b.cells[0][1]);let tprev=tv();
    for(let i=1;i<=30000;i++){P.inv=999;const nc0=b.nCol,c0=b.col;update();
      if(b.nCol>=0&&nc0<0)pv.push(i);
      if(b.col!==c0||(b.colT===270&&i>1)){sw++;if(b.col===c0)same++;lens.push(i-last);last=i;const k=c0+'>'+b.col;tc[k]=(tc[k]||0)+1;if(!pv.length||i-pv[pv.length-1]!==90)bad90++;}
      const t1=tv();if(t1!==tprev&&b.col===c0&&b.colT!==270)terr++;tprev=t1;}
    const nm=['紅','藍','紫'],trn={};for(const k in tc)trn[k.split('>').map(v=>nm[v]).join('→')]=tc[k];
    ck('不連續同色',same===0,'切換 '+sw+' 次、同色 '+same+' 次');ck('一輪 270 幀',lens.slice(1).every(v=>v===270),'首段 '+lens[0]+'(開場湛藍 270)');
    ck('每次切換前 90 幀預告',bad90===0,'不符 '+bad90);ck('地形只在切換那一幀改變',terr===0,'例外 '+terr);o.push('轉換次數 '+JSON.stringify(trn));
    // 2 灼燒格扣血範圍(授權:格頂上 1 到格頂下 9 像素)
    b=fresh();B7.setCol(b,0);const [cx_,cy_]=b.cells[0],ty=cy_*TS;const hit=Y=>{P.x=cx_*TS+3;P.y=Y;return B7.burnHit();};
    ck('主角腳底剛好碰到炭塊上緣(格頂上 1)扣血',hit(ty-1-14+1));ck('腳底在炭塊上緣之上 1 像素不扣血',!hit(ty-1-14));
    ck('頭頂在格頂下 8 像素扣血',hit(ty+8));ck('頭頂在格頂下 9 像素(炭塊下方)不扣血',!hit(ty+9));
    const old=Y=>{P.x=cx_*TS+3;P.y=Y;return tileKind(P.x,P.y+2,P.w,P.h,5);};o.push('對照舊規則:頭頂在格頂下 9 像素 '+(old(ty+9)?'扣血':'不扣')+'、格頂下 13 像素 '+(old(ty+13)?'扣血':'不扣'));
    // 3 招式數字
    b=fresh();b.ai=0;b.cd=0;update();ck('光柱 2 道、寬 26、預警 95、生效 90',hazs.length===2&&hazs.every(z=>z.w===26&&z.warn===95&&z.live===90&&z.fx==='b7beam'),hazs.map(z=>z.w+'/'+z.warn+'/'+z.live).join(' '));
    b=fresh();b.ai=3;b.cd=0;update();ck('12 方向彈 12 顆、r=3',ebul.length===12&&ebul.every(e=>e.r===3&&e.vk==='b7s'));
    b=fresh();b.ai=2;b.cd=0;update();ck('方向錯亂 120 幀',G.invertT===120||G.invertT===119,G.invertT);
    b=fresh();b.ai=1;b.cd=0;update();ck('假結晶 3 顆、判定 22×22',bossParts().length===4&&bossParts().every(p=>p.w===22&&p.h===22));
    // 截圖
    b=fresh();run(b,30,1);grab('1 湛藍:長苔石板、淺溪倒影(含假結晶)、結晶光暈藍');grab('1b 結晶本體(放大,減少混白)',[b.x-21,b.y-7,64,36]);
    b.ai=1;b.cd=0;update();run(b,20,1);grab('2 假結晶 3 顆(與本體同精靈、原地浮動 1 像素)');
    const on=b=>{let k=0;while(!b7Flash(90-b.colT)&&k<8){run(b,1,1);k++;}};
    b=fresh();b.colT=91;run(b,2,1);b.nCol=0;G.msg=B7NM[0];run(b,10,1);grab('3 預告(下一色赤紅)第 12 幀:光暈先換紅、新色光環、平台白閃、字幕');
    run(b,60,1);on(b);grab('4 預告第 72 幀:白閃加快(放大)',[96,120,256,144]);
    run(b,20,1);grab('5 赤紅:懸空通紅炭塊(放大)',[96,120,256,144]);
    b.colT=80;b.nCol=2;run(b,8,1);let k=0;while(!b7Flash(90-b.colT)&&k<6){run(b,1,1);k++;}grab('6 灼燒中預告幻紫:炭塊閃白(放大)',[96,120,256,144]);
    b.colT=1;run(b,2,1);b.colT=60;b.nCol=1;k=0;while(!b7Flash(90-b.colT)&&k<6){run(b,1,1);k++;}grab('7 幻紫(平台消失)中預告湛藍:原平台位置白閃');
    b=fresh();b.ai=0;b.cd=0;update();run(b,60,1);grab('8 光柱預警(共用光束樣式,白色)');run(b,50,1);grab('9 虹彩光柱生效(定案:無白芯,整道色帶流動)');
    B7NOWC=0;HX.warm();grab('10 光柱白芯版(未採用,對照用)');B7NOWC=1;
    b=fresh();b.ai=1;b.cd=0;update();run(b,10,1);{const d=b.decoys[0];bossDamage({x:d.x,y:d.y,w:22,h:22,key:'f0'},1);}run(b,40,1);grab('11 打中假結晶後 40 幀:3 顆同步脈動、連出細光線');
    run(b,45,1);grab('12 共鳴 85 幀:更亮');
    b=fresh();b.ai=3;b.cd=0;update();run(b,30,1);grab('13 12 方向彈:粉紅三角尖頭朝飛行方向(放大)',[b.x-117,b.y-60,256,144]);
    b=fresh();b.ai=2;b.cd=0;P.x=200;P.y=15*TS-14;update();run(b,20,1);grab('14 方向錯亂:頭上正中黃色螺旋(放大)',[P.x-60,P.y-50,128,72]);
    for(const [t,lab] of[[135,'登場 k0.15:水面一點異色光'],[160,'登場 k0.4:油膜擴散'],[183,'登場 k0.63:色點升起'],[200,'登場 k0.8:碎片聚合'],[214,'登場 k0.94:光暈亮起']]){HX.go(7,5);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab+'(放大)',[123,104,256,144]);}
    for(const [t,lab] of[[30,'死亡 30:龜裂、色彩漏出'],[70,'死亡 70:褪成透明無色'],[110,'死亡 110:碎落'],[150,'死亡 150:碎片落進溪裡']]){b=fresh();b.introT=0;bossDamage(bossParts()[0],1e8);for(let i=0;i<t;i++){P.inv=999;update();}grab(lab+(t<100?'(放大)':''),t<100?[b.x-117,b.y-60,256,144]:null);}
    return {d:cel.toDataURL().split(',')[1],o,bad};});
  fs.writeFileSync(outp,Buffer.from(r.d,'base64'));console.log(r.o.join('\n'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();return r.bad+errs.length;}
(async()=>{const [cmd,...a]=process.argv.slice(2);let bad=0;
  if(cmd==='smoke')bad=await smoke(a[0]);
  else if(cmd==='special')bad=await special(a[0]);
  else if(cmd==='wvis')bad=await wvis(a[0]);
  else if(cmd==='tshot')bad=await tshot(a[0]||'preview/title',a[1]);
  else if(cmd==='wkeep')bad=await wkeep(a[0]);
  else if(cmd==='vis')bad=await vis(a[0],a[1]);
  else if(cmd==='perfpage')bad=perfpage(a[0]);
  else if(cmd==='entry')bad=await entry(a[0]);
  else if(cmd==='b5mx')bad=await b5mx(a[0],a[1]);
  else if(cmd==='qcmp')bad=await qcmp(a[0],a[1],a[2]);
  else if(cmd==='fsil')bad=await fsil(a[0],a.slice(1).length?a.slice(1):[path.join(ROOT,'index.html')]);
  else if(cmd==='vcmp')bad=await vcmp(a[0],a[1],a[2]);
  else if(cmd==='bakems')bad=await bakems(a[0]);
  else if(cmd==='bakecmp')bad=await bakecmp(a[0],a[1]);
  else if(cmd==='bclear')bad=await bclear(a[0]);
  else if(cmd==='pstate')bad=await pstate(a[0]);
  else if(cmd==='menu')bad=await menu(a[0]);
  else if(cmd==='mshot')await mshot(a[0]||'menu',a[1]);
  else if(cmd==='fontbake')bad=await fontbake(a[0]);
  else if(cmd==='bench')await bench(a[0],a[1],+a[2]||1);
  else if(cmd==='shot')await shot(a[0],a[1],a[2],a[3],a[4]||0,a[5]);
  else if(cmd==='sheet')await sheet(a[0],a[1]||'low',a[2],a[3]||undefined,a[4]);
  else if(cmd==='fshot')await fshot(a[0],a[1]||undefined,a[2]);
  else if(cmd==='fall')await fall(a[0]);
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
  else if(cmd==='b3fx')await b3fx(a[0],a[1]);
  else if(cmd==='b10seg')bad=await b10seg(a[0]);
  else if(cmd==='b10fx')bad=await b10fx(a[0],a[1]);
  else if(cmd==='b10fx2')bad=await b10fx2(a[0]||'fx',a[1],a[2]);
  else if(cmd==='b10hop')bad=await b10hop(a[0]);
  else if(cmd==='b5fx')bad=await b5fx(a[0],a[1]);
  else if(cmd==='b5hit')await b5hit(a[0],a[1]);
  else if(cmd==='b7hit')await b7hit(a[0],a[1]);
  else if(cmd==='b1hit')await b1hit(a[0],a[1]);
  else if(cmd==='b9hit')await b9hit(a[0],a[1]);
  else if(cmd==='b4hit')await b4hit(a[0],a[1]);
  else if(cmd==='b6hit')await b6hit(a[0],a[1]);
  else if(cmd==='b6fx')bad=await b6fx(a[0]||'b6fx.png',a[1]);
  else if(cmd==='b4reach')bad=await b4reach(a[0]);
  else if(cmd==='b4fx')bad=await b4fx(a[0]||'b4fx.png',a[1]);
  else if(cmd==='b9fx')bad=await b9fx(a[0]||'b9fx.png',a[1]);
  else if(cmd==='b9perf')await b9perf(a[0]);
  else if(cmd==='b1fx')bad=await b1fx(a[0]||'b1fx.png',a[1]);
  else if(cmd==='b1perf')await b1perf(a[0]);
  else if(cmd==='b7fx')bad=await b7fx(a[0]||'b7fx.png',a[1]);
  else if(cmd==='b10fx3')bad=await b10fx3(a[0]||'fx',a[1],a[2]);
  else if(cmd==='bseq')await bseq(a[0],a[1]||8,(a[2]||'').split(',').filter(v=>v).map(Number),(a[3]||'').split(',').filter(v=>v).map(Number),(a[4]||'0,0,512,288').split(',').map(Number),a[5]);
  else if(cmd==='strand')bad=await strand(a[0],a[1],a[2]);
  else if(cmd==='vshift')await vshift(a[0]||50,a[1]||'vshift',a[2]||undefined,a[3]);
  else{console.log(require('fs').readFileSync(__filename,'utf8').split('\n').slice(0,10).join('\n'));}
  process.exit(bad?1:0);})();
