// 3 王:原圖 1536x1024 → 縮 1/3(3x3 區塊多數決去洋紅)→ k-means 壓色
// 用法:node down.js <輸入檔名(art-src 內)> <輸出名> <色數> <y0> <y1> [bg]
//   bg:背景模式,灰色(地面與牆)與藍色水面帶也視為透明
// 輸出 <輸出名>.png(透明底,512 寬、y0~y1)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const [inp,outn,NCs,y0s,y1s,mode]=process.argv.slice(2);const NC=+NCs,Y0=+y0s,Y1=+y1s;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const src='data:image/webp;base64,'+fs.readFileSync(__dirname+'/../'+inp).toString('base64');
const r=await pg.evaluate(async([src,NC,Y0,Y1,bgm])=>{const im=new Image();im.src=src;await im.decode();
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 const D=x.getImageData(0,0,c.width,c.height).data,SW=c.width;
 const W=512,H=Y1-Y0,o=new Float32Array(W*H*3),a=new Uint8Array(W*H);
 const skip=(r,g,b)=>(r>170&&b>170&&g<100)||(bgm&&((Math.abs(r-96)<14&&Math.abs(g-96)<14&&Math.abs(b-96)<14)||(b>200&&r<90&&g<130)||(g>200&&b>200&&r<80)));
 for(let y=0;y<H;y++)for(let i=16;i<496;i++){let n=0,R=0,G=0,B=0;
   for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const k=(((y+Y0)*3+dy)*SW+i*3+dx)*4;if(skip(D[k],D[k+1],D[k+2]))continue;n++;R+=D[k];G+=D[k+1];B+=D[k+2];}
   if(n>=5){const q=y*W+i;a[q]=1;o[q*3]=R/n;o[q*3+1]=G/n;o[q*3+2]=B/n;}}
 const px=[];for(let q=0;q<W*H;q++)if(a[q])px.push(q);
 // 初始中心:依亮度排序取分位,避免小面積亮色(眼睛)被吃掉
 const srt=px.slice().sort((p,q)=>(o[p*3]+o[p*3+1]+o[p*3+2])-(o[q*3]+o[q*3+1]+o[q*3+2]));
 let C=[];for(let k=0;k<NC;k++){const q=srt[Math.floor((k+0.5)/NC*srt.length)];C.push([o[q*3],o[q*3+1],o[q*3+2]]);}
 const lab=new Int32Array(W*H);
 for(let it=0;it<14;it++){const S=C.map(()=>[0,0,0,0]);
  for(const q of px){let b=0,bd=1e9;for(let k=0;k<NC;k++){const d=(o[q*3]-C[k][0])**2+(o[q*3+1]-C[k][1])**2+(o[q*3+2]-C[k][2])**2;if(d<bd){bd=d;b=k;}}lab[q]=b;S[b][0]+=o[q*3];S[b][1]+=o[q*3+1];S[b][2]+=o[q*3+2];S[b][3]++;}
  C=C.map((c,k)=>S[k][3]?[S[k][0]/S[k][3],S[k][1]/S[k][3],S[k][2]/S[k][3]]:c);}
 C=C.map(c=>c.map(Math.round));
 const oc=document.createElement('canvas');oc.width=W;oc.height=H;const ox=oc.getContext('2d'),oi=ox.createImageData(W,H);
 for(const q of px){const col=C[lab[q]];oi.data[q*4]=col[0];oi.data[q*4+1]=col[1];oi.data[q*4+2]=col[2];oi.data[q*4+3]=255;}
 ox.putImageData(oi,0,0);return {png:oc.toDataURL(),C};},[src,NC,Y0,Y1,mode==='bg']);
fs.writeFileSync(__dirname+'/'+outn+'.png',Buffer.from(r.png.split(',')[1],'base64'));
console.log(outn,'colors',r.C.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')).join(' '));
await br.close();})();
