// 登場用骨爪:五指張開、指尖微勾,朝天抓握(不甘、怨憤);輸出字串矩陣與放大預覽
const {Grid}=require('../boss2-gen/paint.js');const view=require('../boss2-gen/view.js');const {PAL}=require('./build.js');
function hand(){const g=Grid(15,21,0,1);
 g.R(6,13,3,7,'W');g.L(8,13,8,19,'G');                         // 前臂(橈尺骨)
 g.P([[4,9],[10,9],[11,12],[9,14],[5,14],[3,12]],'W');          // 掌
 g.L(5,12,9,12,'G');
 const F=[[[4,10],[2,6],[1,3],[2,1]],[[5,9],[4,4],[4,1],[5,0]],[[7,9],[7,3],[7,0]],[[9,9],[10,4],[10,1],[9,0]],[[10,11],[12,9],[13,6],[12,4]]]; // 小指、無名指、中指、食指、拇指
 for(const f of F){for(let i=0;i+1<f.length;i++)g.L(f[i][0],f[i][1],f[i+1][0],f[i+1][1],'W');g.S(f[1][0],f[1][1],'G');}   // 指節陰影
 g.outline();return g.rows();}
const r=hand();console.log(r.map(s=>"'"+s+"'").join(','));
view([{rows:r}],PAL,__dirname+'/hand.png',14);
