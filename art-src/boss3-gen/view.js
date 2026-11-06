// 檢查用:背景加本體候選,×2 排成格狀。用法:node view.js 輸出 本體1 本體2 ...
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const [out,...bs]=process.argv.slice(2);
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const u=f=>'data:image/png;base64,'+fs.readFileSync(__dirname+'/'+f+'.png').toString('base64');
const d=await pg.evaluate(async([bg,bs])=>{const L=async s=>{const i=new Image();i.src=s;await i.decode();return i;};
 const B=await L(bg),n=bs.length,cols=n>1?2:1,rows=Math.ceil(n/cols),c=document.createElement('canvas');c.width=512*2*cols;c.height=240*2*rows;
 const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 for(let k=0;k<n;k++){const ox=(k%cols)*1024,oy=Math.floor(k/cols)*480;x.fillStyle='#10141c';x.fillRect(ox,oy,1024,480);
  x.drawImage(B,ox,oy,1024,416);x.fillStyle='#1a2a5a';x.fillRect(ox,oy+416,1024,32);x.drawImage(await L(bs[k]),ox,oy,1024,192);}
 return c.toDataURL().split(',')[1];},[u('arena'),bs.map(u)]);
fs.writeFileSync(__dirname+'/'+out+'.png',Buffer.from(d,'base64'));await br.close();})();
