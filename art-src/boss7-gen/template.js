// 7 王場景版型底圖(遊戲座標 ×3,1536x1024;遊戲畫面 512x288 對應上方 1536x864)
// 輸出 art-src/boss7-arena-template.png
// 洋紅=空白(天空由遊戲畫:破曉前藍調抖色漸層與壓在地平線的朝陽);灰=左右牆;藍=淺溪水面帶(地面第 15~17 列,遊戲畫溪石、水面與倒影);
// 白虛線=遊戲自畫的長苔石板平台與垂藤;橘虛線=垂藤上端要有樹冠或樹枝遮住(藤從這裡垂下);黃虛線=魔王活動範圍(背景細節要少、明度要低)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{const S=3,TS=16,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
 x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);
 x.fillStyle='#606060';x.fillRect(0,0,TS*S,1024);x.fillRect(496*S,0,TS*S,1024);
 x.fillStyle='#3a6aff';x.fillRect(TS*S,240*S,480*S,1024-240*S);                 // 淺溪(地面 y=240 以下)
 x.fillStyle='#00ffff';x.fillRect(TS*S,240*S-3,480*S,6);                         // 水面線 y=240
 const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
 for(const [a,b,r] of[[3,9,12],[13,19,10],[22,28,12],[9,16,6]])dash(a*TS,r*TS,(b-a+1)*TS,TS,'#ffffff');   // 單向平台
 dash(11*TS,2*TS,TS,8*TS,'#ffffff');dash(21*TS,2*TS,TS,10*TS,'#ffffff');         // 垂藤(第 11、21 欄)
 dash(8*TS,0,7*TS,2*TS+8,'#ff8a00',8);dash(18*TS,0,7*TS,2*TS+8,'#ff8a00',8);       // 樹冠:藤的上端
 dash(150,20,190,100,'#ffff00',6);                                               // 魔王活動範圍
 return c.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/../boss7-arena-template.png',Buffer.from(d,'base64'));await br.close();})();
