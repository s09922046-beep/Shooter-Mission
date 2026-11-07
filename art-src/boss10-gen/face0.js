// 10 王第 2 段面容:概念圖左案自動縮圖當底稿(face-auto.json、face-auto.png)。用法 node face0.js [倍率]
const down=require('./down.js');const view=require('../boss2-gen/view.js');const fs=require('fs');
const PAL={K:'#0a080c',D:'#38384a',M:'#504264',N:'#786896',L:'#9b87ac',S:'#b498c4',C:'#28f0f0',R:'#eb1e1e',r:'#961419'};
(async()=>{const s=+process.argv[2]||7;
 const all=await down(__dirname+'/../boss10-faces.webp',[[0,150,512,700]],s);fs.writeFileSync(__dirname+'/face-auto.json',JSON.stringify(all));
 for(const r of all)console.log(r[0].length+'x'+r.length);
 await view(all.map(r=>({rows:r})),PAL,__dirname+'/face-auto.png',8);})();
