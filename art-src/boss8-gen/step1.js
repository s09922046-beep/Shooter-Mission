// 步驟:node step1.js 12.8(縮圖底稿 auto.json、去雜點 den.json)→ node build.js(預覽 v1*.png)→ node export.js(frames.txt,貼進 index.html 的 B8F)
const down=require('./down.js');const view=require('../boss2-gen/view.js');const fs=require('fs');
const PAL={O:'#0c0810',K:'#1a1222',U:'#3a2052',P:'#5e3080',Q:'#8250a8',W:'#e6dec4',G:'#a89c80',E:'#a8ff60',R:'#e8283a',r:'#8a1424',H:'#ff9a9a',F:'#4aff6a',f:'#1a9a3a'};
(async()=>{const A='../';
 const s=+process.argv[2]||11.6;
 const poses=await down(A+'boss8-poses.webp',[[0,0,666,667],[667,0,666,667],[1333,0,667,667]],s);
 const main=await down(A+'boss8-main.webp',[[0,0,1150,1024],[1150,450,386,400]],s*1.85);
 const all=[...poses,...main];fs.writeFileSync('auto.json',JSON.stringify(all));
 const {denoise}=require('./clean.js');fs.writeFileSync('den.json',JSON.stringify(all.slice(0,3).map(r=>denoise(r).map(x=>x.join('')))));
 for(const r of all)console.log(r[0].length+'x'+r.length);
 await view(all.map(r=>({rows:r})),PAL,__dirname+'/auto.png',7);})();
