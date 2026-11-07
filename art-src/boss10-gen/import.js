// 把使用者提供的 GPT 原圖(PNG)轉成 webp 存進 art-src,並印出各圖主要顏色(取樣統計)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const fs=require('fs'),S='D:/AI圖片生成/射擊遊戲專案/10王/',A=__dirname+'/../';
const M=[['巨劍騎士六姿動作表.png','boss10-poses'],['黑曜石騎士王與垂直巨劍-2.png','boss10-main'],['破冠黑曜石終焉騎士王-1.png','boss10-main-alt'],
 ['黑曜騎士紅色胸徽剪影.png','boss10-silhouette'],['破碎黑曜石王面三式.png','boss10-faces'],['洋紅天幕下的裂隙殘城.png','boss10-arena-x'],['洋紅天空下的末日遺城.png','boss10-arena-y']];
(async()=>{const br=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
for(const [f,n] of M){const src='data:image/png;base64,'+fs.readFileSync(S+f).toString('base64');
  const r=await pg.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
    const D=x.getImageData(0,0,c.width,c.height).data,h={};for(let i=0;i<D.length;i+=4*7){const k=(D[i]>>4)+','+(D[i+1]>>4)+','+(D[i+2]>>4);h[k]=(h[k]||0)+1;}
    const top=Object.entries(h).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>k.split(',').map(z=>z*16+8).join('/')+':'+v);
    const p=x.getImageData(700,470,1,1).data;
    return {w:im.width,h:im.height,top,band:[p[0],p[1],p[2]],webp:c.toDataURL('image/webp',0.95).split(',')[1]};},src);
  fs.writeFileSync(A+n+'.webp',Buffer.from(r.webp,'base64'));console.log(n,r.w+'x'+r.h,'(700,470)='+r.band.join(','),'\n  '+r.top.join(' '));}
await br.close();})();
