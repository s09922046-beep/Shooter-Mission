// 9 王場景第 2 版修圖(11/10,使用者選第 4 張 boss9-arena2-b.webp 並同意 Claude 修圖)→ boss9-arena2-fix.png(原尺寸 1536×1024,再交給 down.js 縮圖)
//  地球球心 (408,202)、半徑 169(原圖座標,由像素掃描量得)。
//  1. 晝區左下緣多出一圈亮藍大氣邊(看起來像第二個圓):球內距球心 < R-12 的亮藍邊改成白天海洋色
//  2. 夜側外緣一圈與海洋同色的亮環(再一個圓):x<305 且在外緣 12 像素內改成暗一階的夜側邊緣色
//  3. 夜側方塊字形狀的城市燈光抹成夜色,改點 4 顆暗淡單點(各 3×3 = 遊戲 1 像素)
// 用法:node arenafix.js
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const r=await pg.evaluate(async s=>{const im=new Image();im.src=s;await im.decode();const c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');x.drawImage(im,0,0);
 const g=x.getImageData(0,0,1536,1024),D=g.data,CX=408,CY=202,R=169;
 const OCEAN=[36,61,89],NIGHT=[10,23,39],EDGE=[17,33,52],CITY=[70,90,120];
 const set=(i,c)=>{D[i]=c[0];D[i+1]=c[1];D[i+2]=c[2];};
 for(let y=CY-R-4;y<=CY+R+4;y++)for(let X=CX-R-4;X<=CX+R+4;X++){const i=(y*1536+X)*4,r=D[i],gg=D[i+1],b=D[i+2],d=Math.hypot(X-CX,y-CY);
   if(d>R+1)continue;
   const rim=b>195&&gg>155&&r<125;   // 只抓大氣邊 (111,170,214),不含雲 (131,153,175)
   if(rim&&d<R-12){set(i,OCEAN);continue;}
   if(X<305&&d>R-12&&r<45&&b>55&&b<100){set(i,EDGE);continue;}
   if(X<330&&b>120&&r<110&&gg<150&&d<R-12)set(i,NIGHT);}
 for(const [X,Y] of [[276,150],[288,159],[282,258],[297,264]])for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++)set(((Y+dy)*1536+X+dx)*4,CITY);
 x.putImageData(g,0,0);return c.toDataURL();},'data:image/webp;base64,'+fs.readFileSync(__dirname+'/../boss9-arena2-b.webp').toString('base64'));
fs.writeFileSync(__dirname+'/../boss9-arena2-fix.png',Buffer.from(r.split(',')[1],'base64'));console.log('已輸出 boss9-arena2-fix.png');await br.close();})();
