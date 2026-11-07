// 5 王版型底圖(遊戲座標 ×12,1024x1024;只畫魔王本體,場景由程式畫)
// 輸出 art-src/boss5-body-template.png
// 洋紅=空白;白虛線=碰撞判定 76x60(遊戲在框邊畫淡力場殼,不要畫到線外);橘框=本體要畫在框內(68x52);
// 紅框=雷射鏡頭眼(核心,12x12,位於判定框正中,環狀雷射從這裡發出);黃圈=小蜂出口(判定框內 20,30),必須是一個艙門
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{const S=12,OX=56,OY=152,c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d');
 x.fillStyle='#ff00ff';x.fillRect(0,0,1024,1024);
 const R=(X,Y,w,h)=>[OX+X*S,OY+Y*S,w*S,h*S];
 x.setLineDash([24,14]);x.strokeStyle='#ffffff';x.lineWidth=6;x.strokeRect(...R(0,0,76,60));x.setLineDash([]);
 x.strokeStyle='#ff8a00';x.lineWidth=8;x.strokeRect(...R(4,4,68,52));
 x.strokeStyle='#ff0000';x.lineWidth=8;x.strokeRect(...R(32,24,12,12));
 x.strokeStyle='#ffff00';x.lineWidth=6;x.beginPath();x.arc(OX+20*S,OY+30*S,5*S,0,2*Math.PI);x.stroke();
 return c.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/../boss5-body-template.png',Buffer.from(d,'base64'));await br.close();})();
