// 10 王第 3 段子彈壓迫感選項小樣(使用者看初版後覺得三招太細弱,11/7):A 子彈加重、B 發射衝擊、C 蓄力預兆
// 每列一個選項,三欄依序為螺旋(冷青)、缺口環(淡紫)、瞄準扇形(粉紅);C 另截發射前 15 幀。以心臟為中心裁 240×150、放大 3 倍
// 用法:node mock3b.js [輸出檔] [index.html](index.html 需有暫時旗標 B10BX)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{const outp=process.argv[2]||__dirname+'/mock3b.png',file=process.argv[3]||path.resolve(__dirname,'../../index.html');
 const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const pg=await br.newPage({viewport:{width:1024,height:576}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await pg.goto(require('url').pathToFileURL(file).href);
 await pg.evaluate(()=>{resetRun();G.world=10;G.sub=5;startLevel();G.modal=null;G.state='play';startBoss(0,3);G.state='play';for(let i=0;i<185;i++){P.inv=999;update();}render();});
 await pg.waitForTimeout(400);
 const d=await pg.evaluate(()=>{const cv=document.querySelector('canvas'),CW=240,CH=150,Z=3,o=document.createElement('canvas');o.width=CW*Z*3+40;o.height=5*(CH*Z+30);
   const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);
   const fresh=()=>{startBoss(0,3);G.state='play';for(let i=0;i<185;i++){P.inv=999;update();}ebul.length=0;hazs.length=0;boss.cd=9999;boss.x=232;boss.y=46;boss.t0=G.t;P.x=10*TS+3;P.y=6*TS-14;};
   const grab=(r,c,lab)=>{for(let i=0;i<6;i++)render();const sx=cv.width/512,X=boss.x+22-CW/2,Y=boss.y+22-CH/2+20;
     x.drawImage(cv,X*sx,Y*sx,CW*sx,CH*sx,c*(CW*Z+20),r*(CH*Z+30)+26,CW*Z,CH*Z);x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(lab,c*(CW*Z+20)+4,r*(CH*Z+30)+20);};
   const run=n=>{for(let i=0;i<n;i++){P.inv=999;const bx=boss.x,by=boss.y;update();boss.x=bx;boss.y=by;}};   // 心臟固定在畫面中央方便比較
   const rows=[['','現行(初版)'],['A','A 子彈加重:深色外緣加白心、拖尾 4 格、光暈加大'],['B','B 發射衝擊:心臟迸出彈色衝擊環,最近 2 條藤蔓整條亮'],['C','C 蓄力預兆:發射前 30 幀,下一招顏色的光點聚向心臟'],['ABC','A+B+C 全部']];
   const NM=['螺旋','缺口環','瞄準扇形'];
   rows.forEach(([f,lab],r)=>{B10BX=f;for(let ai=0;ai<3;ai++){fresh();boss.ai=ai;
     if(f==='C'&&ai===0){boss.cd=15;run(1);grab(r,0,lab+'|發射前 15 幀');continue;}
     boss.cd=0;run(f==='B'?8:f==='ABC'?14:40);grab(r,ai,(ai===0?lab+'|':'')+NM[ai]);}});
   B10BX='';return o.toDataURL().split(',')[1];});
 fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();})();
