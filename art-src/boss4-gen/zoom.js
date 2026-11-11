// 檢視用:把 PNG 的某區域最近鄰放大存檔。用法:node zoom.js 輸入 x y w h 倍數 輸出
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const [f,x,y,w,h,s,o]=process.argv.slice(2);
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(async([src,x,y,w,h,s])=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=w*s;c.height=h*s;const g=c.getContext('2d');g.fillStyle='#2a2620';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;g.drawImage(im,x,y,w,h,0,0,w*s,h*s);
 g.strokeStyle='rgba(255,255,255,.12)';for(let i=0;i<=w;i+=10){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h*s);g.stroke();}for(let i=0;i<=h;i+=10){g.beginPath();g.moveTo(0,i*s);g.lineTo(w*s,i*s);g.stroke();}
 return c.toDataURL().split(',')[1];},['data:image/png;base64,'+fs.readFileSync(f).toString('base64'),+x,+y,+w,+h,+s]);
fs.writeFileSync(o,Buffer.from(d,'base64'));await br.close();})();
