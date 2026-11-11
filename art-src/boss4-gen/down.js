// 4 王自動縮圖(11/11 第 3 回)
//  本體 boss4-main.webp(1536×1024,遊戲座標 ×5,畫布左上 = 遊戲 (230,-12))→ 遊戲 x230~536、y-12~192 共 307×204 → body.png(身體與翼,不含頭頸)、head.png(頭骨)
//    每個遊戲像素 = 原圖 5×5 區塊:洋紅 >50% 為空白,外框色 ≥30% 取外框,否則取眾數(k-means 分色);紅色(魂火)抹成骨色,遊戲內由程式畫。
//  場景 boss4-arena-fix.png(arenafix.js 輸出,遊戲座標 ×3)→ 遊戲 x16~495、y0~223 → 3×3 平均 → k-means 壓色 → arena.png
// 用法:node down.js [本體色數] [場景色數];輸出 full.png、arena.png、view.png(×3 檢視)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NK=+process.argv[2]||10,NA=+process.argv[3]||10;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const ld=f=>'data:image/'+(f.endsWith('.png')?'png':'webp')+';base64,'+fs.readFileSync(__dirname+'/../'+f).toString('base64');
const AF=fs.existsSync(__dirname+'/../boss4-arena-fix.png')?'boss4-arena-fix.png':'boss4-arena.webp';
const r=await pg.evaluate(async([ms,as,NK,NA])=>{
 const get=async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return {D:x.getImageData(0,0,c.width,c.height).data,SW:c.width,SH:c.height};};
 const mag=(r,g,b)=>(r>g+60&&b>g+60);
 const red=(r,g,b)=>r>120&&g<80&&b<80&&r>g*2;
 const kmeans=(sm,K,it)=>{for(let t=0;t<it;t++){const s=K.map(()=>[0,0,0,0]);for(const p of sm){let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(p[0]-k[0])**2+(p[1]-k[1])**2+(p[2]-k[2])**2;if(d<bd){bd=d;bi=j;}}s[bi][0]+=p[0];s[bi][1]+=p[1];s[bi][2]+=p[2];s[bi][3]++;}
   K=K.map((k,j)=>s[j][3]?[s[j][0]/s[j][3],s[j][1]/s[j][3],s[j][2]/s[j][3]]:k);}return K.map(k=>k.map(Math.round));};
 const near=(K,r,g,b)=>{let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(r-k[0])**2+(g-k[1])**2+(b-k[2])**2;if(d<bd){bd=d;bi=j;}}return bi;};
 const hx=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
 const lum=k=>k[0]*.3+k[1]*.59+k[2]*.11;
 const M=await get(ms);const sm=[];for(let i=0;i<M.D.length;i+=4*23){const r=M.D[i],g=M.D[i+1],b=M.D[i+2];if(!mag(r,g,b)&&!red(r,g,b))sm.push([r,g,b]);}
 sm.sort((a,b)=>lum(a)-lum(b));let K=[];for(let k=0;k<NK;k++)K.push(sm[Math.floor((k+.5)/NK*sm.length)]);K=kmeans(sm,K,14);
 let O=0;K.forEach((k,j)=>{if(lum(k)<lum(K[O]))O=j;});
 const GW=307,GH=204,S=5,cls=new Int16Array(GW*GH).fill(-1),rm=new Uint8Array(GW*GH);
 for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const cnt=new Array(NK+1).fill(0);let n=0,rd=0;
   for(let sy=gy*S;sy<(gy+1)*S;sy++)for(let sx=gx*S;sx<(gx+1)*S;sx++){if(sx>=M.SW||sy>=M.SH)continue;const i=(sy*M.SW+sx)*4;n++;
     if(red(M.D[i],M.D[i+1],M.D[i+2])){rd++;continue;}cnt[mag(M.D[i],M.D[i+1],M.D[i+2])?0:near(K,M.D[i],M.D[i+1],M.D[i+2])+1]++;}
   if(rd>n*0.3)rm[gy*GW+gx]=1;
   if(!n||cnt[0]>n*0.5)continue;
   if(cnt[O+1]>=n*0.3){cls[gy*GW+gx]=O;continue;}
   let bi=1;for(let j=1;j<=NK;j++)if(j!==O+1&&cnt[j]>cnt[bi])bi=j;if(bi===O+1)bi=1;cls[gy*GW+gx]=bi-1;}
 const reds=[];for(let q=0;q<GW*GH;q++)if(rm[q]){const X=q%GW+230,Y=((q/GW)|0)-12;if(X<445&&Y>95){reds.push([X,Y]);cls[q]=O;}}   // 魂火位置(只認頭骨內)改填外框色(眼窩是黑洞);其他偶發紅點照眾數
 // 頭與頸:由頭骨往外連通(只走 y>=64、x<=482),y<64 的頸根留在身體上;頭骨 = 連通塊中 x<=438 的部分,其餘(頸)捨棄,遊戲內頸椎由程式畫
 const hn=new Uint8Array(GW*GH),st=[(112+12)*GW+(415-230)];hn[st[0]]=1;
 while(st.length){const p=st.pop(),x=p%GW,y=(p/GW)|0;for(const [a,b] of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const X=x+a,Y=y+b,k=Y*GW+X;if(X<0||Y<0||X>=GW||Y>=GH||hn[k]||cls[k]<0)continue;if(Y-12<64||X+230>482)continue;hn[k]=1;st.push(k);}}
 let hx0=1e9,hx1=-1,hy0=1e9,hy1=-1;for(let q=0;q<GW*GH;q++)if(hn[q]&&q%GW+230<=438){const X=q%GW+230,Y=((q/GW)|0)-12;hx0=Math.min(hx0,X);hx1=Math.max(hx1,X);hy0=Math.min(hy0,Y);hy1=Math.max(hy1,Y);}
 const HW=hx1-hx0+1,HH=hy1-hy0+1,hc=document.createElement('canvas');hc.width=HW;hc.height=HH;const hxx=hc.getContext('2d'),hi=hxx.createImageData(HW,HH);
 for(let y=0;y<HH;y++)for(let x=0;x<HW;x++){const q=(y+hy0+12)*GW+(x+hx0-230);if(hn[q]&&x+hx0<=438)hi.data.set([...K[cls[q]],255],(y*HW+x)*4);}hxx.putImageData(hi,0,0);
 for(let q=0;q<GW*GH;q++)if(hn[q])cls[q]=-1;
 const sc=document.createElement('canvas');sc.width=GW;sc.height=GH;const sx_=sc.getContext('2d'),si=sx_.createImageData(GW,GH);
 for(let q=0;q<GW*GH;q++)if(cls[q]>=0)si.data.set([...K[cls[q]],255],q*4);sx_.putImageData(si,0,0);
 // ---- 場景 ----
 const A=await get(as);const AW=480,AH=224,ao=new Float32Array(AW*AH*3),asm=[],uq=new Set();
 for(let y=0;y<AH;y++)for(let i=0;i<AW;i++){let R=0,G=0,B=0;for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const k=((y*3+dy)*A.SW+(16+i)*3+dx)*4;R+=A.D[k];G+=A.D[k+1];B+=A.D[k+2];}
   const q=y*AW+i;ao[q*3]=R/9;ao[q*3+1]=G/9;ao[q*3+2]=B/9;const u=((R/9)>>3)*1024+((G/9)>>3)*32+((B/9)>>3);if(!uq.has(u)){uq.add(u);asm.push([R/9,G/9,B/9]);}}
 asm.sort((a,b)=>lum(a)-lum(b));let KA=[];for(let k=0;k<NA;k++)KA.push(asm[Math.floor((k+.5)/NA*asm.length)]);KA=kmeans(asm,KA,16);
 const ac=document.createElement('canvas');ac.width=AW;ac.height=AH;const ax=ac.getContext('2d'),ai=ax.createImageData(AW,AH);
 for(let q=0;q<AW*AH;q++)ai.data.set([...KA[near(KA,ao[q*3],ao[q*3+1],ao[q*3+2])],255],q*4);ax.putImageData(ai,0,0);
 const v=document.createElement('canvas');v.width=512*3;v.height=288*3;const vx=v.getContext('2d');vx.imageSmoothingEnabled=false;
 vx.drawImage(ac,16*3,0,AW*3,AH*3);vx.fillStyle='#2a2620';vx.fillRect(48,224*3,480*3,64*3);
 vx.drawImage(sc,0,12,GW,192,230*3,0,GW*3,192*3);
 vx.strokeStyle='#ff3030';vx.lineWidth=2;vx.strokeRect(396*3,100*3,46*3,34*3);
 return {head:hc.toDataURL(),hbox:[hx0,hy0,HW,HH],body:sc.toDataURL(),arena:ac.toDataURL(),view:v.toDataURL(),ks:K.map(hx),ka:KA.map(hx),reds:reds.length?[Math.min(...reds.map(p=>p[0])),Math.max(...reds.map(p=>p[0])),Math.min(...reds.map(p=>p[1])),Math.max(...reds.map(p=>p[1]))]:[]};},[ld('boss4-main.webp'),ld(AF),NK,NA]);
for(const [k,f] of[['head','head.png'],['body','body.png'],['arena','arena.png'],['view','view.png']])fs.writeFileSync(__dirname+'/'+f,Buffer.from(r[k].split(',')[1],'base64'));
console.log('頭骨(遊戲 x,y,w,h;headY=100 時)',r.hbox.join(','),'\n場景來源',AF,'\n本體色',r.ks.join(' '),'\n場景色',r.ka.join(' '),'\n魂火範圍(遊戲 x0,x1,y0,y1)',r.reds.join(','));await br.close();})();
