// 4 王場景修圖(11/11 使用者同意):GPT 把兩個上角(骨龍出現處)留成純暗色方塊,改為延伸下方峭壁。
//  方塊範圍(原圖 ×3 座標):左 x48~404、右 x1133~1488,y0~271。每一欄由方塊下緣往上,以「往返折返」方式取下方峭壁同一欄的像素
//  (src y = 272+折返(k),折返長度 190,避開下方屍骨堆),越往上越暗(×0.92→×0.70),表現頭頂懸壁背光。
//  方塊左右邊界與原圖交接處 8 像素內以 Bayer 混合,避免硬邊。
//  輸出 art-src/boss4-arena-fix.png。用法:node arenafix.js
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const W=im.width,H=im.height,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(im,0,0);
 const I=x.getImageData(0,0,W,H),D=I.data,S=new Uint8ClampedArray(D);
 const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
 const Y1=272,L=190,pp=k=>{const m=k%(2*L);return m<L?m:2*L-1-m;};
 for(const [x0,x1,inner] of [[48,404,404],[1133,1488,1133]])
  for(let y=0;y<Y1;y++)for(let X=x0;X<x1;X++){
   const k=Y1-1-y,sy=Y1+pp(k),si=(sy*W+X)*4,q=(y*W+X)*4,f=0.92-0.22*(1-y/Y1);
   const dEdge=Math.abs(X-inner);if(dEdge<8&&BY[(y&3)*4+(X&3)]/16<(8-dEdge)/8*0.5)continue;   // 與原圖峭壁交接處混合
   D[q]=S[si]*f;D[q+1]=S[si+1]*f;D[q+2]=S[si+2]*f;}
 x.putImageData(I,0,0);return c.toDataURL().split(',')[1];},'data:image/webp;base64,'+fs.readFileSync(__dirname+'/../boss4-arena.webp').toString('base64'));
fs.writeFileSync(__dirname+'/../boss4-arena-fix.png',Buffer.from(d,'base64'));console.log('已存 art-src/boss4-arena-fix.png');await br.close();})();
