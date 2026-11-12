// 6 王自動縮圖初稿(11/12 第 2 回小樣用;第 3 回再手修)
//  騎士 boss6-knight-main.webp、詠嘆者 boss6-chanter-main.webp:每個遊戲像素 = 原圖 S×S 區塊;洋紅 >50% 為空白,
//    外框色 ≥30% 取外框,紅色 ≥25% 取紅(核心),否則取眾數(k-means 分色);最後沿剪影補 1 像素外框。
//    騎士 S=28(盔頂到腳底約 30 = 判定框高,戟高約 35);詠嘆者 S=35(光輪頂到袍底 28,判定框 26 高)
//  姿勢表 boss6-knight-poses.webp / boss6-chanter-poses.webp 用同一倍率縮(只當動作參考)
//  場景 boss6-arena.webp(遊戲座標 ×3)→ 3×3 平均 → k-means 壓色 → arena.png(遊戲 512×224)
// 用法:node down.js [角色色數] [場景色數];輸出 knight.png、chanter.png、kposes.png、cposes.png、arena.png
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NK=+process.argv[2]||7,NA=+process.argv[3]||12;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const ld=f=>'data:image/webp;base64,'+fs.readFileSync(__dirname+'/../'+f).toString('base64');
const r=await pg.evaluate(async([J,NK,NA])=>{
 const get=async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return {D:x.getImageData(0,0,c.width,c.height).data,SW:c.width,SH:c.height};};
 const mag=(r,g,b)=>(r>g+60&&b>g+60);
 const red=(r,g,b)=>r>150&&g<90&&b<90;
 const lum=k=>k[0]*.3+k[1]*.59+k[2]*.11;
 const kmeans=(sm,K,it)=>{for(let t=0;t<it;t++){const s=K.map(()=>[0,0,0,0]);for(const p of sm){let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(p[0]-k[0])**2+(p[1]-k[1])**2+(p[2]-k[2])**2;if(d<bd){bd=d;bi=j;}}s[bi][0]+=p[0];s[bi][1]+=p[1];s[bi][2]+=p[2];s[bi][3]++;}
   K=K.map((k,j)=>s[j][3]?[s[j][0]/s[j][3],s[j][1]/s[j][3],s[j][2]/s[j][3]]:k);}return K.map(k=>k.map(Math.round));};
 const near=(K,r,g,b)=>{let bi=0,bd=1e9;for(let j=0;j<K.length;j++){const k=K[j],d=(r-k[0])**2+(g-k[1])**2+(b-k[2])**2;if(d<bd){bd=d;bi=j;}}return bi;};
 const pal=(M,N)=>{const sm=[];for(let i=0;i<M.D.length;i+=4*7){const r=M.D[i],g=M.D[i+1],b=M.D[i+2];if(!mag(r,g,b)&&!red(r,g,b))sm.push([r,g,b]);}
   sm.sort((a,b)=>lum(a)-lum(b));let K=[];for(let k=0;k<N;k++)K.push(sm[Math.floor((k+.5)/N*sm.length)]);K=kmeans(sm,K,14);K.sort((a,b)=>lum(a)-lum(b));return K;};
 // 縮一張角色圖:x0,y0 為原圖左上,S 倍率,GW×GH 遊戲像素
 const down=(M,K,x0,y0,S,GW,GH)=>{const c=document.createElement('canvas');c.width=GW;c.height=GH;const x=c.getContext('2d');const id=x.createImageData(GW,GH);const cl=new Int16Array(GW*GH).fill(-1);
   for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const cnt=new Array(K.length).fill(0);let n=0,mg=0,rd=0;
     for(let sy=y0+gy*S;sy<y0+(gy+1)*S;sy++)for(let sx=x0+gx*S;sx<x0+(gx+1)*S;sx++){if(sx<0||sy<0||sx>=M.SW||sy>=M.SH){n++;mg++;continue;}const i=(sy*M.SW+sx)*4;n++;
       const r=M.D[i],g=M.D[i+1],b=M.D[i+2];if(mag(r,g,b)){mg++;continue;}if(red(r,g,b)){rd++;continue;}cnt[near(K,r,g,b)]++;}
     if(mg>n*0.5)continue;
     if(rd>=n*0.25){cl[gy*GW+gx]=99;continue;}
     if(cnt[0]>=n*0.3){cl[gy*GW+gx]=0;continue;}
     let bi=1;for(let j=1;j<K.length;j++)if(cnt[j]>cnt[bi])bi=j;cl[gy*GW+gx]=bi;}
   // 沿剪影補外框:空白格鄰接非空白 → 不補(外框畫在剪影內緣):剪影邊緣格改外框色
   const out=cl.slice();for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const q=gy*GW+gx;if(cl[q]<0||cl[q]===99)continue;
     const e=(dx,dy)=>{const X=gx+dx,Y=gy+dy;return X<0||Y<0||X>=GW||Y>=GH||cl[Y*GW+X]<0;};if(e(1,0)||e(-1,0)||e(0,1)||e(0,-1))out[q]=0;}
   for(let q=0;q<GW*GH;q++){const v=out[q];if(v<0)continue;const k=v===99?[230,24,24]:K[v];id.data[q*4]=k[0];id.data[q*4+1]=k[1];id.data[q*4+2]=k[2];id.data[q*4+3]=255;}
   x.putImageData(id,0,0);return c.toDataURL().split(',')[1];};
 const res={};
 const KM=await get(J.km),KP=K=>0;const KK=pal(KM,NK);
 res.knight=down(KM,KK,244-14,155-28*5,28,36,36);                       // 盔頂上方留 5 格給戟尖;左側留給斧刃
 const KS=await get(J.kp);res.kposes=down(KS,pal(KS,NK),0,40,13,154,43);   // 姿勢表人物較小:盔頂到腳底約 387 → 13 倍約 30
 const CM=await get(J.cm);const CK=pal(CM,NK);res.chanter=down(CM,CK,422-12,20,35,18,29);
 const CS=await get(J.cp);res.cposes=down(CS,pal(CS,NK),0,0,21,96,32);    // 光輪頂到袍底約 596 → 21 倍約 28
 // 場景
 const A=await get(J.ar);const GW=512,GH=224,c=document.createElement('canvas');c.width=GW;c.height=GH;const x=c.getContext('2d');const id=x.createImageData(GW,GH);const av=[];
 for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){let s=[0,0,0];for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const i=((gy*3+dy)*A.SW+gx*3+dx)*4;s[0]+=A.D[i];s[1]+=A.D[i+1];s[2]+=A.D[i+2];}av.push(s.map(v=>v/9));}
 const sm=av.filter((_,i)=>i%5===0).slice().sort((a,b)=>lum(a)-lum(b));let K=[];for(let k=0;k<NA;k++)K.push(sm[Math.floor((k+.5)/NA*sm.length)]);K=kmeans(sm,K,16);
 av.forEach((p,q)=>{const k=K[near(K,p[0],p[1],p[2])];id.data[q*4]=k[0];id.data[q*4+1]=k[1];id.data[q*4+2]=k[2];id.data[q*4+3]=255;});x.putImageData(id,0,0);
 res.arena=c.toDataURL().split(',')[1];res.apal=K.map(k=>'#'+k.map(v=>v.toString(16).padStart(2,'0')).join(''));
 res.kpal=KK.map(k=>'#'+k.map(v=>v.toString(16).padStart(2,'0')).join(''));res.cpal=CK.map(k=>'#'+k.map(v=>v.toString(16).padStart(2,'0')).join(''));
 return res;},[{km:ld('boss6-knight-main.webp'),kp:ld('boss6-knight-poses.webp'),cm:ld('boss6-chanter-main.webp'),cp:ld('boss6-chanter-poses.webp'),ar:ld('boss6-arena.webp')},NK,NA]);
for(const k of ['knight','kposes','chanter','cposes','arena'])fs.writeFileSync(__dirname+'/'+k+'.png',Buffer.from(r[k],'base64'));
console.log('knight',r.kpal.join(' '));console.log('chanter',r.cpal.join(' '));console.log('arena',r.apal.join(' '));await br.close();})();
