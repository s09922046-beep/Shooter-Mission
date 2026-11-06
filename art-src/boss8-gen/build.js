// 由去雜點底稿組成三姿勢:換寶石與眼睛、兜帽高光、外框;以左眼為錨點對齊判定框 26x34
const {GEM,EYE,stamp,outline}=require('./clean.js');
const den=require('./den.json');
const PAL={O:'#0a0710',K:'#1c1426',U:'#3c2256',P:'#603282',Q:'#8a58b0',W:'#e6dec4',G:'#a89c80',E:'#a8ff60',R:'#e8283a',r:'#8a1424',H:'#ffa0a0',F:'#4aff6a',f:'#1a9a3a',X:'#ffffff'};
const SPEC=[
 {n:'idle',  gem:[2,15,8,11],gs:[3,16],eye:[14,6,9,4],es:[16,7],fix:[]},
 {n:'summon',gem:[5,23,8,10],gs:[7,24],eye:[13,13,9,4],es:[15,14],fix:[]},
 {n:'point', gem:[15,18,7,10],gs:[16,19],eye:[22,6,9,4],es:[24,7],fix:[[24,7,'K'],[27,7,'K']]},
];
const NOGEM=!!process.env.NOGEM;
const HB={dx:-14,dy:-4,w:26,h:34}; // 判定框相對左眼錨點
function pose(i){
 const s=SPEC[i],g=den[i].map(r=>r.split(''));
 const [gx,gy,gw,gh]=s.gem;for(let y=gy;y<gy+gh;y++)for(let x=gx;x<gx+gw;x++)if(g[y]&&'RrGH'.includes(g[y][x]))g[y][x]='.';
 const [ex,ey,ew,eh]=s.eye;for(let y=ey;y<ey+eh;y++)for(let x=ex;x<ex+ew;x++)if(g[y][x]==='E'||g[y][x]==='W')g[y][x]='K';
 for(const [x,y,c] of s.fix)g[y][x]=c;
 if(!NOGEM)stamp(g,s.gs[0],s.gs[1],GEM);
 stamp(g,s.es[0],s.es[1],EYE);stamp(g,s.es[0]+3,s.es[1],['EE','E.']);
 // 兜帽頂高光:上方是空的紫色像素
 for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]==='P'&&(!g[y-1]||g[y-1][x]==='.')&&y<20)g[y][x]='Q';
 // 封閉破洞補黑(由外緣灌水,灌不到的空格屬於內部)
 {const H=g.length,Wd=g[0].length,seen=new Set(),st=[];
  for(let x=0;x<Wd;x++){st.push([x,0],[x,H-1]);}for(let y=0;y<H;y++){st.push([0,y],[Wd-1,y]);}
  while(st.length){const [x,y]=st.pop();if(x<0||y<0||x>=Wd||y>=H)continue;const k=y*Wd+x;if(seen.has(k)||g[y][x]!=='.')continue;seen.add(k);st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
  for(let y=0;y<H;y++)for(let x=0;x<Wd;x++)if(g[y][x]==='.'&&!seen.has(y*Wd+x))g[y][x]='K';}
 // 外框:四周補 1 格
 const w=g[0].length+2,pad=[Array(w).fill('.')];const G2=[...pad,...g.map(r=>['.',...r,'.']),Array(w).fill('.')];
 outline(G2);
 return {n:s.n,rows:G2.map(r=>r.join('')),ax:s.es[0]+1,ay:s.es[1]+1,gx:s.gs[0]+1,gy:s.gs[1]+1};
}
const P=[0,1,2].map(pose);
// 命匣:骨製提燈加綠魂火,14x14 = 判定框;火焰 3 格動畫(F 火、L 火心、f 暗火)
const LANT_BASE=['....OOOOOO....','...OWWWWWWO...','...OWKWWKWO...','...OGWWWWGO...','.OOOOGWGWOOOO.','OWWWWWWWWWWWWO','OGWGGGGGGGGWGO',
 '.OWO......OWO.','.OWO......OWO.','.OWO......OWO.','.OWO......OWO.','.OWO......OWO.','OWWWWWWWWWWWWO','.OOOOOOOOOOOO.'];
const FL=[['KKfKKK','KfFfKK','fFFFfK','fFLFfK','KfFfKK'],['KKKfKK','KKfFfK','KfFFFf','KfFLFf','KKfFfK'],['KKfKKK','KfFFfK','fFFFFf','fFLLFf','KfFFfK']];
const LANT=FL.map(f=>LANT_BASE.map((r,j)=>j>=7&&j<=11?r.slice(0,4)+f[j-7]+r.slice(10):r));
PAL.L='#d8ffb8';
module.exports={P,PAL,HB,LANT};
if(require.main===module)(async()=>{const view=require('../boss2-gen/view.js');
 // 偵錯版:判定框畫成 X 框線
 const dbg=P.map(p=>{const g=p.rows.map(r=>r.split(''));const x0=p.ax+HB.dx,y0=p.ay+HB.dy;
  for(let x=x0;x<x0+HB.w;x++){g[y0][x]='X';g[y0+HB.h-1][x]='X';}for(let y=y0;y<y0+HB.h;y++){g[y][x0]='X';g[y][x0+HB.w-1]='X';}
  return {rows:g.map(r=>r.join(''))};});
 await view(P.map(p=>({rows:p.rows})),PAL,__dirname+'/v1.png',7);
 await view(dbg,PAL,__dirname+'/v1_hb.png',5);
 await view(LANT.map(r=>({rows:r})),PAL,__dirname+'/v1_lant.png',10);
 P.forEach(p=>console.log(p.n,p.rows[0].length+'x'+p.rows.length));})();
