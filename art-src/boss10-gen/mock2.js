// 10 王第 2 段靜態小樣:在遊戲內進第 2 段,把 face.json 的面容貼在判定框位置,截幾張合成畫面(2 倍)
// 用法:node mock2.js [輸出檔] [index.html]
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const {OUT,PAL}=require('./face.js');
(async()=>{const outp=process.argv[2]||__dirname+'/mock2.png',file=process.argv[3]||path.resolve(__dirname,'../../index.html');
 const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const pg=await br.newPage({viewport:{width:1024,height:576}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await pg.goto(require('url').pathToFileURL(file).href);
 const go=()=>pg.evaluate(()=>{resetRun();G.world=10;G.sub=5;startLevel();G.modal=null;G.state='play';startBoss(0,2);G.state='play';
   for(let i=0;i<185;i++){P.inv=999;update();}ebul.length=0;hazs.length=0;boss.cd=99999;render();});
 await go();await pg.waitForTimeout(400);
 const d=await pg.evaluate(([OUT,PAL])=>{const cv=document.querySelector('canvas'),o=document.createElement('canvas');o.width=1024*2;o.height=600*2;
   const x=o.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);let n=0;
   const HX_warm=()=>{for(let i=0;i<40;i++)render();};let V={};
   const face=(k,b)=>{const r=OUT[k],X=Math.round(b.x-1),Y=Math.round(b.y-3-14),pal=Object.assign({},PAL,V.pal||{});   // 臉部(王冠以下)上緣對齊判定框上緣 -3
     if(V.halo){ctx.fillStyle='#04030a';for(let j=0;j<r.length;j++)for(let i=0;i<r[j].length;i++)if(r[j][i]!=='.')ctx.fillRect(X+i-2,Y+j-2,5,5);}   // 方向 3:2 像素暗色外暈
     for(let j=0;j<r.length;j++)for(let i=0;i<r[j].length;i++){const c=pal[r[j][i]];if(c){ctx.fillStyle=c;ctx.fillRect(X+i,Y+j,1,1);}}
     if(V.rim){ctx.fillStyle=V.rim;for(let j=1;j<r.length;j++)for(let i=0;i<r[j].length;i++){const q=r[j][i];if(q!=='.'&&q!=='O'&&(r[j-1][i]==='.'||r[j-1][i]==='O'))ctx.fillRect(X+i,Y+j,1,1);}}};
   Object.defineProperty(B10,'coreDraw',{get(){return ()=>{};},configurable:true});Object.defineProperty(B10,'coreGa',{get(){return 0.001;},configurable:true});   // 小樣:先隱藏共用方塊核心(正式版核心是眼縫)
   let K0='A',BOX=0;B10.draw=function(b){face(K0,b);gl(b.x+14,b.y+10,10,4,'#ff3a3a',0.22);gl(b.x+40,b.y+10,10,4,'#ff3a3a',0.22);   // 小樣:臨時換掉第 2 段繪製
     if(BOX){ctx.strokeStyle='rgba(255,255,0,.8)';ctx.lineWidth=1;ctx.strokeRect(b.x+0.5,b.y+0.5,b.w-1,b.h-1);}PXD=1;};
   // 方向 2:月亮改色(只改月面像素:月亮範圍內比天空亮的點,轉成被虛空侵蝕的暗青灰並再壓暗)
   const bgc=B10BG[2].c,bx=bgc.getContext('2d'),orig=bx.getImageData(0,0,512,288);
   const moonTeal=()=>{const id=bx.getImageData(0,0,512,288),p=id.data;for(let y=0;y<130;y++)for(let i=190;i<330;i++){if(Math.hypot(i-B10MX,y-B10MY)>B10MR+14)continue;const k=(y*512+i)*4,l=p[k]+p[k+1]+p[k+2];
       if(l<110)continue;const v=(p[k]*0.3+p[k+1]*0.4+p[k+2]*0.3)*0.78;p[k]=v*0.55;p[k+1]=v*1.0;p[k+2]=v*1.05;}bx.putImageData(id,0,0);};
   const grab=(lab,k,bxp,by,box)=>{boss.x=bxp;boss.y=by;P.x=60;P.y=208-14;K0=k;BOX=box;HX_warm();render();
     const c=n%2,rw=Math.floor(n/2);x.drawImage(cv,0,0,cv.width,cv.height,c*1024,rw*600+24,1024,576);x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(lab,c*1024+6,rw*600+18);n++;};
   V={};grab('對照:現行(A 款,王冠加小齒)','A',228,60,0);
   V={pal:{k:'#08070e',D:'#0c0a14',M:'#15131f',N:'#24223a',H:'#46425e'}};grab('方向 1:臉壓到近黑,只留上緣月光邊光與高光','A',228,60,0);
   moonTeal();V={};grab('方向 2:月亮改為被虛空侵蝕的暗青灰(臉不變)','A',228,60,0);bx.putImageData(orig,0,0);
   V={halo:1,rim:'#b8c8e8'};grab('方向 3:臉外圍 2 像素暗色外暈,上緣邊光提亮','A',228,60,0);
   return o.toDataURL().split(',')[1];},[OUT,PAL]);
 fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();})();
