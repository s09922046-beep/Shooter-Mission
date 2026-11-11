// 4 王版型底圖(11/11),輸出 art-src/boss4-body-template.png 與 boss4-arena-template.png
// 本體:遊戲座標 ×5,1536x1024,畫布左上角 = 遊戲 (230,-12)(涵蓋 x 230~537、y -12~192)。
//   洋紅=空白;青線=畫面上緣與右緣(右緣內側 16 像素是牆);橘框=身體與翼可以畫的角落(x>=380 且 y<=90,往上、往右延伸出畫面);
//   白框=蛇頭判定 46x34(示意位置 headY=100;頭骨要貼滿這個框,朝左);紅圈=眼窩魂火(核心,中心 410,110);
//   白虛線帶=蛇頭上下移動的範圍(y 20~184,頸要能伸到);綠虛線=右繩梯第 21 欄(只供對照,不畫);橘框外只准畫頸與頭骨
// 場景:遊戲座標 ×3,1536x1024(畫面 512x288 對應上方 1536x864)。
//   深褐灰=要畫峽谷的範圍;淺灰=左右牆;青線=地面 y=224;白虛線=兩層骨板橋與兩條脊椎骨鏈(遊戲另畫);
//   橘虛線=骨龍出現的兩個上角(左右鏡像,保持素淡);淺藍虛線=視覺焦點(遠方巨大龍骨);黃虛線=左右對稱的屍骨堆位置
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{const out={};
 {const S=5,OX=230,OY=-12,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  const R=(X,Y,w,h)=>[(X-OX)*S,(Y-OY)*S,w*S,h*S];
  x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);
  x.setLineDash([24,14]);x.strokeStyle='#ffffff';x.lineWidth=5;x.strokeRect(...R(396,20,46,164));    // 蛇頭移動範圍
  x.strokeStyle='#3fff6a';x.strokeRect(...R(336,96,16,128));x.setLineDash([]);
  x.strokeStyle='#ff8a00';x.lineWidth=10;x.strokeRect((380-OX)*S,-10,1536,(90-OY)*S+10);            // 身體與翼可畫的角落
  x.strokeStyle='#00ffff';x.lineWidth=6;x.beginPath();x.moveTo(0,(0-OY)*S);x.lineTo(1536,(0-OY)*S);x.moveTo((512-OX)*S,0);x.lineTo((512-OX)*S,1024);
  x.moveTo((496-OX)*S,0);x.lineTo((496-OX)*S,1024);x.stroke();
  x.strokeStyle='#ffffff';x.lineWidth=10;x.strokeRect(...R(396,100,46,34));                          // 頭骨
  x.strokeStyle='#ff0000';x.lineWidth=8;x.beginPath();x.arc((410-OX)*S,(110-OY)*S,5*S,0,2*Math.PI);x.stroke();
  out.body=c.toDataURL().split(',')[1];}
 {const S=3,TS=16,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#3a3430';x.fillRect(0,0,1536,1024);
  x.fillStyle='#909090';x.fillRect(0,0,TS*S,1024);x.fillRect(496*S,0,TS*S,1024);
  x.fillStyle='#00ffff';x.fillRect(TS*S,224*S-3,480*S,6);
  const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
  dash(3*TS,9*TS,18*TS,6,'#ffffff',4);dash(5*TS,5*TS,14*TS,6,'#ffffff',4);
  dash(21*TS,6*TS,TS,8*TS,'#ffffff',4);dash(2*TS,2*TS,TS,7*TS,'#ffffff',4);
  dash(380,0,132,90,'#ff8a00',8);dash(0,0,132,90,'#ff8a00',8);
  dash(150,20,212,130,'#7ad0ff',8);
  dash(20,176,110,48,'#ffd23a',6);dash(382,176,110,48,'#ffd23a',6);
  out.arena=c.toDataURL().split(',')[1];}
 return out;});
const fs=require('fs');fs.writeFileSync(__dirname+'/../boss4-body-template.png',Buffer.from(d.body,'base64'));fs.writeFileSync(__dirname+'/../boss4-arena-template.png',Buffer.from(d.arena,'base64'));await br.close();})();
