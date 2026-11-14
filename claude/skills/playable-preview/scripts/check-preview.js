#!/usr/bin/env node
// 交付預覽頁之前的自檢:用無頭瀏覽器開啟,逐一切到每個方案,收集執行錯誤並各存一張截圖。
// 用法:node check-preview.js <預覽頁.html> [截圖前綴] [setup.js] [每個方案等待毫秒,預設 800]
//   setup.js(可省略):每切到一個方案後在頁面內執行的程式,用來把畫面帶到要比較的場景(例如跳到某一關、按住某個鍵)。
// 需要 playwright(從目前資料夾或其下的 tools/ 尋找)與 Chrome;Chrome 不在預設位置時設 CHROME 環境變數。
// 截圖只用來確認「有畫出來、方案之間確實不同」;動態效果好不好,仍要由人實際操作判斷。
const fs=require('fs'),path=require('path');
const [file,pre='pv',setup,waitMs='800']=process.argv.slice(2);
if(!file){console.log('用法:node check-preview.js <預覽頁.html> [截圖前綴] [setup.js] [等待毫秒]');process.exit(1);}
let pw;try{pw=require(require.resolve('playwright',{paths:[process.cwd(),path.join(process.cwd(),'tools')]}));}
catch(e){console.log('找不到 playwright:請在專案(或其 tools/ 資料夾)執行 npm install playwright');process.exit(1);}
const CHROME=process.env.CHROME||{win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',darwin:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}[process.platform]||'/usr/bin/google-chrome';
(async()=>{
  const br=await pw.chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
  const pg=await br.newPage({viewport:{width:1280,height:720}});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto(require('url').pathToFileURL(path.resolve(file)).href);await pg.waitForTimeout(+waitMs);
  const names=await pg.evaluate(()=>window.__PV&&Array.isArray(__PV.names)&&typeof pvSet==='function'?__PV.names:null);
  if(!names){console.log('錯誤:頁面沒有 __PV 或 pvSet(不是 make-preview.js 產生的預覽頁,或 variants.js 執行失敗)',errs.slice(0,3));await br.close();process.exit(1);}
  const code=setup?fs.readFileSync(setup,'utf8'):'';let bad=0;
  for(let i=0;i<names.length;i++){const n0=errs.length;
    await pg.evaluate(i=>pvSet(i),i);
    if(code)await pg.evaluate(code);
    await pg.waitForTimeout(+waitMs);
    const p=pre+'-'+i+'.png';await pg.screenshot({path:p});
    const e=errs.slice(n0);if(e.length)bad++;
    console.log((e.length?'錯誤 ':'OK   ')+i+' '+names[i]+' → '+p+(e.length?'  '+e.length+' 則,第一則:'+e[0]:''));}
  await br.close();
  console.log(bad?'未通過:'+bad+' 個方案有執行錯誤':'通過:'+names.length+' 個方案都無執行錯誤(畫面是否正確請看截圖)');
  process.exit(bad?1:0);
})();
