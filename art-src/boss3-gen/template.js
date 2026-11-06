// 3 王版型底圖(遊戲座標 ×3,1536x1024;遊戲畫面 512x288 對應上方 1536x864)
// 輸出 boss3-body-template.png(本體)與 boss3-arena-template.png(場景)
// 洋紅=空白、灰=地面與牆、藍=水面帶(第 13 列)、白虛線=遊戲自畫的觸手繩梯、橘框=本體、紅框=眼縫(豎瞳判定 56x44)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const out=await pg.evaluate(()=>{const S=3;
 const mk=(body)=>{const c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);
  x.fillStyle='#606060';x.fillRect(0,0,16*S,1024);x.fillRect(496*S,0,16*S,1024);x.fillRect(0,224*S,1536,1024);
  x.fillStyle='#3a6aff';x.fillRect(16*S,208*S,480*S,16*S);                     // 水面帶(遊戲畫水與倒影)
  x.fillStyle='#00ffff';x.fillRect(16*S,208*S-3,480*S,6);                       // 水面線 y=208
  const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
  for(const c of[6,26])dash(c*16,0,16,208,'#ffffff');                           // 左右觸手:由遠方伸來,可爬到頂
  for(const c of[11,16,21])dash(c*16,80,16,128,'#ffffff');                     // 中間三條:由本體垂下
  if(body){x.strokeStyle='#ff8a00';x.lineWidth=8;x.strokeRect(120*S,0,272*S,84*S); // 本體範圍(上緣切出畫面)
   x.strokeStyle='#ff2020';x.lineWidth=8;x.strokeRect(230*S,24*S,56*S,44*S);}      // 眼縫
  else{dash(120,0,272,84,'#ff8a00',8);                                          // 本體位置:畫洞頂岩壁,細節要少
   dash(24,0,64,34,'#ffff00',6);}                                               // 黃虛線:左上頂部裂口(保留洋紅,遊戲畫夜空與月光;避開本體與左觸手)
  return c.toDataURL().split(',')[1];};
 return [mk(true),mk(false)];});
const fs=require('fs');fs.writeFileSync(__dirname+'/../boss3-body-template.png',Buffer.from(out[0],'base64'));
fs.writeFileSync(__dirname+'/../boss3-arena-template.png',Buffer.from(out[1],'base64'));await br.close();})();
