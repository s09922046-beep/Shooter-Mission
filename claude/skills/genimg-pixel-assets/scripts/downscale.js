#!/usr/bin/env node
// 把生圖工具產出的大圖(純色底)縮成像素素材:每個輸出像素對應原圖 N×N 區塊,去背、壓色後輸出 PNG。
// 用法:node downscale.js <輸入圖> <輸出.png> --scale N [--crop x,y,w,h] [--colors K] [--key #FF00FF] [--keytol 90] [--outline 0.3] [--fringe 1] [--view M]
//   --scale    原圖幾個像素縮成 1 個輸出像素(必填;版型底圖用幾倍畫,這裡就填幾)
//   --crop     只取原圖的這個範圍(原圖像素座標;省略為整張)
//   --colors   壓成幾色(預設 12;k-means 分色,不含透明)
//   --key      底色(預設 #FF00FF),--keytol 為判定「是底色」的 RGB 距離(預設 90)
//   --outline  區塊內最暗的那一色占比達到這個值就取它(預設 0.3;保住縮小後容易斷掉的深色外框,設 0 關閉)
//   --fringe   1(預設)把色相與底色相同的鮮豔色群也當底色,去掉去背邊緣的混色;圖中本來就有接近底色的顏色時設 0
//   --view     另存一張放大 M 倍的檢視圖 <輸出>-view.png(預設 4,設 0 不存)
// 每個區塊的規則:底色占一半以上 → 透明;否則最暗色達 --outline → 取最暗色;否則取出現最多的顏色(眾數,不取平均,避免邊緣糊成中間色)。
// 需要 playwright(從目前資料夾或其下的 tools/ 尋找)與 Chrome;Chrome 不在預設位置時設 CHROME 環境變數。
const fs=require('fs'),path=require('path');
const av=process.argv.slice(2),pos=[],opt={};
for(let i=0;i<av.length;i++){if(av[i].startsWith('--'))opt[av[i].slice(2)]=av[++i];else pos.push(av[i]);}
const [inp,out]=pos,N=+opt.scale;
if(!inp||!out||!(N>=1)){console.log('用法:node downscale.js <輸入圖> <輸出.png> --scale N [--crop x,y,w,h] [--colors K] [--key #FF00FF] [--keytol 90] [--outline 0.3] [--view M]');process.exit(1);}
let pw;try{pw=require(require.resolve('playwright',{paths:[process.cwd(),path.join(process.cwd(),'tools')]}));}
catch(e){console.log('找不到 playwright:請在專案(或其 tools/ 資料夾)執行 npm install playwright');process.exit(1);}
const CHROME=process.env.CHROME||{win32:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',darwin:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}[process.platform]||'/usr/bin/google-chrome';
const ext=path.extname(inp).slice(1).toLowerCase().replace('jpg','jpeg');
const src='data:image/'+ext+';base64,'+fs.readFileSync(inp).toString('base64');
const P={N,K:+(opt.colors||12),key:(opt.key||'#FF00FF').replace('#',''),tol:+(opt.keytol||90),ol:opt.outline===undefined?0.3:+opt.outline,view:opt.view===undefined?4:+opt.view,fringe:opt.fringe===undefined?1:+opt.fringe,crop:opt.crop?opt.crop.split(',').map(Number):null};
(async()=>{
  const br=await pw.chromium.launch({executablePath:CHROME,args:['--no-sandbox']});const pg=await br.newPage();
  const r=await pg.evaluate(async([src,P])=>{
    const im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('圖片讀取失敗'));i.src=src;});
    const [cx,cy,cw,ch]=P.crop||[0,0,im.width,im.height],N=P.N,W=Math.floor(cw/N),H=Math.floor(ch/N);
    const c=document.createElement('canvas');c.width=W*N;c.height=H*N;const x=c.getContext('2d',{willReadFrequently:true});   // 要讀回像素,畫布建在 CPU 端
    x.drawImage(im,cx,cy,W*N,H*N,0,0,W*N,H*N);const d=x.getImageData(0,0,W*N,H*N).data;
    const kr=parseInt(P.key.slice(0,2),16),kg=parseInt(P.key.slice(2,4),16),kb=parseInt(P.key.slice(4,6),16),t2=P.tol*P.tol;
    const isKey=i=>{const a=d[i]-kr,b=d[i+1]-kg,e=d[i+2]-kb;return d[i+3]<128||a*a+b*b+e*e<t2;};
    // k-means 分色(非底色像素取樣;起始中心依亮度均分,結果固定不含亂數)
    const smp=[];const step=Math.max(1,Math.floor(Math.sqrt(W*N*H*N/60000)));
    for(let yy=0;yy<H*N;yy+=step)for(let xx=0;xx<W*N;xx+=step){const i=(yy*W*N+xx)*4;if(!isKey(i))smp.push([d[i],d[i+1],d[i+2]]);}
    if(!smp.length)return {err:'整張都被判定為底色,請檢查 --key 與 --keytol'};
    // 起始中心:先取最暗的,再反覆取「離現有中心最遠」的樣本(固定結果、不含亂數;少量但差異大的顏色不會被併掉)
    const K=Math.min(P.K,smp.length),lum=p=>p[0]*3+p[1]*4+p[2];let cen=[smp.reduce((a,b)=>lum(b)<lum(a)?b:a).slice()];
    const md=smp.map(()=>1e9);while(cen.length<K){const q=cen[cen.length-1];let bi=0;for(let i=0;i<smp.length;i++){const p=smp[i],dd=(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2;if(dd<md[i])md[i]=dd;if(md[i]>md[bi])bi=i;}cen.push(smp[bi].slice());}
    const near=(r,g,b)=>{let bi=0,bd=1e9;for(let k=0;k<cen.length;k++){const q=cen[k],dd=(r-q[0])**2+(g-q[1])**2+(b-q[2])**2;if(dd<bd){bd=dd;bi=k;}}return bi;};
    for(let it=0;it<12;it++){const s=cen.map(()=>[0,0,0,0]);for(const p of smp){const k=near(p[0],p[1],p[2]);s[k][0]+=p[0];s[k][1]+=p[1];s[k][2]+=p[2];s[k][3]++;}
      cen=cen.map((q,k)=>s[k][3]?[s[k][0]/s[k][3],s[k][1]/s[k][3],s[k][2]/s[k][3]]:q);}
    cen=cen.map(q=>q.map(Math.round));
    // 底色溢邊:去背邊緣常留一圈底色與本體的混色;色相方向與底色相同且夠鮮豔的色群視為底色(--fringe 0 關閉)
    const hue=q=>{const m=(q[0]+q[1]+q[2])/3,v=[q[0]-m,q[1]-m,q[2]-m],l=Math.hypot(v[0],v[1],v[2]);return [v,l];},[kv,kl]=hue([kr,kg,kb]);
    const fr=cen.map(q=>{if(!P.fringe||kl<20)return false;const [v,l]=hue(q);return l>40&&(v[0]*kv[0]+v[1]*kv[1]+v[2]*kv[2])/(l*kl)>0.92;});
    let dk=0;for(let k=1;k<cen.length;k++)if(!fr[k]&&cen[k][0]*3+cen[k][1]*4+cen[k][2]<cen[dk][0]*3+cen[dk][1]*4+cen[dk][2])dk=k;
    const o=document.createElement('canvas');o.width=W;o.height=H;const ox=o.getContext('2d'),oi=ox.createImageData(W,H),od=oi.data,cnt=new Uint32Array(cen.length);let solid=0;
    for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){cnt.fill(0);let nk=0;
      for(let j=0;j<N;j++)for(let i=0;i<N;i++){const p=((y*N+j)*W*N+xx*N+i)*4;if(isKey(p)){nk++;continue;}const k=near(d[p],d[p+1],d[p+2]);if(fr[k])nk++;else cnt[k]++;}
      if(nk*2>N*N)continue;
      let best=0;for(let k=1;k<cnt.length;k++)if(cnt[k]>cnt[best])best=k;
      if(P.ol>0&&cnt[dk]>=(N*N-nk)*P.ol)best=dk;
      const q=cen[best],p=(y*W+xx)*4;od[p]=q[0];od[p+1]=q[1];od[p+2]=q[2];od[p+3]=255;solid++;}
    ox.putImageData(oi,0,0);let view=null;
    if(P.view>0){const v=document.createElement('canvas');v.width=W*P.view;v.height=H*P.view;const vx=v.getContext('2d');vx.imageSmoothingEnabled=false;
      vx.fillStyle='#404048';vx.fillRect(0,0,v.width,v.height);vx.drawImage(o,0,0,v.width,v.height);view=v.toDataURL();}
    return {png:o.toDataURL(),view,W,H,solid,pal:cen.filter((q,k)=>!fr[k]).map(q=>'#'+q.map(v=>v.toString(16).padStart(2,'0')).join(''))};
  },[src,P]);
  await br.close();
  if(r.err){console.log('錯誤:'+r.err);process.exit(1);}
  const sv=(f,u)=>fs.writeFileSync(f,Buffer.from(u.split(',')[1],'base64'));
  sv(out,r.png);if(r.view)sv(out.replace(/\.png$/i,'')+'-view.png',r.view);
  console.log('已存',out,r.W+'×'+r.H,'不透明像素',r.solid+'/'+r.W*r.H,'('+(r.solid/(r.W*r.H)*100).toFixed(1)+'%)');
  console.log('調色盤',r.pal.join(' '));
  console.log('base64 約',Math.round(fs.statSync(out).size*4/3/1024*10)/10,'KB');
})().catch(e=>{console.log('錯誤:'+e.message);process.exit(1);});
