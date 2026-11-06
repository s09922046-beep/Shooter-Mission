// 8 王場景版型底圖(遊戲座標 ×3,1536x1024):洋紅=天空、灰=地面與牆、青線=地表、白虛線=平台與繩梯、黃框=命匣提燈、橘框=大墓碑
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{const S=3,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
 x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);x.fillStyle='#606060';
 x.fillRect(0,0,16*S,1024);x.fillRect(496*S,0,16*S,1024);x.fillRect(0,240*S,1536,1024);
 x.fillStyle='#00ffff';x.fillRect(16*S,240*S-3,480*S,6);
 const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
 dash(20,4,472,52,'#3a8aff');                                  // 上方保留天空
 for(const [a,b,r] of [[2,7,11],[11,16,9],[20,25,11],[6,12,5],[18,24,6],[28,30,3]])dash(a*16,r*16,(b-a+1)*16,16,'#ffffff');
 for(const [cl,y0,y1] of [[9,2,10],[18,2,10],[27,3,14]])dash(cl*16,y0*16,16,(y1-y0+1)*16,'#ffffff');
 x.strokeStyle='#ffff00';x.lineWidth=6;for(const [a,b] of [[48,146],[208,114],[352,146],[112,50],[336,66],[448,18]])x.strokeRect(a*S,b*S,14*S,14*S);
 x.strokeStyle='#ff8a00';x.lineWidth=8;x.strokeRect(224*S,92*S,42*S,52*S);  // 大墓碑:立在正中平台上
 return c.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/../boss8-arena-template.png',Buffer.from(d,'base64'));await br.close();})();
