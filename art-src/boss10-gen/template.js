// 10 王第 1、2 段場景版型底圖(遊戲座標 ×3,1536x1024;遊戲畫面 512x288 對應上方 1536x864)
// 輸出 boss10-arena-template.png
// 洋紅=天空(遊戲自畫,含碎月)、灰=遊戲畫的黑曜地面與兩側牆、青線=地表線 y=224、白虛線=平台與繩梯、黃虛線圓=碎月位置、橘虛線=雕像站位
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const out=await pg.evaluate(()=>{const S=3,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);
  x.fillStyle='#606060';x.fillRect(0,0,16*S,1024);x.fillRect(496*S,0,16*S,1024);x.fillRect(0,224*S,1536,1024);
  x.fillStyle='#00ffff';x.fillRect(16*S,224*S-3,480*S,6);                         // 地表線 y=224
  const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
  dash(6*16,144,7*16,16,'#ffffff');dash(19*16,144,7*16,16,'#ffffff');            // 兩座平台(第 9 列)
  for(const v of[4,16,28])dash(v*16,32,16,192,'#ffffff');                       // 三條繩梯(第 2~13 列)
  x.setLineDash([18,10]);x.strokeStyle='#ffff00';x.lineWidth=6;x.beginPath();x.arc(256*S,56*S,52*S,0,6.283);x.stroke();x.setLineDash([]); // 碎月(遊戲畫)
  dash(326,176,52,48,'#ff8a00',6);                                               // 雕像站位(遊戲畫)
  dash(16,150,480,74,'#3a6aff',6);                                               // 藍虛線:地平線帶(主要畫在這裡)
  return c.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/../boss10-arena-template.png',Buffer.from(out,'base64'));await br.close();})();
