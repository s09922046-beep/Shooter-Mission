// 放大檢查局部:node zoom.js 姿勢編號 x0 y0 x1 y1 [倍率]
const view=require('../boss2-gen/view.js');const {OUT,PAL}=require('./seg1.js');
const [i,x0,y0,x1,y1,z]=process.argv.slice(2).map(Number);
const r=OUT[i].rows.slice(y0,y1+1).map(s=>s.slice(x0,x1+1));
view([{rows:r}],PAL,__dirname+'/zoom.png',z||20);
