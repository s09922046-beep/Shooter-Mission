const {pose}=require('./b2p.js');
const N=['idle','walk','windup','slash','thrust','plunge'];
let out='';
for(const n of N){const r=pose(n);let x0=1e9,x1=-1,y0=1e9,y1=-1;
 r.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]!=='.'){x0=Math.min(x0,i);x1=Math.max(x1,i);y0=Math.min(y0,j);y1=Math.max(y1,j);}});
 let vx=-1,vy=-1,vw=0;r.forEach((row,j)=>{const k=row.indexOf('E');if(k>=0&&vx<0){vx=k;vy=j;vw=row.lastIndexOf('E')-k+1;}});
 out+=`  ${n}:{x:${x0},y:${y0},v:[${vx},${vy},${vw}],r:[\n`+r.slice(y0,y1+1).map(row=>"'"+row.slice(x0,x1+1)+"'").join(',\n')+`]},\n`;}
require('fs').writeFileSync(__dirname+'/frames.txt',out);console.log(out.length);
