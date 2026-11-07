// 10 王第 3 段靜態小樣:在遊戲內進第 3 段,把 heart.json 的三款心臟貼在判定框位置,加 8 塊裂面殘片與暫定虛空背景,截圖合成(2 倍 + 局部 4 倍)
// 用法:node mock3.js [輸出檔] [index.html]
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const {OUT,PAL,W,H,CX,CY}=require('./heart.js');
(async()=>{const outp=process.argv[2]||__dirname+'/mock3.png',file=process.argv[3]||path.resolve(__dirname,'../../index.html');
 const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const pg=await br.newPage({viewport:{width:1024,height:576}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await pg.goto(require('url').pathToFileURL(file).href);
 await pg.evaluate(()=>{resetRun();G.world=10;G.sub=5;startLevel();G.modal=null;G.state='play';startBoss(0,3);G.state='play';
   for(let i=0;i<185;i++){P.inv=999;update();}ebul.length=0;hazs.length=0;boss.cd=99999;render();});
 await pg.waitForTimeout(400);
 const d=await pg.evaluate(([OUT,PAL,HW,HH,CX,CY])=>{const cv=document.querySelector('canvas'),o=document.createElement('canvas');o.width=1024+2*384;o.height=3*600;
   const x=o.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);x.imageSmoothingEnabled=false;
   const hash=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);};
   // 暫定虛空背景:中心最深、四周略亮的 6 階抖色;星塵沿螺旋往中心收束;右上碎月(大、碎成多塊外移)
   const [vb,vx]=(()=>{const c=document.createElement('canvas');c.width=512;c.height=288;return [c,c.getContext('2d')];})();
   const SK=['#020108','#04030e','#070615','#0a091c','#0e0d24','#13122c'],BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
   for(let y=0;y<288;y++)for(let i=0;i<512;i++){const r=Math.hypot(i-256,(y-120)*1.5)/300*5+BY[(y&3)*4+(i&3)]/16;vx.fillStyle=SK[Math.min(5,Math.floor(r))];vx.fillRect(i,y,1,1);}
   for(let k=0;k<260;k++){const t=hash(k,1),arm=k%3,r=12+t*t*300,an=arm*2.094+r*0.018+hash(k,2)*0.4,X=256+Math.cos(an)*r,Y=120+Math.sin(an)*r*0.62;const b=r/300;
     vx.fillStyle=b>0.55?'#8a8ab8':b>0.3?'#5a5a8a':'#34345a';vx.fillRect(Math.round(X),Math.round(Y),1,1);if(b>0.7&&k%5===0){vx.fillStyle='#4a4a78';vx.fillRect(Math.round(X)+1,Math.round(Y),1,1);}}
   const MX=408,MY=66,MR=58,seeds=[];for(let k=0;k<9;k++){const a=k*0.7+hash(k,3),rr=hash(k,4)*MR*0.8;seeds.push([MX+Math.cos(a)*rr,MY+Math.sin(a)*rr,(hash(k,5)-0.5)*14,(hash(k,6)-0.5)*14]);}
   for(let y=0;y<150;y++)for(let i=300;i<512;i++){let bi=-1;for(let k=0;k<seeds.length;k++){const [sx,sy,ox,oy]=seeds[k],u=i-ox,v=y-oy;if(Math.hypot(u-MX,v-MY)>MR)continue;
       let best=1e9,bb=-1;for(let q=0;q<seeds.length;q++){const dd=Math.hypot(u-seeds[q][0],v-seeds[q][1]);if(dd<best){best=dd;bb=q;}}if(bb===k){bi=k;break;}}
     if(bi<0)continue;const [,, ox,oy]=seeds[bi],u=i-ox,v=y-oy,l=0.35+0.65*Math.max(0,1-Math.hypot(u-MX+20,v-MY+20)/(MR*1.6))+(BY[(y&3)*4+(i&3)]/16-0.5)*0.15;
     vx.fillStyle=['#1c1f2e','#282c40','#363c54','#4a526c','#5e6884'][Math.max(0,Math.min(4,Math.floor(l*5)))];vx.fillRect(i,y,1,1);}
   Object.defineProperty(B10,'bg',{get(){return ()=>{ctx.drawImage(vb,0,0);};},configurable:true});
   Object.defineProperty(B10,'coreDraw',{get(){return ()=>{};},configurable:true});Object.defineProperty(B10,'coreGa',{get(){return 0.001;},configurable:true});   // 小樣:隱藏共用方塊核心
   if(!B10FC)b10FaceBake();
   const CR=[[4,6],[38,4],[24,0],[8,22],[44,20],[2,44],[46,40],[20,58]],FR=CR.map(([sx,sy])=>{const c=document.createElement('canvas');c.width=12;c.height=12;const g=c.getContext('2d');   // 8 塊裂面殘片:從第 2 段面容切下 12×12,邊緣不規則
     g.drawImage(B10FC.c,sx,sy,12,12,0,0,12,12);const id=g.getImageData(0,0,12,12);for(let j=0;j<12;j++)for(let i=0;i<12;i++){const cut=Math.abs(i-5.5)+Math.abs(j-5.5)>7+hash(sx+i,sy+j)*2;const q=(j*12+i)*4,D=id.data;if(cut){D[q+3]=0;continue;}if(!D[q+3]||(D[q+1]>150&&D[q]<120))continue;const l=(D[q]+D[q+1]+D[q+2])/3,G=['#2a282e','#5a5860','#76747c','#8a8890','#a8a6ae'][l<12?0:l<30?1:l<50?2:l<90?3:4];D[q]=parseInt(G.substr(1,2),16);D[q+1]=parseInt(G.substr(3,2),16);D[q+2]=parseInt(G.substr(5,2),16);}g.putImageData(id,0,0);return c;});
   const bk={};for(const K in OUT)bk[K]=OUT[K].map(r=>{const c=document.createElement('canvas');c.width=HW;c.height=HH;const g=c.getContext('2d');
     for(let j=0;j<HH;j++)for(let i=0;i<HW;i++){const col=PAL[r[j][i]];if(col){g.fillStyle=col;g.fillRect(i,j,1,1);}}return c;});
   let K0='A',S0=0,BOX=0;
   B10.draw=function(b){const cx=Math.round(b.x+22),cy=Math.round(b.y+22);
     for(let i=0;i<8;i++){const a=i/8*6.283+0.3,r=31;ctx.drawImage(FR[i],Math.round(cx+Math.cos(a)*r-6),Math.round(cy+Math.sin(a)*r*0.9-6));}
     ctx.drawImage(bk[K0][S0],cx-CX,cy-CY+2);gl(cx-16,cy-14,32,32,'#ff3a3a',S0===2?0.34:S0===1?0.26:0.18);
     if(BOX){ctx.strokeStyle='rgba(255,255,0,.8)';ctx.lineWidth=1;ctx.strokeRect(b.x+0.5,b.y+0.5,b.w-1,b.h-1);}PXD=1;};
   const NAME={A:'A 解剖肉感(主動脈弓三根分支呼應三齒王冠)',B:'B 黑曜根纏繞(紅肉自縫隙露出)',C:'C 晶化紅心(切面寶石感,呼應護心鏡)'};
   let row=0;for(const K of 'ABC'){boss.x=232;boss.y=46;P.x=10*TS+3;P.y=6*TS-14;K0=K;S0=0;BOX=0;for(let i=0;i<40;i++)render();
     x.drawImage(cv,0,0,cv.width,cv.height,0,row*600+24,1024,576);
     const zoom=(s,box,ox)=>{S0=s;BOX=box;render();const sx=cv.width/512;x.drawImage(cv,(boss.x-26)*sx,(boss.y-26)*sx,96*sx,96*sx,ox,row*600+24,384,384);};
     zoom(0,1,1024);zoom(2,0,1024+384);
     x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(NAME[K]+'(背景為暫定草圖)',6,row*600+18);x.fillText('4 倍:靜止 + 黃框為判定框 44×44',1030,row*600+18+400);x.fillText('4 倍:強拍',1030+384,row*600+18+400);row++;}
   return o.toDataURL().split(',')[1];},[OUT,PAL,W,H,CX,CY]);
 fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();})();
