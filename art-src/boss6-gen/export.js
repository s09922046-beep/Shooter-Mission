// 6 王:knight-hand.png(knight.js 手繪 6 姿勢圖集,11/12 起取代 knight.png+kposes.png 自動縮圖)→ b6knight;chanter-hand.png(chanter.js 第 2 版)→ b6chant;arena.png 切 x16~495 → b6arena。
// 以 base64 寫進 index.html 末端 IMGD 區塊(已存在就取代該行),並印出圖集各格 [x,寬,高](index.html 的 B6KR)。
// 姿勢順序:0 待機 1 走路 2 舉戟 3 橫持 4 衝刺 5 跪地。用法:node knight.js && node chanter.js && node export.js(場景另需 node down.js 10 12)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const ld=f=>'data:image/png;base64,'+fs.readFileSync(__dirname+'/'+f).toString('base64');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const r=await pg.evaluate(async J=>{
 const load=async s=>{const im=new Image();im.src=s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c;};
 const KN=await load(J.k),KP=await load(J.p),CH=await load(J.c),AR=await load(J.a);
 const crop=c=>{const x=c.getContext('2d'),D=x.getImageData(0,0,c.width,c.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;
   for(let y=0;y<c.height;y++)for(let i=0;i<c.width;i++)if(D[(y*c.width+i)*4+3]){x0=Math.min(x0,i);x1=Math.max(x1,i);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,-x0,-y0);return o;};
 const comps=(()=>{const c=KP,x=c.getContext('2d'),D=x.getImageData(0,0,c.width,c.height).data,W=c.width,H=c.height,lab=new Int32Array(W*H).fill(-1),out=[];
   for(let s=0;s<W*H;s++){if(lab[s]>=0||D[s*4+3]===0)continue;const id=out.length,st=[s];lab[s]=id;let x0=W,y0=H,x1=0,y1=0,n=0;
     while(st.length){const q=st.pop(),X=q%W,Y=(q/W)|0;n++;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y;
       for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const XX=X+dx,YY=Y+dy;if(XX<0||YY<0||XX>=W||YY>=H)continue;const p=YY*W+XX;if(lab[p]<0&&D[p*4+3]>0){lab[p]=id;st.push(p);}}}
     out.push({id,x0,y0,x1,y1,n});}
   return out.filter(o=>o.n>60).sort((a,b)=>a.x0-b.x0).map(o=>{const cv=document.createElement('canvas');cv.width=o.x1-o.x0+1;cv.height=o.y1-o.y0+1;const cx=cv.getContext('2d'),id=cx.createImageData(cv.width,cv.height);
     for(let Y=o.y0;Y<=o.y1;Y++)for(let X=o.x0;X<=o.x1;X++){const p=Y*W+X;if(lab[p]!==o.id)continue;const q=((Y-o.y0)*cv.width+X-o.x0)*4;for(let k=0;k<4;k++)id.data[q+k]=D[p*4+k];}
     cx.putImageData(id,0,0);return cv;});})();
 const fr=J.R.map(([X,w,h])=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(KN,X,KN.height-h,w,h,0,0,w,h);return c;});let w=0,h=0;for(const c of fr){w+=c.width+1;h=Math.max(h,c.height);}
 const at=document.createElement('canvas');at.width=w;at.height=h;const ax=at.getContext('2d');let X=0;const R=[];
 for(const c of fr){ax.drawImage(c,X,h-c.height);R.push([X,c.width,c.height]);X+=c.width+1;}
 const ar=document.createElement('canvas');ar.width=480;ar.height=224;ar.getContext('2d').drawImage(AR,-16,0);
 return {k:at.toDataURL(),R,c:CH.toDataURL(),a:ar.toDataURL(),n:comps.length,H:h};},{R:[[0,34,35],[35,24,34],[60,28,40],[89,37,30],[127,33,25],[161,26,33]],k:ld('knight-hand.png'),p:ld('kposes.png'),c:ld('chanter-hand.png'),a:ld('arena.png')});
await br.close();

const f=__dirname+'/../../index.html';let s=fs.readFileSync(f,'utf8');
for(const [k,u] of [['b6knight',r.k],['b6chant',r.c],['b6arena',r.a]]){const line=k+":'"+u+"'";
  const re=new RegExp('^'+k+":'data:[^'\r\n]*'",'m');
  if(re.test(s)){s=s.replace(re,line);continue;}
  const i=s.lastIndexOf('\r\n};\r\n</script>');if(i<0)throw 'IMGD 結尾找不到';
  s=s.slice(0,i)+(s[i-1]===','?'':',')+'\r\n'+line+s.slice(i);}
fs.writeFileSync(f,s);console.log('已寫入 b6knight、b6chant、b6arena;B6KR=',JSON.stringify(r.R),'圖集高',r.H);})();
