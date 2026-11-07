// 10 王第 3 段心臟:以距離場(SDF)程式產生三款靜態小樣,每款三種大小(靜止、弱拍、強拍)
// A 解剖肉感(主動脈弓三根分支呼應三齒王冠)、B 黑曜根纏繞(紅肉自縫隙露出)、C 晶化紅心(切面寶石感,呼應第 1 段護心鏡)
// 輸出 heart.json 與 heart.png。用法:node heart.js
const fs=require('fs');
// 色號:O 外框、1~5 紅肉由暗到亮、h 高光、v 血管斷口內部、g 冠狀血管溝、r 上緣邊光;黑曜根 K D M N L、E 青色裂縫;晶面 6~9
const PAL={O:'#14030a','1':'#3a0610','2':'#5a0c16','3':'#86182a','4':'#b82434','5':'#e04048',h:'#ff9a9a',v:'#0c0106',g:'#4a0812',r:'#ff7a80',
  K:'#07060c',D:'#1c1a2a',M:'#2a2740',N:'#3c3858',L:'#6c6894',E:'#3ad0c8',
  '6':'#2a040c','7':'#6a0e1c','8':'#a81c2c','9':'#ff6a6a',w:'#ffe0e0'};
const h2=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
const W=44,H=46,CX=22,CY=25;
const len=(x,y)=>Math.hypot(x,y);
function sdCap(px,py,ax,ay,bx,by,ra,rb){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));return len(px-ax-dx*t,py-ay-dy*t)-(ra+(rb-ra)*t);}
function smin(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k/4;}
function chain(px,py,P,r){let d=1e9;for(let i=0;i+1<P.length;i++)d=Math.min(d,sdCap(px,py,P[i][0],P[i][1],P[i+1][0],P[i+1][1],r,r));return d;}
// 心室本體(不含血管);s 為縮放
function body(x,y){const a=len(x+5,y+1)-10.2,b=len(x-5,y-1)-10.8,c=sdCap(x,y,1.5,3,5,15.5,9.5,1.6);return smin(smin(a,b,3),c,5);}
const AO=[[-1,-8],[-1.5,-14],[2,-17.5],[7,-17],[10,-13]],PU=[[2,-7],[-3,-13],[-7.5,-14.5]],VC=[[-8,-5],[-9.5,-13]];
const BR=[[[0.5,-16.5],[-0.5,-21]],[[3.8,-18],[4.2,-22.5]],[[7.5,-17],[9,-21]]];   // 主動脈弓三根分支(呼應三齒王冠,中間最高)
function vessels(x,y){let d=chain(x,y,AO,3.1);d=Math.min(d,chain(x,y,PU,2.7),chain(x,y,VC,2.3));for(const [p,q] of BR)d=Math.min(d,sdCap(x,y,p[0],p[1],q[0],q[1],1.5,1.2));return d;}
const ENDS=[[-7.5,-14.5,2.0],[-9.5,-13,1.6],[-0.5,-21,0.9],[4.2,-22.5,0.9],[9,-21,0.9],[10,-13,1.3]];   // 斷口位置與內徑(右下降主動脈斷口縮小,使用者選 A 後:原 2.2 圓圈像眼睛)
function build(kind,sc){
  const G=[];for(let j=0;j<H;j++){G.push(new Array(W).fill('.'));}
  const sd=(x,y)=>{const bx=(x-CX)/sc,by=(y-CY)/sc,db=body(bx,by);if(kind==='C'){   // C:無血管,頂端三根晶柱
      let d=db;for(const [p,q] of [[[-4,-8],[-6,-16]],[[1,-9],[1.5,-19]],[[6,-8],[9,-15]]])d=Math.min(d,sdCap(bx,by,p[0],p[1],q[0],q[1],2.6,0.4));return [d,db];}
    return [smin(db,vessels(bx,by),1.5),db];};
  const L=[-0.55,-0.7,0.45],ll=len(len(L[0],L[1]),L[2]);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){let inside=0;for(const [ox,oy] of [[0.25,0.25],[0.75,0.25],[0.25,0.75],[0.75,0.75]])if(sd(i+ox,j+oy)[0]<0)inside++;
    if(inside<2)continue;
    const x=i+0.5,y=j+0.5,[d,db]=sd(x,y),e=0.5,nx=sd(x+e,y)[0]-sd(x-e,y)[0],ny=sd(x,y+e)[0]-sd(x,y-e)[0];
    const dep=Math.min(1,-d/(kind==='C'?5:6)),nz=0.35+dep*1.6,nl=len(len(nx,ny),nz);
    let s=(nx*L[0]+ny*L[1]+nz*L[2])/(nl*ll);
    if(kind==='C'){   // 晶面:以種子點分區,每區取一個平面法向
      let best=1e9,bi=0;for(let k=0;k<14;k++){const sx=CX+(h2(k,1)-0.5)*30*sc,sy=CY-4+(h2(k,2)-0.5)*34*sc,dd=len(x-sx,y-sy);if(dd<best){best=dd;bi=k;}}
      s=0.25+h2(bi,3)*0.75-(y-CY)/(60*sc);G[j][i]=s>0.85?'9':s>0.6?'8':s>0.35?'7':'6';continue;}
    s+=(h2(i,j)-0.5)*0.08;
    G[j][i]=s>0.9?'h':s>0.72?'5':s>0.5?'4':s>0.28?'3':s>0.08?'2':'1';
    if(db>0.5&&kind!=='C'){const vs=s+0.1;G[j][i]=vs>0.8?'4':vs>0.5?'3':vs>0.25?'2':'1';}   // 血管比心室暗一階
  }
  const at=(i,j)=>j>=0&&j<H&&i>=0&&i<W?G[j][i]:'.';
  if(kind!=='C'){
    for(const [ex,ey,r] of ENDS){const X=CX+ex*sc,Y=CY+ey*sc;for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(G[j][i]==='.')continue;const dd=len((i+0.5-X)/1.25,j+0.5-Y);if(dd<r*sc*0.75)G[j][i]='v';else if(dd<r*sc*0.75+0.9)G[j][i]='4';}}   // 血管斷口
    // 冠狀溝:心室中線由血管根部斜下到心尖
    for(let t=0;t<=1;t+=0.02){const bx=-1+t*6+Math.sin(t*3)*1.5,by=-5+t*19,i=Math.round(CX+bx*sc),j=Math.round(CY+by*sc);if('12345h'.includes(at(i,j)))G[j][i]='g';}
    for(let t=0;t<=1;t+=0.04){const i=Math.round(CX+(2+t*7)*sc),j=Math.round(CY+(2+t*3+Math.sin(t*4)*1.2)*sc);if('12345h'.includes(at(i,j)))G[j][i]='g';}
  }
  if(kind==='B'||kind==='D'){   // 黑曜根:四條帶狀根斜纏過心臟(與藤蔓同材質);D 為 A 款加 2 條(使用者看初版後要求,11/7)
    const bands=kind==='D'?[[-0.5,-3,2.2],[0.4,8,2.3]]:[[-0.55,-6,2.2],[0.35,3,2.6],[-0.15,11,2.0],[0.9,-2,1.8]];
    for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(G[j][i]==='.'||G[j][i]==='v')continue;const x=(i+0.5-CX)/sc,y=(j+0.5-CY)/sc;
      for(const [k,c,w] of bands){const yy=y-(c+k*x+Math.sin(x*0.5+c)*1.6),d=Math.abs(yy);if(d<w){G[j][i]=d>w-0.9?'K':yy<-w*0.3?'L':yy<w*0.2?'N':yy<w*0.6?'M':'D';if(h2(i*3,j*7)>0.93&&d<w-1)G[j][i]='E';break;}}}
  }
  // 外框
  const F=G.map(r=>r.slice());
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(G[j][i]==='.')continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>at(i+a,j+b)==='.'))F[j][i]=kind==='B'&&'KDMNL'.includes(G[j][i])?'K':'O';}
  // 上緣邊光(左上方月光)
  for(let j=1;j<H;j++)for(let i=1;i<W;i++){if(F[j][i]==='.'||F[j][i]==='O'||F[j][i]==='K'||F[j][i]==='v')continue;if((F[j-1][i]==='O'||F[j-1][i]==='K')&&at(i,j-2)==='.'&&i<CX+6*sc)F[j][i]=kind==='C'?'w':'KDMNL'.includes(F[j][i])?'L':'r';}
  return F.map(r=>r.join(''));
}
const OUT={};for(const k of ['A','B','C','D'])OUT[k]=[1,1.05,1.11].map(s=>build(k,s));
module.exports={OUT,PAL,W,H,CX,CY};
if(require.main===module){fs.writeFileSync(__dirname+'/heart.json',JSON.stringify(OUT));
  const view=require('../boss2-gen/view.js');view([...'ABCD'].flatMap(k=>OUT[k].map((rows,i)=>({rows}))),PAL,__dirname+'/heart.png',6).then(()=>console.log('已存 heart.json、heart.png'));}
