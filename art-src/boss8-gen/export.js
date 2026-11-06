// 匯出遊戲用矩陣(NOGEM=1:寶石另畫);h=判定框在圖內的左上角,g=寶石外框圖左上角(含 1 格外框)
process.env.NOGEM='1';const {P,HB,LANT}=require('./build.js');
const q=r=>"'"+r+"'";
let o='';for(const p of P){o+='  '+p.n+':{h:['+(p.ax+HB.dx)+','+(p.ay+HB.dy)+'],g:['+(p.gx-1)+','+(p.gy-1)+'],r:[\n'+p.rows.map(q).join(',\n')+']},\n';}
o+='  lant:[\n'+LANT.map(f=>'['+f.map(q).join(',')+']').join(',\n')+']\n';
require('fs').writeFileSync(__dirname+'/frames.txt',o);console.log(o.length);
