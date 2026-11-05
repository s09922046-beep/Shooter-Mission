const {Grid}=require('./paint.js');const view=require('./view.js');const {PAL}=require('./b2.js');
const BODY=[ // 從 x=8,y=5 起;'.' 透明
".......OOOOOO.....",
"......OAAAASSO....",
"......OAASSSSDO...",
".....OEEESSSSDO...",
"......OSSSSSDDO...",
"......OSDSSSDO....",
".......OSSDDO.....",
"........OMMO......",
"......OOAAASOO....",
".....OAAAASSSDO...",
"....OAAASSSSSDO...",
"....OAASSSSSSDO...",
".....OSSSSSSDO....",
"......OSSSSDDO....",
"......OSSSSDO.....",
"......ODMMMDO.....",
".....OCAACCCBO....",
".....OCAACCCCBO...",
"....OCAAACCCCBO...",
"....OCASCCBCCCBO..",
"...OCCCCCCBCCCCBO.",
"...OCCCCCCBCCCCCBO",
"..OCCCCCCBCCCCCCBO",
"..OCCCCCCBCCCCCCCO",
".OCCCCCCCBCCCCCBOO",
".OOOOCCCOOOOCCOO..",
"...OSSSO...OOOO...",
"...OASSO...ODDDO..",
"...OASO.....ODDO..",
"..OAAASO....ODDDO.",
"..OSSSO.....ODDDO.",
"..OSSO.......ODDO.",
".OSSSO.......ODDO.",
".OSSSO......ODMMDO",
"OAASSSO.....OMMMMO",
"ODDDDDO.....OMMMMO",
"OOOOOOO.....OOOOOO"];
function stamp(g,blk,X,Y){blk.forEach((r,j)=>{for(let i=0;i<r.length;i++)if(r[i]!=='.')g.g[Y+j][X+i]=r[i];});}
function feather(g,x0,y0,x1,y1,k){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
 for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,th=t<0.8?3:2;
  for(let a=0;a<th;a++)for(let b=0;b<th;b++)g.S(x+a-1,y+b-1,t>k?'K':(a+b===0&&t<0.8?'G':'W'));}}
function feather(g,x0,y0,x1,y1,k){const dx=x1-x0,dy=y1-y0,n=Math.hypot(dx,dy),ux=dx/n,uy=dy/n,vx=-uy,vy=ux;
 const poly=(w0,w1,e)=>[[x0+vx*w0,y0+vy*w0],[x1+vx*w1+ux*e,y1+vy*w1+uy*e],[x1-vx*w1+ux*e,y1-vy*w1+uy*e],[x0-vx*w0,y0-vy*w0]];
 g.P(poly(2.6,2.0,1),'O');g.P(poly(1.7,1.1,0),'W');
 const xk=x0+dx*k,yk=y0+dy*k;g.P([[xk+vx*1.6,yk+vy*1.6],[x1+vx*1.1,y1+vy*1.1],[x1-vx*1.1,y1-vy*1.1],[xk-vx*1.6,yk-vy*1.6]],'K');
 }
function make(o){const g=Grid(44,42);
 // 翅膀:根部在背後肩頭
 const WR=o.WR||[30,8],RT=o.RT||[23,19],ang=o.ang||[48,31,14,-3,-20],len=o.len||[13,14,14,13,11];
 for(let i=ang.length-1;i>=0;i--){const t=i/(ang.length-1),bx=WR[0]+(RT[0]-WR[0])*t,by=WR[1]+(RT[1]-WR[1])*t,r=ang[i]*Math.PI/180;
  feather(g,bx,by,bx+Math.cos(r)*len[i],by-Math.sin(r)*len[i],0.72);}
 // 覆羽:沿前緣(手臂)一條白色厚帶,下緣扇貝
 g.P([[RT[0]-4,RT[1]],[WR[0]-3,WR[1]-3],[WR[0]+1,WR[1]-3],[WR[0]+2,WR[1]],[RT[0]+3,RT[1]+1]],'O');
 g.P([[RT[0]-3,RT[1]-1],[WR[0]-2,WR[1]-2],[WR[0],WR[1]-2],[WR[0]+1,WR[1]],[RT[0]+2,RT[1]]],'W');
 for(let k=1;k<4;k++){const t=k/4;g.S(WR[0]+(RT[0]-WR[0])*t+1,WR[1]+(RT[1]-WR[1])*t+0.5,'G');}
 g.outline();
 // 馬尾
 if(o.hair){g.P([[20,8],[23,9],[25,14],[27,19],[27,23],[25,22],[23,16],[21,12]],'O');
  g.P([[21,9],[22,10],[24,14],[26,19],[26,21],[25,20],[23,15],[21,11]],'H');g.L(22,11,25,18,'h');}
 // 劍(在身體前,手之下)
 g.L(0,30,9,25,'L',2);g.L(0,31,9,26,'T');g.S(0,30,'O');
 g.outline();
 stamp(g,BODY,8,5);
 // 頭盔後掠鰭
 g.P([[16,5],[17,2],[20,0],[25,0],[27,1],[27,3],[24,2],[22,3],[21,5]],'A');g.L(18,3,20,2,'S');g.L(18,4,20,4,'S');g.S(26,2,'S');g.outline();
 // 手臂與護手
 for(const [x,y,c] of [[14,15,'O'],[13,16,'D'],[14,16,'S'],[12,17,'D'],[13,17,'S'],[12,18,'D'],[11,19,'D'],[12,19,'S'],[10,20,'O'],[11,20,'D'],[12,20,'D'],[10,21,'S'],[11,21,'S'],[12,21,'A'],[10,22,'O'],[11,22,'O'],[12,22,'O']])g.S(x,y,c);
 // 護手(十字護手縱向)
 for(let y=19;y<=25;y++)g.S(9,y,'D');g.S(8,19,'O');g.S(8,25,'O');
 if(o.chin){for(const [x,y,c] of [[15,9,'F'],[16,9,'F'],[15,10,'F'],[16,10,'F'],[16,11,'f'],[17,11,'D'],[14,9,'O'],[14,10,'O'],[15,11,'O']])g.S(x,y,c);}
 g.outline();return g.rows();}
module.exports={make};
