// 10 王第 1 段:姿勢表自動縮圖當底稿(auto.json)與預覽 auto.png。用法 node step1.js [縮小倍率]
const down=require('./down.js');const view=require('../boss2-gen/view.js');const fs=require('fs');
const PAL={K:'#0a080c',D:'#38384a',M:'#504264',N:'#786896',L:'#9b87ac',S:'#b498c4',C:'#28f0f0',R:'#eb1e1e',r:'#961419'};
(async()=>{const s=+process.argv[2]||7.4,A=__dirname+'/../';
 const cr=[];for(let r=0;r<2;r++)for(let c=0;c<3;c++)cr.push([c*512,r*512,512,512]);
 const all=await down(A+'boss10-poses.webp',cr,s);fs.writeFileSync(__dirname+'/auto.json',JSON.stringify(all));
 for(const r of all)console.log(r[0].length+'x'+r.length);
 await view(all.map(r=>({rows:r})),PAL,__dirname+'/auto.png',6);})();
