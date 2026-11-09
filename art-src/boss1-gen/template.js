// 1 王版型底圖(11/9),輸出 art-src/boss1-body-template.png 與 boss1-arena-template.png
// 本體:遊戲座標 ×6,1536x1024,畫布左上角 = 遊戲 (300,-20)。
//   洋紅=空白;橘框=可以畫的範圍(x>=340 且 y<=138,往上、往右延伸出畫面);白虛線=艦體碰撞判定 160x112(要整塊填滿,左緣與下緣貼齊);
//   青線=畫面上緣與右緣(艦體越過這條線繼續畫到畫布邊);藍框=三片裝甲板 36x26;紅框=核心 40x40;黃圈=機庫艙門(無人機出生點 y=50、110)
// 場景:遊戲座標 ×3,1536x1024(畫面 512x288 對應上方 1536x864)。
//   洋紅=天空(遊戲畫);灰=左右牆;藍=地面(殘骸甲板,遊戲畫,地表 y=208);白虛線=平台與鐵鍊(第 7、18 欄);
//   橘虛線=魔王所在(遊戲畫,背景只留天空與遠方地平線);淺藍虛線=遠景同型巨艦殘骸的位置
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{const out={};
 {const S=6,OX=300,OY=-20,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);
  const R=(X,Y,w,h)=>[(X-OX)*S,(Y-OY)*S,w*S,h*S];
  x.strokeStyle='#ff8a00';x.lineWidth=10;x.strokeRect((340-OX)*S+5,-10,1536,(138-OY)*S+5+10);
  x.strokeStyle='#00ffff';x.lineWidth=6;x.beginPath();x.moveTo(0,(0-OY)*S);x.lineTo(1536,(0-OY)*S);x.moveTo((512-OX)*S,0);x.lineTo((512-OX)*S,1024);x.stroke();
  x.setLineDash([24,14]);x.strokeStyle='#ffffff';x.lineWidth=6;x.strokeRect(...R(340,26,160,112));x.setLineDash([]);
  x.strokeStyle='#3a8cff';x.lineWidth=8;for(const y of [34,66,98])x.strokeRect(...R(358,y,36,26));
  x.strokeStyle='#ff0000';x.lineWidth=8;x.strokeRect(...R(410,56,40,40));
  x.strokeStyle='#ffff00';x.lineWidth=6;for(const y of [55,115]){x.beginPath();x.arc((348-OX)*S,(y-OY)*S,6*S,0,2*Math.PI);x.stroke();}
  out.body=c.toDataURL().split(',')[1];}
 {const S=3,TS=16,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);
  x.fillStyle='#606060';x.fillRect(0,0,TS*S,1024);x.fillRect(496*S,0,TS*S,1024);
  x.fillStyle='#3a6aff';x.fillRect(TS*S,208*S,480*S,1024-208*S);
  x.fillStyle='#00ffff';x.fillRect(TS*S,208*S-3,480*S,6);
  const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
  dash(12*TS,9*TS,4*TS,TS,'#ffffff');dash(17*TS,6*TS,4*TS,TS,'#ffffff');
  dash(7*TS,3*TS,TS,10*TS,'#ffffff');dash(18*TS,3*TS,TS,10*TS,'#ffffff');
  dash(340,0,172,140,'#ff8a00',8);
  dash(24,92,300,112,'#7ad0ff',8);
  out.arena=c.toDataURL().split(',')[1];}
 return out;});
const fs=require('fs');fs.writeFileSync(__dirname+'/../boss1-body-template.png',Buffer.from(d.body,'base64'));fs.writeFileSync(__dirname+'/../boss1-arena-template.png',Buffer.from(d.arena,'base64'));await br.close();})();
