// 9 王自動縮圖(11/10 第 3 回)
//  本體 boss9-main.webp(1536×1024,遊戲座標 ×6,畫布左上 = 遊戲 (300,-25))→ 遊戲 x356~555、y-25~139 共 200×165 → body.png
//    每個遊戲像素 = 原圖 6×6 區塊:非洋紅先 k-means 分色,洋紅 >50% 為空白,外框色 ≥30% 取外框,否則取眾數;
//    判定框 150×120(局部 x0~149、y45~164)內一律不透明,左緣與底緣補外框(貼齊判定)。
//    紅色眼睛另外找連通塊,輸出每顆眼睛的中心與半徑(遊戲內眼睛由程式畫,才能眨眼、轉瞳孔),body.png 內眼睛位置改填肉色
//  場景 boss9-arena.webp(遊戲座標 ×3)→ 遊戲 x16~495、y0~287 → 3×3 平均 → k-means 壓色 → arena.png
// 用法:node down.js [本體色數] [場景色數] [本體檔名] [場景檔名] [輸出後綴] [場景固定色] [抹除圓] [shape];另輸出 view.png(×3 檢視)與 eyes.json(有後綴時檔名加後綴,供比較候選圖)
//  第 2 版(11/10,目前內嵌的版本):node arenafix.js 後執行 node down.js 12 10 boss9-main2.webp boss9-arena2-fix.png "" "#66725e,#827159,#46587a,#0a1727,#112134,#060d1d" "92.9:100.3:8.2" shape,再 node export.js
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NK=+process.argv[2]||12,NA=+process.argv[3]||8,MF=process.argv[4]||'boss9-main.webp',AF=process.argv[5]||'boss9-arena.webp',SUF=process.argv[6]||'';
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const ld=f=>'data:image/'+(f.endsWith('.png')?'png':'webp')+';base64,'+fs.readFileSync(__dirname+'/../'+f).toString('base64');
const FIX=(process.argv[7]||'').split(',').filter(Boolean).map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));   // 場景固定色(第 7 個參數,逗號分隔 #rrggbb;自動分色會把相近的少量色併掉,例如大陸綠與卡其)
const SHS=process.argv[9]==='shape'?(fs.readFileSync(__dirname+'/../../index.html','utf8').match(/^function b9Solid.*$/m)||[''])[0].trim():'';   // 第 9 個參數 shape:從 index.html 讀 b9Solid 裁切本體外形
const ER=(process.argv[8]||'').split(';').filter(Boolean).map(t=>t.split(':').map(Number));   // 第 8 個參數:抹成肉色的圓(圖內座標 x:y:r,分號分隔;眼睛由程式移位時抹掉原眼框)
const r=await pg.evaluate(async([ms,as,NK,NA,FIX,ER,SHS])=>{
 const get=async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return {D:x.getImageData(0,0,c.width,c.height).data,SW:c.width,SH:c.height};};
 const mag=(r,g,b)=>(r>g+45&&b>g+45);
 const red=(r,g,b)=>r>110&&g<70&&b<70&&r>g*2.2;   // 含眼睛暗紅陰影(第 2 版本體眼睛下緣有 #890503 陰影,只抓亮紅會在眼框留下紅圈)
 const kmeans=(sm,K,it)=>{for(let t=0;t<it;t++){const s=K.map(()=>[0,0,0,0]);for(const p of sm){let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(p[0]-k[0])**2+(p[1]-k[1])**2+(p[2]-k[2])**2;if(d<bd){bd=d;bi=j;}}s[bi][0]+=p[0];s[bi][1]+=p[1];s[bi][2]+=p[2];s[bi][3]++;}
   K=K.map((k,j)=>s[j][3]?[s[j][0]/s[j][3],s[j][1]/s[j][3],s[j][2]/s[j][3]]:k);}return K.map(k=>k.map(Math.round));};
 const near=(K,r,g,b)=>{let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(r-k[0])**2+(g-k[1])**2+(b-k[2])**2;if(d<bd){bd=d;bi=j;}}return bi;};
 const hx=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
 const lum=k=>k[0]*.3+k[1]*.59+k[2]*.11;
 // ---- 本體 ----
 const M=await get(ms);const sm=[];for(let i=0;i<M.D.length;i+=4*29){const r=M.D[i],g=M.D[i+1],b=M.D[i+2];if(!mag(r,g,b)&&!red(r,g,b))sm.push([r,g,b]);}
 sm.sort((a,b)=>lum(a)-lum(b));let K=[];for(let k=0;k<NK;k++)K.push(sm[Math.floor((k+.5)/NK*sm.length)]);K=kmeans(sm,K,14);
 let O=0;K.forEach((k,j)=>{if(lum(k)<lum(K[O]))O=j;});
 const GW=200,GH=165,S=6,X0=336,Y0=0,cls=new Int16Array(GW*GH).fill(-1),rm=new Uint8Array(GW*GH);
 for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const cnt=new Array(NK+1).fill(0);let n=0,rd=0;
   for(let sy=Y0+gy*S;sy<Y0+(gy+1)*S;sy++)for(let sx=X0+gx*S;sx<X0+(gx+1)*S;sx++){if(sx>=M.SW||sy>=M.SH)continue;const i=(sy*M.SW+sx)*4;n++;
     if(red(M.D[i],M.D[i+1],M.D[i+2])){rd++;continue;}cnt[mag(M.D[i],M.D[i+1],M.D[i+2])?0:near(K,M.D[i],M.D[i+1],M.D[i+2])+1]++;}
   if(rd>n*0.4)rm[gy*GW+gx]=1;
   if(!n||cnt[0]>n*0.5)continue;
   if(cnt[O+1]>=n*0.3){cls[gy*GW+gx]=O;continue;}
   let bi=1;for(let j=1;j<=NK;j++)if(j!==O+1&&cnt[j]>cnt[bi])bi=j;if(bi===O+1)bi=1;cls[gy*GW+gx]=bi-1;}
 // 眼睛連通塊
 const seen=new Uint8Array(GW*GH),eyes=[];
 for(let q=0;q<GW*GH;q++){if(!rm[q]||seen[q])continue;const st=[q];seen[q]=1;let n=0,sx=0,sy=0,x0=1e9,x1=-1,y0=1e9,y1=-1;
   while(st.length){const p=st.pop(),x=p%GW,y=(p/GW)|0;n++;sx+=x;sy+=y;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
     for(const [a,b] of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+b,k=Y*GW+X;if(X>=0&&X<GW&&Y>=0&&Y<GH&&rm[k]&&!seen[k]){seen[k]=1;st.push(k);}}}
   if(n>=4)eyes.push({x:+(sx/n+.5).toFixed(1),y:+(sy/n+.5).toFixed(1),r:+(((x1-x0+1)+(y1-y0+1))/4).toFixed(1),n});}
 // 判定框內補滿、左緣與底緣外框;眼睛格先填附近肉色
 const fill=(gx,gy)=>{for(let d=1;d<8;d++)for(const [a,b] of[[d,0],[0,-d],[-d,0],[0,d],[d,d],[-d,-d],[d,-d],[-d,d]]){const X=gx+a,Y=gy+b;if(X>=0&&X<GW&&Y>=0&&Y<GH&&!rm[Y*GW+X]&&cls[Y*GW+X]>=0&&cls[Y*GW+X]!==O)return cls[Y*GW+X];}return O;};
 for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const q=gy*GW+gx;if(rm[q])cls[q]=fill(gx,gy);}
 for(let gy=45;gy<GH;gy++)for(let gx=0;gx<150;gx++){const q=gy*GW+gx;if(cls[q]<0)cls[q]=fill(gx,gy);}
 {const F=near(K,173,158,142);for(const [ex,ey,er] of ER)for(let gy=Math.floor(ey-er);gy<=ey+er;gy++)for(let gx=Math.floor(ex-er);gx<=ex+er;gx++)if((gx+.5-ex)**2+(gy+.5-ey)**2<=er*er)cls[gy*GW+gx]=F;}   // 抹掉移位眼睛的原眼框
 if(!SHS){for(let gy=45;gy<GH;gy++)cls[gy*GW]=O;for(let gx=0;gx<150;gx++)cls[(GH-1)*GW+gx]=O;}   // 第一版:方框左緣與底緣補外框
 else{const so=new Function('return '+SHS)(),ok=(gx,gy)=>gx>=0&&gy>=0&&gx<GW&&gy<GH&&so(gx+.5,gy+.5);   // 第 2 版(11/10 使用者授權外形改圓弧):以遊戲內同一個 b9Solid 裁切,邊界補 1 像素外框
   for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++)if(!ok(gx,gy))cls[gy*GW+gx]=-1;
   const ed=new Uint8Array(GW*GH);for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const q=gy*GW+gx;if(cls[q]<0)continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const X=gx+a,Y=gy+b;return X>=0&&Y>=0&&X<GW&&Y<GH&&!so(X+.5,Y+.5);}))ed[q]=1;}
   for(let q=0;q<GW*GH;q++)if(ed[q])cls[q]=O;}
 const sc=document.createElement('canvas');sc.width=GW;sc.height=GH;const sx_=sc.getContext('2d'),si=sx_.createImageData(GW,GH);
 for(let q=0;q<GW*GH;q++)if(cls[q]>=0)si.data.set([...K[cls[q]],255],q*4);sx_.putImageData(si,0,0);
 // ---- 場景 ----
 const A=await get(as);const AW=480,AH=288,ao=new Float32Array(AW*AH*3),asm=[],uq=new Set();
 for(let y=0;y<AH;y++)for(let i=0;i<AW;i++){let R=0,G=0,B=0;for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const k=((y*3+dy)*A.SW+(16+i)*3+dx)*4;R+=A.D[k];G+=A.D[k+1];B+=A.D[k+2];}
   const q=y*AW+i;ao[q*3]=R/9;ao[q*3+1]=G/9;ao[q*3+2]=B/9;const u=((R/9)>>4)*4096+((G/9)>>4)*64+((B/9)>>4);if(!uq.has(u)){uq.add(u);asm.push([R/9,G/9,B/9]);}}   // 去重後再分色(暗色占大多數,不去重會全部擠在暗部)
 asm.sort((a,b)=>lum(a)-lum(b));let KA=[];for(let k=0;k<NA;k++)KA.push(asm[Math.floor((k+.5)/NA*asm.length)]);KA=kmeans(asm,KA,16).concat(FIX);
 const ac=document.createElement('canvas');ac.width=AW;ac.height=AH;const ax=ac.getContext('2d'),ai=ax.createImageData(AW,AH);
 for(let q=0;q<AW*AH;q++)ai.data.set([...KA[near(KA,ao[q*3],ao[q*3+1],ao[q*3+2])],255],q*4);ax.putImageData(ai,0,0);
 // ---- 檢視 ×3 ----
 const v=document.createElement('canvas');v.width=512*3;v.height=288*3;const vx=v.getContext('2d');vx.imageSmoothingEnabled=false;
 vx.drawImage(ac,16*3,0,AW*3,AH*3);vx.fillStyle='#2a3040';vx.fillRect(48,224*3,480*3,64*3);
 vx.drawImage(sc,0,25,156,140,356*3,0,156*3,140*3);
 vx.fillStyle='#d0243a';for(const e of eyes){vx.beginPath();vx.arc((356+e.x)*3,(e.y-25)*3,e.r*3,0,6.283);vx.fill();}
 vx.strokeStyle='#ff3030';vx.lineWidth=2;vx.strokeRect(356*3,20*3,150*3,120*3);vx.strokeStyle='#ffa030';vx.strokeRect(386*3,50*3,60*3,60*3);
 vx.strokeStyle='#ffff00';for(const X of[366,486]){vx.beginPath();vx.arc(X*3,116*3,6,0,6.283);vx.stroke();}
 return {body:sc.toDataURL(),arena:ac.toDataURL(),view:v.toDataURL(),ks:K.map(hx),ka:KA.map(hx),eyes};},[ld(MF),ld(AF),NK,NA,FIX,ER,SHS]);
for(const [k,f] of[['body','body.png'],['arena','arena.png'],['view','view.png']])fs.writeFileSync(__dirname+'/'+f.replace('.png',SUF+'.png'),Buffer.from(r[k].split(',')[1],'base64'));
fs.writeFileSync(__dirname+'/eyes'+SUF+'.json',JSON.stringify(r.eyes));
console.log('本體色',r.ks.join(' '),'\n場景色',r.ka.join(' '),'\n眼睛(圖內座標,遊戲 = +356,-25)',JSON.stringify(r.eyes));await br.close();})();
