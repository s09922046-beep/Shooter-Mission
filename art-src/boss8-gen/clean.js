// 自動清理:孤點、小洞;再換上手繪寶石、眼睛;加外框
const N4=[[1,0],[-1,0],[0,1],[0,-1]];
function at(g,x,y){return (g[y]&&g[y][x])||'.';}
function denoise(rows){const g=rows.map(r=>r.split(''));
 for(let pass=0;pass<2;pass++){const m=g.map(r=>r.slice());
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){const c=g[y][x];
   const nb=N4.map(([dx,dy])=>at(g,x+dx,y+dy));
   if(c!=='.'&&'KUP'.includes(c)&&!nb.includes(c)){const cnt={};for(const k of nb)if(k!=='.')cnt[k]=(cnt[k]||0)+1;
     let b='.',v=0;for(const k in cnt)if(cnt[k]>v){v=cnt[k];b=k;}m[y][x]=b;}
   if(c==='.'){const nn=nb.filter(k=>k!=='.');if(nn.length>=3&&!nn.includes('W')&&!nn.includes('G')){const cnt={};for(const k of nn)cnt[k]=(cnt[k]||0)+1;
     let b='K',v=0;for(const k in cnt)if(cnt[k]>v){v=cnt[k];b=k;}m[y][x]=b;}}}
  for(let y=0;y<g.length;y++)g[y]=m[y];}
 return g;}
// 寶石 5x9 菱形(R 本色、H 高光、r 暗面)
const GEM=['..H..','.HRR.','HRRRr','RRRrr','RRRrr','.RRr.','.RRr.','..r..'];
const EYE=['EE.','.E.']; // 斜眼(左眼);右眼鏡像
function stamp(g,x,y,pat,clear){for(let j=0;j<pat.length;j++)for(let i=0;i<pat[j].length;i++){const c=pat[j][i];if(c!=='.')g[y+j][x+i]=c;else if(clear&&g[y+j])g[y+j][x+i]='.';}}
function strip(g,set,to){for(const r of g)for(let i=0;i<r.length;i++)if(set.includes(r[i]))r[i]=to;}
function outline(g){const m=g.map(r=>r.slice());for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]==='.'){
  for(const [dx,dy] of N4){const k=at(g,x+dx,y+dy);if(k!=='.'&&k!=='O'&&k!=='K'){m[y][x]='O';break;}}}
 for(let y=0;y<g.length;y++)g[y]=m[y];}
module.exports={denoise,GEM,EYE,stamp,strip,outline};
