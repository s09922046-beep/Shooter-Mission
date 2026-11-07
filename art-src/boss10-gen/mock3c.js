// 10 王第 3 段平台方案預覽(使用者 11/7):三座平台跟著藤蔓平移,中央平台對齊左數第 4 根藤蔓;a 低 1 格隔 1 格、b 低 2 格隔 1 格、c 同高隔 2 格
// 每列一個方案,三欄為藤蔓平移 0、2、4(最左、中間、最右的排法);中央平台左端紅色為「可能跳不到」的起跳區,黃線標出第 4 根藤蔓
// 用法:node mock3c.js [輸出檔] [index.html](index.html 需有暫時變數 B10PL)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{const outp=process.argv[2]||__dirname+'/mock3c.png',file=process.argv[3]||path.resolve(__dirname,'../../index.html');
 const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const pg=await br.newPage({viewport:{width:1024,height:576}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await pg.goto(require('url').pathToFileURL(file).href);
 await pg.evaluate(()=>{resetRun();G.world=10;G.sub=5;startLevel();G.modal=null;G.state='play';startBoss(0,3);G.state='play';for(let i=0;i<185;i++){P.inv=999;update();}render();});
 await pg.waitForTimeout(400);
 const d=await pg.evaluate(()=>{const cv=document.querySelector('canvas'),SC=0.6,PW=Math.round(1024*SC),PH=Math.round(576*SC),o=document.createElement('canvas');o.width=PW*3+20;o.height=3*(PH+30);
   const x=o.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);
   const FAIL={a:14,b:19,c:23},NM={a:'a 低 1 格、隔 1 格(建議)',b:'b 低 2 格、隔 1 格',c:'c 同高、隔 2 格'};
   ['a','b','c'].forEach((k,r)=>{[0,2,4].forEach((sh,c)=>{B10PL=k;const mr=Math.random;Math.random=()=>(sh+0.5)/5;resetRun();G.world=10;G.sub=5;startLevel();G.modal=null;G.state='play';startBoss(0,3);Math.random=mr;G.state='play';
       for(let i=0;i<185;i++){P.inv=999;update();}ebul.length=0;boss.cd=1e9;for(let i=0;i<30;i++){update();render();}
       const sx=cv.width/512,X=c*(PW+10),Y=r*(PH+30)+26;x.drawImage(cv,0,0,cv.width,cv.height,X,Y,PW,PH);
       const c0=B10.vc0,m=B10PLO[k][0],z=PW/512;x.fillStyle='rgba(255,40,40,.55)';x.fillRect(X+(c0*16)*z,Y+(m*16-6)*z,FAIL[k]*z,8*z);
       x.strokeStyle='rgba(255,230,0,.7)';x.lineWidth=1;const vx=X+(B10.vxs[3]*16+8)*z;x.beginPath();x.moveTo(vx,Y);x.lineTo(vx,Y+PH);x.stroke();
       x.fillStyle='#fff';x.font='16px sans-serif';x.fillText((c===0?NM[k]+'|':'')+'藤蔓平移 '+sh,X+4,r*(PH+30)+18);});});
   B10PL='a';return o.toDataURL().split(',')[1];});
 fs.writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp,'錯誤',errs.length?errs:'無');await br.close();})();
