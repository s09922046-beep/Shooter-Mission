// 4 王低姿勢(11/11 第 3 回修改,使用者選「蹲伏加收合翼」):骨影閃瞬到左下/右下、或閃瞬後頭往下追主角時用
//  收合的翼:boss4-parts.webp 右下(原圖 x1220~1500、y425~1000,約 ×6)縮圖,顏色吸附到 body.png 的調色盤(與主圖一致)
//  胸廓:body.png 的遊戲 x452~537、y14~92(肩胛、肋骨與頸根;x<466 且 y<44 的翼膜不取),往左 6、往下 131 擺到地面(肋骨尖落在 y≈222)
//  輸出 low.png:100×117,左上角 = 右側版型 (424,108)。頸根(低)= (451,193)。用法:node low.js(先跑 down.js)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(async([ps,bs])=>{const get=async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return {D:x.getImageData(0,0,c.width,c.height).data,SW:c.width,SH:c.height};};
 const B=await get(bs),P=await get(ps),pal=new Map();for(let q=0;q<B.D.length;q+=4)if(B.D[q+3])pal.set(B.D[q]*65536+B.D[q+1]*256+B.D[q+2],[B.D[q],B.D[q+1],B.D[q+2]]);
 const K=[...pal.values()],lum=k=>k[0]*.3+k[1]*.59+k[2]*.11;let O=K[0];for(const k of K)if(lum(k)<lum(O))O=k;
 const near=(r,g,b)=>{let bi=K[0],bd=1e9;for(const k of K){const e=(r-k[0])**2+(g-k[1])**2+(b-k[2])**2;if(e<bd){bd=e;bi=k;}}return bi;};
 const mag=(r,g,b)=>r>g+60&&b>g+60;
 const W=100,H=117,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),I=x.createImageData(W,H),o=I.data;
 const put=(X,Y,k)=>{if(X<0||Y<0||X>=W||Y>=H)return;const q=(Y*W+X)*4;o[q]=k[0];o[q+1]=k[1];o[q+2]=k[2];o[q+3]=255;};
 // 收合翼(先畫,在胸廓後面)
 const S=6,X0=1220,Y0=425,GW=47,GH=96;
 for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const cnt=new Map();let n=0,m=0,dk=0;
   for(let sy=Y0+gy*S;sy<Y0+(gy+1)*S;sy++)for(let sx=X0+gx*S;sx<X0+(gx+1)*S;sx++){const i=(sy*P.SW+sx)*4,r=P.D[i],g=P.D[i+1],b=P.D[i+2];n++;if(mag(r,g,b)){m++;continue;}const k=near(r,g,b);if(k===O)dk++;cnt.set(k,(cnt.get(k)||0)+1);}
   if(m>n*0.5)continue;if(dk>=n*0.3){put(12+gx,6+gy,O);continue;}let bk=null,bn=-1;for(const [k,v] of cnt)if(k!==O&&v>bn){bn=v;bk=k;}put(12+gx,6+gy,bk||O);}
 // 胸廓
 for(let y=14;y<=92;y++)for(let X=452;X<=536;X++){if(X<466&&y<44)continue;const i=((y+12)*B.SW+(X-230))*4;if(!B.D[i+3])continue;put(X-6-424,y+131-108,[B.D[i],B.D[i+1],B.D[i+2]]);}
 x.putImageData(I,0,0);return c.toDataURL().split(',')[1];},['data:image/webp;base64,'+fs.readFileSync(__dirname+'/../boss4-parts.webp').toString('base64'),'data:image/png;base64,'+fs.readFileSync(__dirname+'/body.png').toString('base64')]);
fs.writeFileSync(__dirname+'/low.png',Buffer.from(d,'base64'));console.log('已存 low.png');await br.close();})();
