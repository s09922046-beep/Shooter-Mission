// 像素畫草稿工具:以基本形狀組字元格,自動外框,輸出放大 PNG
const fs=require('fs');
function Grid(w,h,ox=0,oy=0,sh){const g=sh||[];if(!sh)for(let y=0;y<h;y++)g.push(Array(w).fill('.'));
 const S=(x,y,c)=>{x=Math.round(x)+ox;y=Math.round(y)+oy;if(y>=0&&y<h&&x>=0&&x<w)g[y][x]=c;};
 return {w,h,g,S,ox,oy,
  R(x,y,ww,hh,c){for(let j=0;j<hh;j++)for(let i=0;i<ww;i++)S(x+i,y+j,c);},
  L(x0,y0,x1,y1,c,t=1){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2+1;for(let k=0;k<=n;k++){const x=x0+(x1-x0)*k/n,y=y0+(y1-y0)*k/n;for(let a=0;a<t;a++)for(let b=0;b<t;b++)S(Math.floor(x+a),Math.floor(y+b),c);}},
  P(pts,c){let y0=1e9,y1=-1e9;for(const p of pts){y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
   for(let y=Math.floor(y0);y<=Math.ceil(y1);y++){const yc=y+0.5,xs=[];
    for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=yc&&b[1]>yc)||(b[1]<=yc&&a[1]>yc))xs.push(a[0]+(yc-a[1])/(b[1]-a[1])*(b[0]-a[0]));}
    xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.round(xs[i]);x<Math.round(xs[i+1]);x++)S(x,y,c);}},
  outline(c='O'){const m=g.map(r=>r.slice());for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(g[y][x]==='.'){
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const r=g[y+dy];if(r&&r[x+dx]&&r[x+dx]!=='.'&&r[x+dx]!=='O'){m[y][x]=c;break;}}}
   for(let y=0;y<h;y++)g[y]=m[y];},
  rows(){return g.map(r=>r.join(''));}};
}
module.exports={Grid};
