// 8 王場景:原圖 1536x1024 → 縮 1/3(3x3 區塊多數決去洋紅)→ 只留 x16~495、y0~239 → k-means 壓色 → 切出大墓碑
// 輸出 arena.png(背景,墓碑處挖空)、tomb.png(大墓碑,含左上座標)、arena_view.png(檢查用)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NC=+process.argv[2]||12;
(async()=>{const br=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const src='data:image/webp;base64,'+fs.readFileSync(__dirname+'/../boss8-arena.webp').toString('base64');
const r=await pg.evaluate(async([src,NC])=>{const im=new Image();im.src=src;await im.decode();
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 const D=x.getImageData(0,0,c.width,c.height).data,SW=c.width;
 const W=512,H=240,o=new Float32Array(W*H*3),a=new Uint8Array(W*H);
 const mag=(r,g,b)=>r-g>60&&b-g>60;  // 含洋紅混色的邊緣也去掉
 for(let y=0;y<H;y++)for(let i=16;i<496;i++){let n=0,R=0,G=0,B=0;
   for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const k=((y*3+dy)*SW+i*3+dx)*4;if(mag(D[k],D[k+1],D[k+2]))continue;n++;R+=D[k];G+=D[k+1];B+=D[k+2];}
   if(n>=5){const q=y*W+i;a[q]=1;o[q*3]=R/n;o[q*3+1]=G/n;o[q*3+2]=B/n;}}
 // k-means
 const px=[];for(let q=0;q<W*H;q++)if(a[q])px.push(q);
 let C=[];for(let k=0;k<NC;k++){const q=px[Math.floor((k+0.5)/NC*px.length)];C.push([o[q*3],o[q*3+1],o[q*3+2]]);}
 const lab=new Int32Array(W*H);
 for(let it=0;it<12;it++){const S=C.map(()=>[0,0,0,0]);
  for(const q of px){let b=0,bd=1e9;for(let k=0;k<NC;k++){const d=(o[q*3]-C[k][0])**2+(o[q*3+1]-C[k][1])**2+(o[q*3+2]-C[k][2])**2;if(d<bd){bd=d;b=k;}}lab[q]=b;S[b][0]+=o[q*3];S[b][1]+=o[q*3+1];S[b][2]+=o[q*3+2];S[b][3]++;}
  C=C.map((c,k)=>S[k][3]?[S[k][0]/S[k][3],S[k][1]/S[k][3],S[k][2]/S[k][3]]:c);}
 C=C.map(c=>c.map(Math.round));
 // 墓碑:找 x 210~280、y 80~150 的不透明像素範圍
 let tx0=1e9,ty0=1e9,tx1=-1,ty1=-1;for(let y=80;y<150;y++)for(let i=210;i<280;i++)if(a[y*W+i]){tx0=Math.min(tx0,i);tx1=Math.max(tx1,i);ty0=Math.min(ty0,y);ty1=Math.max(ty1,y);}
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const bg=mk(W,H),bx=bg.getContext('2d'),bi=bx.createImageData(W,H);
 const tw=tx1-tx0+1,th=ty1-ty0+1,tc=mk(tw,th),tx=tc.getContext('2d'),ti=tx.createImageData(tw,th);
 for(let y=0;y<H;y++)for(let i=0;i<W;i++){const q=y*W+i;if(!a[q])continue;const col=C[lab[q]];
   const inT=i>=tx0&&i<=tx1&&y>=ty0&&y<=ty1&&y<150;
   const d=inT?ti.data:bi.data,k=inT?((y-ty0)*tw+(i-tx0))*4:q*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255;}
 bx.putImageData(bi,0,0);tx.putImageData(ti,0,0);
 const v=mk(W*2,H*2),vx=v.getContext('2d');vx.imageSmoothingEnabled=false;vx.fillStyle='#5a5070';vx.fillRect(0,0,W*2,H*2);vx.drawImage(bg,0,0,W*2,H*2);vx.drawImage(tc,tx0*2,ty0*2,tw*2,th*2);
 return {bg:bg.toDataURL(),tomb:tc.toDataURL(),view:v.toDataURL(),C,t:[tx0,ty0,tw,th]};},[src,NC]);
for(const k of ['bg','tomb','view'])fs.writeFileSync(__dirname+'/'+({bg:'arena',tomb:'tomb',view:'arena_view'})[k]+'.png',Buffer.from(r[k].split(',')[1],'base64'));
console.log('colors',r.C.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')).join(' '),'tomb',r.t,'bytes',r.bg.length,r.tomb.length);
await br.close();})();
