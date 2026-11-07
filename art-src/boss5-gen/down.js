// 5 王精靈自動縮圖(11/7):boss5-main.webp(1254×1254,版型底圖 1024 的 1.2246 倍)→ 判定框 76×60 的字元矩陣
// 每個遊戲像素 = 原圖 14.7×14.7 區塊;非洋紅像素先 k-means 分 9 色,區塊內外框色 ≥30% 取外框,否則取眾數;洋紅 >50% 為空白
// 輸出 down.json(矩陣與調色盤)與 down.png(×8 檢視);手修在 build.js
// 用法:node down.js
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const src='data:image/webp;base64,'+fs.readFileSync(path.join(__dirname,'../boss5-main.webp')).toString('base64');
const r=await pg.evaluate(async src=>{const im=new Image();await new Promise(ok=>{im.onload=ok;im.src=src;});
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 const D=x.getImageData(0,0,c.width,c.height).data,Wd=c.width;
 const mag=(r,g,b)=>r>170&&b>170&&g<110;
 // k-means
 const sm=[];for(let i=0;i<D.length;i+=4*37){const r=D[i],g=D[i+1],b=D[i+2];if(!mag(r,g,b))sm.push([r,g,b]);}
 let K=[[20,20,20],[70,70,70],[110,110,110],[170,170,170],[215,215,215],[245,245,245],[0,230,240],[210,10,20],[140,10,15]];
 for(let it=0;it<12;it++){const s=K.map(()=>[0,0,0,0]);for(const p of sm){let bi=0,bd=1e9;K.forEach((k,j)=>{const d=(p[0]-k[0])**2+(p[1]-k[1])**2+(p[2]-k[2])**2;if(d<bd){bd=d;bi=j;}});s[bi][0]+=p[0];s[bi][1]+=p[1];s[bi][2]+=p[2];s[bi][3]++;}
  K=K.map((k,j)=>s[j][3]?[s[j][0]/s[j][3],s[j][1]/s[j][3],s[j][2]/s[j][3]]:k);}
 const cls=(r,g,b)=>{if(mag(r,g,b))return -1;let bi=0,bd=1e9;K.forEach((k,j)=>{const d=(r-k[0])**2+(g-k[1])**2+(b-k[2])**2;if(d<bd){bd=d;bi=j;}});return bi;};
 const f=1254/1024,S=12*f,OX=56*f,OY=152*f,GW=76,GH=60,CH='OABCDEFGH';
 const rows=[];
 for(let gy=0;gy<GH;gy++){let row='';for(let gx=0;gx<GW;gx++){const cnt=new Array(10).fill(0);let n=0;
   for(let sy=Math.floor(OY+gy*S);sy<Math.floor(OY+(gy+1)*S);sy++)for(let sx=Math.floor(OX+gx*S);sx<Math.floor(OX+(gx+1)*S);sx++){const i=(sy*Wd+sx)*4;cnt[cls(D[i],D[i+1],D[i+2])+1]++;n++;}
   if(cnt[0]>n*0.5){row+='.';continue;}
   if(cnt[1]>=n*0.3){row+='O';continue;}
   let bi=2;for(let j=2;j<10;j++)if(cnt[j]>cnt[bi])bi=j;row+=CH[bi-1];}
  rows.push(row);}
 const pal={};K.forEach((k,j)=>pal[CH[j]]='#'+k.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''));
 const o=document.createElement('canvas');o.width=GW*8;o.height=GH*8;const y=o.getContext('2d');y.fillStyle='#ff00ff';y.fillRect(0,0,o.width,o.height);
 rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='.')return;y.fillStyle=pal[ch];y.fillRect(i*8,j*8,8,8);}));
 return {rows,pal,png:o.toDataURL().split(',')[1]};},src);
fs.writeFileSync(path.join(__dirname,'down.json'),JSON.stringify({rows:r.rows,pal:r.pal},null,1));
fs.writeFileSync(path.join(__dirname,'down.png'),Buffer.from(r.png,'base64'));
console.log(JSON.stringify(r.pal));console.log(r.rows.join('\n'));await br.close();})();
