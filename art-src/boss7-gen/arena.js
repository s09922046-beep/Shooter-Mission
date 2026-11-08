// 7 王場景(11/8 第 3 回):原圖 1536x1024(遊戲座標 ×3)
//  背景 boss7-arena.webp → 縮 1/3(3x3 區塊多數決去洋紅)→ 只留 x16~495、y0~239 → k-means 壓色 → arena.png(天空透明;遊戲另畫天空與朝陽)
//  淺溪 boss7-arena-stones.webp 的 y720~863(遊戲 y240~287)→ 縮 1/3 → 壓色並往溪水青綠靠攏 → stream.png(480x48;遊戲再疊水面線、波光與倒影)
// 用法:node arena.js [背景色數] [淺溪色數]
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NC=+process.argv[2]||10,NS=+process.argv[3]||6;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const ld=f=>'data:image/webp;base64,'+fs.readFileSync(__dirname+'/../'+f).toString('base64');
const r=await pg.evaluate(async([a,s,NC,NS])=>{
 const get=async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return {D:x.getImageData(0,0,c.width,c.height).data,SW:c.width};};
 const mag=(r,g,b)=>r-g>60&&b-g>60;
 function down({D,SW},x0,y0,W,H){const o=new Float32Array(W*H*3),al=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let i=0;i<W;i++){let n=0,R=0,G=0,B=0;
   for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const k=(((y0+y)*3+dy)*SW+(x0+i)*3+dx)*4;if(mag(D[k],D[k+1],D[k+2]))continue;n++;R+=D[k];G+=D[k+1];B+=D[k+2];}
   if(n>=5){const q=y*W+i;al[q]=1;o[q*3]=R/n;o[q*3+1]=G/n;o[q*3+2]=B/n;}}return {o,al,W,H};}
 function km({o,al,W,H},N){const px=[];for(let q=0;q<W*H;q++)if(al[q])px.push(q);
  const lum=q=>o[q*3]*.3+o[q*3+1]*.59+o[q*3+2]*.11;px.sort((p,q)=>lum(p)-lum(q));
  let C=[];for(let k=0;k<N;k++){const q=px[Math.floor((k+0.5)/N*px.length)];C.push([o[q*3],o[q*3+1],o[q*3+2]]);}
  const lab=new Int32Array(W*H);
  for(let it=0;it<14;it++){const S=C.map(()=>[0,0,0,0]);
   for(const q of px){let b=0,bd=1e9;for(let k=0;k<N;k++){const d=(o[q*3]-C[k][0])**2+(o[q*3+1]-C[k][1])**2+(o[q*3+2]-C[k][2])**2;if(d<bd){bd=d;b=k;}}lab[q]=b;S[b][0]+=o[q*3];S[b][1]+=o[q*3+1];S[b][2]+=o[q*3+2];S[b][3]++;}
   C=C.map((c,k)=>S[k][3]?[S[k][0]/S[k][3],S[k][1]/S[k][3],S[k][2]/S[k][3]]:c);}
  return {lab,C:C.map(c=>c.map(Math.round))};}
 const out=(g,C,lab,map)=>{const c=document.createElement('canvas');c.width=g.W;c.height=g.H;const x=c.getContext('2d'),im=x.createImageData(g.W,g.H);
  for(let q=0;q<g.W*g.H;q++){if(!g.al[q])continue;const col=map?map(C[lab[q]],q):C[lab[q]];im.data.set([col[0],col[1],col[2],255],q*4);}x.putImageData(im,0,0);return c;};
 const A=await get(a),S=await get(s);
 const ga=down(A,0,0,512,240);for(let y=0;y<240;y++)for(let i=0;i<512;i++)if(i<16||i>=496)ga.al[y*512+i]=0;   // 左右牆由遊戲畫
 const ka=km(ga,NC);const bg=out(ga,ka.C,ka.lab);
 const gs=down(S,16,240,480,48);const ks=km(gs,NS);
 const WT=[30,58,66];const sm=c=>c.map((v,j)=>Math.round(v*0.62+WT[j]*0.38*1.0));   // 溪底石頭隔著淺水:壓暗並往溪水青綠靠攏
 const st=out(gs,ks.C,ks.lab,sm);
 const v=document.createElement('canvas');v.width=1024;v.height=576;const vx=v.getContext('2d');vx.imageSmoothingEnabled=false;
 const g=vx.createLinearGradient(0,0,0,480);g.addColorStop(0,'#2e4a58');g.addColorStop(1,'#7a9a9c');vx.fillStyle=g;vx.fillRect(0,0,1024,480);
 vx.drawImage(bg,0,0,1024,480);vx.drawImage(st,32,480,960,96);
 const hx=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
 return {bg:bg.toDataURL(),st:st.toDataURL(),view:v.toDataURL(),ca:ka.C.map(hx),cs:ks.C.map(sm).map(hx)};},[ld('boss7-arena.webp'),ld('boss7-arena-stones.webp'),NC,NS]);
for(const [k,f] of[['bg','arena.png'],['st','stream.png'],['view','arena_view.png']])fs.writeFileSync(__dirname+'/'+f,Buffer.from(r[k].split(',')[1],'base64'));
console.log('背景色',r.ca.join(' '),'\n淺溪色',r.cs.join(' '),'\nbytes',r.bg.length,r.st.length);
await br.close();})();
