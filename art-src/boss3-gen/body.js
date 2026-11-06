// 3 王本體:body-b.png(down.js 輸出,512x96)→ 挖掉 GPT 的眼睛(眼窩內填暗色、溢出到眼皮的黃光改回周圍肉色)→ 重新壓色 → body.png
// 眼睛改由遊戲程式繪製(B3EYE:中心 257.5,51、半寬 33、半高 15 的透鏡形)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NC=+process.argv[2]||9;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const r=await pg.evaluate(async([src,NC])=>{const im=new Image();im.src=src;await im.decode();const W=512,H=96;
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(im,0,0);
 const I=x.getImageData(0,0,W,H),D=I.data;
 const CX=257.5,CY=51,A=33,BH=15,lens=(i,y)=>{const dx=(i+0.5-CX)/A;return Math.abs(dx)<1&&Math.abs(y+0.5-CY)<=BH*(1-dx*dx);};
 const eyeY=(q)=>{const r=D[q],g=D[q+1],b=D[q+2];return r>110&&g>60&&b<70;};   // 黃、琥珀
 const m=new Uint8Array(W*H);let bad=[];
 for(let y=0;y<H;y++)for(let i=0;i<W;i++){const q=(y*W+i)*4;if(!D[q+3])continue;
   if(lens(i,y)){D[q]=0x28;D[q+1]=0x03;D[q+2]=0x21;}else if(eyeY(q)){bad.push([i,y]);m[y*W+i]=1;}}
 // 黃光的深色外框:距黃色 2 像素內的暗色像素(眼睛附近)也改回肉色
 for(let y=10;y<90;y++)for(let i=215;i<300;i++){const q=(y*W+i)*4;if(!D[q+3]||m[y*W+i]||lens(i,y)||D[q]+D[q+1]+D[q+2]>130)continue;
   let n=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(m[(y+dy)*W+i+dx]===1)n++;if(n){m[y*W+i]=2;bad.push([i,y]);}}
 const eyeC=(q)=>m[q>>2]>0;
 for(let it=0;it<40&&bad.length;it++){const nb=[],set=[];
  for(const [i,y] of bad){const cnt={};let best=null,bn=0;
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]]){const X=i+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=(Y*W+X)*4;
     if(!D[q+3]||eyeC(q)||lens(X,Y))continue;const k=D[q]+','+D[q+1]+','+D[q+2];cnt[k]=(cnt[k]||0)+1;if(cnt[k]>bn){bn=cnt[k];best=k;}}
   if(best)set.push([i,y,best]);else nb.push([i,y]);}
  for(const [i,y,k] of set){const q=(y*W+i)*4,v=k.split(',');D[q]=+v[0];D[q+1]=+v[1];D[q+2]=+v[2];m[y*W+i]=0;}
  bad=nb;}
 for(let p=0;p<2;p++){const S=new Uint8ClampedArray(D);   // 眼睛附近 3x3 眾數濾波,清掉黃光殘留的雜點
  for(let y=15;y<85;y++)for(let i=215;i<300;i++){const q=(y*W+i)*4;if(!S[q+3]||lens(i,y))continue;const cnt={};let best=null,bn=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const o=((y+dy)*W+i+dx)*4;if(!S[o+3]||lens(i+dx,y+dy))continue;const k=S[o]+','+S[o+1]+','+S[o+2];cnt[k]=(cnt[k]||0)+1;if(cnt[k]>bn){bn=cnt[k];best=k;}}
   if(best&&bn>=4){const v=best.split(',');D[q]=+v[0];D[q+1]=+v[1];D[q+2]=+v[2];}}}
 // 重新壓色(k-means,依亮度分位起始)
 const px=[];for(let q=0;q<W*H;q++)if(D[q*4+3])px.push(q);
 const L=q=>D[q*4]+D[q*4+1]+D[q*4+2],srt=px.slice().sort((a,b)=>L(a)-L(b));
 let C=[];for(let k=0;k<NC;k++){const q=srt[Math.floor((k+0.5)/NC*srt.length)]*4;C.push([D[q],D[q+1],D[q+2]]);}
 const lab=new Int32Array(W*H);
 for(let it=0;it<14;it++){const S=C.map(()=>[0,0,0,0]);for(const q of px){const o=q*4;let b=0,bd=1e9;
   for(let k=0;k<NC;k++){const d=(D[o]-C[k][0])**2+(D[o+1]-C[k][1])**2+(D[o+2]-C[k][2])**2;if(d<bd){bd=d;b=k;}}lab[q]=b;S[b][0]+=D[o];S[b][1]+=D[o+1];S[b][2]+=D[o+2];S[b][3]++;}
  C=C.map((c,k)=>S[k][3]?[S[k][0]/S[k][3],S[k][1]/S[k][3],S[k][2]/S[k][3]].map(Math.round):c);}
 { // 使用者 11/7:本體最亮的兩階壓暗(最亮 ×0.82、次亮 ×0.77),讓豎瞳成為唯一焦點
  const ord=C.map((c,k)=>[c[0]+c[1]+c[2],k]).sort((a,b)=>b[0]-a[0]);
  for(const [f,i] of [[0.82,0],[0.77,1]]){const k=ord[i][1];C[k]=C[k].map(v=>Math.round(v*f));}}
 for(const q of px){const c=C[lab[q]];D[q*4]=c[0];D[q*4+1]=c[1];D[q*4+2]=c[2];}
 x.putImageData(I,0,0);
 let x0=W,x1=0,y1=0;for(const q of px){const i=q%W,y=(q/W)|0;x0=Math.min(x0,i);x1=Math.max(x1,i);y1=Math.max(y1,y);}
 const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1+1;o.getContext('2d').drawImage(c,-x0,0);
 const z=document.createElement('canvas');z.width=o.width*3;z.height=o.height*3;const zx=z.getContext('2d');zx.imageSmoothingEnabled=false;zx.fillStyle='#3a5a6a';zx.fillRect(0,0,z.width,z.height);zx.drawImage(o,0,0,z.width,z.height);
 return {png:o.toDataURL(),view:z.toDataURL(),x0,w:o.width,h:o.height,left:bad.length,C};},['data:image/png;base64,'+fs.readFileSync(__dirname+'/body-b.png').toString('base64'),NC]);
fs.writeFileSync(__dirname+'/body.png',Buffer.from(r.png.split(',')[1],'base64'));fs.writeFileSync(__dirname+'/body_view.png',Buffer.from(r.view.split(',')[1],'base64'));
console.log('x0',r.x0,'size',r.w,r.h,'left',r.left,'bytes',r.png.length,'colors',r.C.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')).join(' '));
await br.close();})();
