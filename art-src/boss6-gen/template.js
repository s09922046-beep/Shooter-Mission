// 6 王場景版型底圖(遊戲座標 ×3,1536x1024;遊戲畫面只用到上方 288×3=864):灰=地面與牆、青線=地表 y=224、白虛線=平台與鐵鍊、
// 藍虛線=上方高窗帶、綠框=壁畫、橘框=唱詩高台的支撐結構、紫框=兩側殘幔、黃框=詠嘆者站位、紅框=騎士起始位置
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{const S=3,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
 x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);x.fillStyle='#606060';
 x.fillRect(0,0,16*S,1024);x.fillRect(496*S,0,16*S,1024);x.fillRect(0,224*S,1536,1024);
 x.fillStyle='#00ffff';x.fillRect(16*S,224*S-3,480*S,6);
 const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
 const solid=(X,Y,w,h,col)=>{x.strokeStyle=col;x.lineWidth=8;x.strokeRect(X*S,Y*S,w*S,h*S);};
 dash(20,4,472,40,'#3a8aff');                                   // 上方高窗帶
 solid(128,48,136,104,'#00c040');                               // 壁畫(x 128~264、y 48~152:兩條鐵鍊之間、左平台上方)
 solid(340,130,136,94,'#ff8a00');                               // 唱詩高台下方的支撐結構(平台第 7 列第 21~29 欄之下)
 solid(18,4,40,150,'#b040ff');solid(454,4,40,96,'#b040ff');     // 兩側殘幔
 dash(21*16,7*16,9*16,16,'#ffffff');dash(4*16,10*16,8*16,16,'#ffffff');           // 平台
 dash(6*16,2*16,16,12*16,'#ffffff');dash(17*16,2*16,16,12*16,'#ffffff');          // 鐵鍊(第 6、17 欄第 2~13 列)
 x.strokeStyle='#ffff00';x.lineWidth=6;x.strokeRect(400*S,86*S,18*S,26*S);        // 詠嘆者
 x.strokeStyle='#ff3030';x.strokeRect(330*S,194*S,22*S,30*S);                     // 騎士起始位置
 return c.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/../boss6-arena-template.png',Buffer.from(d,'base64'));await br.close();})();
