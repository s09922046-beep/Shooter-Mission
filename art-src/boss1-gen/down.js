// 1 王自動縮圖(11/9 第 3 回)
//  艦體 boss1-main.webp(1536×1024,遊戲座標 ×6,畫布左上 = 遊戲 (300,-20))→ 遊戲 x340~555、y-20~137 共 216×158 → ship.png
//    每個遊戲像素 = 原圖 6×6 區塊:非洋紅像素先 k-means 分色,洋紅 >50% 為空白,外框色 ≥30% 取外框,否則取眾數;
//    判定框 160×112(局部 x0~159、y46~157)內一律不透明,左緣與底緣補外框(貼齊判定)。核心紅色保留,遊戲載入時抽出成百葉遮罩。
//  場景 boss1-arena.webp(遊戲座標 ×3)→ 遊戲 x16~495、y0~207 → 3×3 多數決去洋紅 → k-means 壓色 → arena.png(天空透明)
// 用法:node down.js [艦體色數] [場景色數];另輸出 view.png(×3 檢視)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NK=+process.argv[2]||14,NA=+process.argv[3]||8;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const ld=f=>'data:image/webp;base64,'+fs.readFileSync(__dirname+'/../'+f).toString('base64');
const r=await pg.evaluate(async([ms,as,NK,NA])=>{
 const get=async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return {D:x.getImageData(0,0,c.width,c.height).data,SW:c.width,SH:c.height};};
 const mag=(r,g,b)=>(r>g+45&&b>g+45)||(g>190&&b>190&&r<90);   // 洋紅(含與灰色混合的邊緣)與版型青線都當空白
 const kmeans=(sm,K,it)=>{for(let t=0;t<it;t++){const s=K.map(()=>[0,0,0,0]);for(const p of sm){let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(p[0]-k[0])**2+(p[1]-k[1])**2+(p[2]-k[2])**2;if(d<bd){bd=d;bi=j;}}s[bi][0]+=p[0];s[bi][1]+=p[1];s[bi][2]+=p[2];s[bi][3]++;}
   K=K.map((k,j)=>s[j][3]?[s[j][0]/s[j][3],s[j][1]/s[j][3],s[j][2]/s[j][3]]:k);}return K.map(k=>k.map(Math.round));};
 const near=(K,r,g,b)=>{let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(r-k[0])**2+(g-k[1])**2+(b-k[2])**2;if(d<bd){bd=d;bi=j;}}return bi;};
 const hx=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
 // ---- 艦體 ----
 const M=await get(ms);const sm=[];for(let i=0;i<M.D.length;i+=4*29){const r=M.D[i],g=M.D[i+1],b=M.D[i+2];if(!mag(r,g,b))sm.push([r,g,b]);}
 let K=[[22,26,34],[40,46,58],[58,66,80],[74,84,100],[92,102,120],[110,122,140],[130,142,160],[150,162,180],[176,186,200],[214,218,222],[120,80,50],[90,60,40],[230,30,20],[150,20,20]];
 while(K.length<NK)K.push([128,128,128]);K=kmeans(sm,K.slice(0,NK),12);
 const lum=k=>k[0]*.3+k[1]*.59+k[2]*.11;let O=0;K.forEach((k,j)=>{if(lum(k)<lum(K[O]))O=j;});
 const GW=216,GH=158,S=6,X0=240,Y0=0,cls=new Int16Array(GW*GH).fill(-1);
 for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const cnt=new Array(NK+1).fill(0);let n=0;
   for(let sy=Y0+gy*S;sy<Y0+(gy+1)*S;sy++)for(let sx=X0+gx*S;sx<X0+(gx+1)*S;sx++){if(sx>=M.SW||sy>=M.SH)continue;const i=(sy*M.SW+sx)*4;n++;
     cnt[mag(M.D[i],M.D[i+1],M.D[i+2])?0:near(K,M.D[i],M.D[i+1],M.D[i+2])+1]++;}
   if(!n||cnt[0]>n*0.5)continue;
   if(cnt[O+1]>=n*0.3){cls[gy*GW+gx]=O;continue;}
   let bi=1;for(let j=1;j<=NK;j++)if(j!==O+1&&cnt[j]>cnt[bi])bi=j;if(bi===O+1)bi=1;cls[gy*GW+gx]=bi-1;}
 // 判定框內補滿、左緣與底緣外框
 for(let gy=46;gy<GH;gy++)for(let gx=0;gx<160;gx++){const q=gy*GW+gx;if(cls[q]<0){let f=-1;for(let d=1;d<6&&f<0;d++)for(const [a,b] of[[d,0],[0,-d],[-d,0],[0,d]]){const X=gx+a,Y=gy+b;if(X>=0&&X<GW&&Y>=0&&Y<GH&&cls[Y*GW+X]>=0&&cls[Y*GW+X]!==O){f=cls[Y*GW+X];break;}}cls[q]=f<0?O:f;}}
 for(let gy=46;gy<GH;gy++)cls[gy*GW]=O;for(let gx=0;gx<GW;gx++){cls[(GH-1)*GW+gx]=cls[(GH-1)*GW+gx]<0&&gx>=160?-1:O;}
 for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++)if(gy>=GH||gx<0)cls[gy*GW+gx]=-1;
 const sc=document.createElement('canvas');sc.width=GW;sc.height=GH;const sx_=sc.getContext('2d'),si=sx_.createImageData(GW,GH);
 for(let q=0;q<GW*GH;q++)if(cls[q]>=0)si.data.set([...K[cls[q]],255],q*4);sx_.putImageData(si,0,0);
 // ---- 場景 ----
 const A=await get(as);const AW=480,AH=208,ao=new Float32Array(AW*AH*3),al=new Uint8Array(AW*AH),asm=[];
 for(let y=0;y<AH;y++)for(let i=0;i<AW;i++){let n=0,R=0,G=0,B=0;for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const k=((y*3+dy)*A.SW+(16+i)*3+dx)*4;if(mag(A.D[k],A.D[k+1],A.D[k+2]))continue;n++;R+=A.D[k];G+=A.D[k+1];B+=A.D[k+2];}
   if(n>=5){const q=y*AW+i;al[q]=1;ao[q*3]=R/n;ao[q*3+1]=G/n;ao[q*3+2]=B/n;if((q&3)===0)asm.push([R/n,G/n,B/n]);}}
 asm.sort((a,b)=>lum(a)-lum(b));let KA=[];for(let k=0;k<NA;k++)KA.push(asm[Math.floor((k+.5)/NA*asm.length)]);KA=kmeans(asm,KA,14);
 const ac=document.createElement('canvas');ac.width=AW;ac.height=AH;const ax=ac.getContext('2d'),ai=ax.createImageData(AW,AH);
 for(let q=0;q<AW*AH;q++)if(al[q])ai.data.set([...KA[near(KA,ao[q*3],ao[q*3+1],ao[q*3+2])],255],q*4);ax.putImageData(ai,0,0);
 // ---- 檢視:整張場地 ×3(天空暫用夜藍)----
 const v=document.createElement('canvas');v.width=512*3;v.height=288*3;const vx=v.getContext('2d');vx.imageSmoothingEnabled=false;
 vx.fillStyle='#1a2436';vx.fillRect(0,0,v.width,v.height);vx.drawImage(ac,16*3,0,AW*3,AH*3);vx.fillStyle='#2a3244';vx.fillRect(0,208*3,1536,240);
 vx.drawImage(sc,0,20,172,138,340*3,0,172*3,138*3);
 vx.strokeStyle='#ff3030';vx.lineWidth=2;vx.strokeRect(340*3,26*3,160*3,112*3);vx.strokeStyle='#40b0ff';for(const y of[34,66,98])vx.strokeRect(358*3,y*3,36*3,26*3);vx.strokeStyle='#ffa030';vx.strokeRect(410*3,56*3,40*3,40*3);
 return {ship:sc.toDataURL(),arena:ac.toDataURL(),view:v.toDataURL(),ks:K.map(hx),ka:KA.map(hx)};},[ld('boss1-main.webp'),ld('boss1-arena.webp'),NK,NA]);
for(const [k,f] of[['ship','ship.png'],['arena','arena.png'],['view','view.png']])fs.writeFileSync(__dirname+'/'+f,Buffer.from(r[k].split(',')[1],'base64'));
console.log('艦體色',r.ks.join(' '),'\n場景色',r.ka.join(' '));await br.close();})();
