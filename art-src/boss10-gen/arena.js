// 10 王第 1、2 段場景:原圖 1536x1024 → 縮 1/3(3x3 區塊多數決去洋紅)→ 只留 x16~495、y0~223 → k-means 壓色
// 輸出 arena.png(背景,天空透明;遊戲另畫天空與碎月)、arena_view.png(檢查用)。用法:node arena.js [色數]
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const NC=+process.argv[2]||10;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const src='data:image/webp;base64,'+fs.readFileSync(__dirname+'/../boss10-arena.webp').toString('base64');
const r=await pg.evaluate(async([src,NC])=>{const im=new Image();im.src=src;await im.decode();
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 const D=x.getImageData(0,0,c.width,c.height).data,SW=c.width;
 const W=512,H=224,o=new Float32Array(W*H*3),a=new Uint8Array(W*H);
 const mag=(r,g,b)=>r-g>60&&b-g>60;
 for(let y=0;y<H;y++)for(let i=16;i<496;i++){let n=0,R=0,G=0,B=0;
   for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const k=((y*3+dy)*SW+i*3+dx)*4;if(mag(D[k],D[k+1],D[k+2]))continue;n++;R+=D[k];G+=D[k+1];B+=D[k+2];}
   if(n>=5){const q=y*W+i;a[q]=1;o[q*3]=R/n;o[q*3+1]=G/n;o[q*3+2]=B/n;}}
 const px=[];for(let q=0;q<W*H;q++)if(a[q])px.push(q);
 let C=[];for(let k=0;k<NC;k++){const q=px[Math.floor((k+0.5)/NC*px.length)];C.push([o[q*3],o[q*3+1],o[q*3+2]]);}
 const lab=new Int32Array(W*H);
 for(let it=0;it<14;it++){const S=C.map(()=>[0,0,0,0]);
  for(const q of px){let b=0,bd=1e9;for(let k=0;k<NC;k++){const d=(o[q*3]-C[k][0])**2+(o[q*3+1]-C[k][1])**2+(o[q*3+2]-C[k][2])**2;if(d<bd){bd=d;b=k;}}lab[q]=b;S[b][0]+=o[q*3];S[b][1]+=o[q*3+1];S[b][2]+=o[q*3+2];S[b][3]++;}
  C=C.map((c,k)=>S[k][3]?[S[k][0]/S[k][3],S[k][1]/S[k][3],S[k][2]/S[k][3]]:c);}
 C=C.map(c=>c.map(Math.round));
 C=C.map(c=>c[1]>200&&c[2]>200?[46,170,168]:(c[2]>180&&c[1]>150?[30,120,136]:c));   // 青色裂縫壓暗(最亮層級留給核心與敵彈)
 // 使用者 11/7:線條感太重、要再暗、要有一體感 → 拿掉最暗的描邊色(換成相鄰填色,貼著天空的變透明),整體壓暗並往天空地平線色靠攏
 const lum=c=>c[0]*0.3+c[1]*0.59+c[2]*0.11;let oc=0;for(let k=1;k<NC;k++)if(lum(C[k])<lum(C[oc]))oc=k;
 for(let pass=0;pass<3;pass++){const L2=lab.slice(),a2=a.slice();
  for(const q of px){if(!a[q]||lab[q]!==oc)continue;const y=Math.floor(q/W),i=q%W,cnt={};let sky=0;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const yy=y+dy,ii=i+dx;if(yy<0||yy>=H||ii<16||ii>=496)continue;const r=yy*W+ii;
     if(!a[r]){sky++;continue;}if(lab[r]!==oc)cnt[lab[r]]=(cnt[lab[r]]||0)+1;}
   let b=-1,v=0;for(const k in cnt)if(cnt[k]>v){v=cnt[k];b=+k;}
   if(sky>=8&&v<6)a2[q]=0;else if(b>=0)L2[q]=b;}
  lab.set(L2);a.set(a2);}
 const HZ=[42,36,82];
 C=C.map(c=>{const cy=c[1]>140&&c[2]>140&&c[0]<80,k=cy?0.62:0.74,m=cy?0.42:0.34;return c.map((v,j)=>Math.round(v*k*(1-m)+HZ[j]*m));});
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const bg=mk(W,H),bx=bg.getContext('2d'),bi=bx.createImageData(W,H);
 for(let q=0;q<W*H;q++){if(!a[q])continue;const col=C[lab[q]];bi.data[q*4]=col[0];bi.data[q*4+1]=col[1];bi.data[q*4+2]=col[2];bi.data[q*4+3]=255;}
 bx.putImageData(bi,0,0);
 let y0=H;for(let q=0;q<W*H;q++)if(a[q]){y0=Math.floor(q/W);break;}
 const v=mk(W*2,H*2),vx=v.getContext('2d');vx.imageSmoothingEnabled=false;vx.fillStyle='#14122a';vx.fillRect(0,0,W*2,H*2);vx.drawImage(bg,0,0,W*2,H*2);
 return {bg:bg.toDataURL(),view:v.toDataURL(),C,y0};},[src,NC]);
fs.writeFileSync(__dirname+'/arena.png',Buffer.from(r.bg.split(',')[1],'base64'));fs.writeFileSync(__dirname+'/arena_view.png',Buffer.from(r.view.split(',')[1],'base64'));
console.log('colors',r.C.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')).join(' '),'top row',r.y0,'bytes',r.bg.length);
await br.close();})();
