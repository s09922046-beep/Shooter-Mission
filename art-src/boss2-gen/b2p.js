// 2 王各姿勢(座標以待機圖為準;畫布 56x47,原點偏移 (10,3))
const {Grid}=require('./paint.js');
const src=require('fs').readFileSync(__dirname+'/b2b.js','utf8');
const BODY=eval(src.slice(src.indexOf('const BODY=')+11,src.indexOf('];')+1));
const U=BODY.slice(0,16),SK=BODY.slice(16,26),LG=BODY.slice(26);
const OX=10,OY=5,CW=56,CH=54;
function stamp(g,blk,X,Y){blk.forEach((r,j)=>{for(let i=0;i<r.length;i++)if(r[i]!=='.')g.S(X+i,Y+j,r[i]);});}
function feather(g,x0,y0,x1,y1,k){const dx=x1-x0,dy=y1-y0,n=Math.hypot(dx,dy),ux=dx/n,uy=dy/n,vx=-uy,vy=ux;
 const poly=(w0,w1,e)=>[[x0+vx*w0,y0+vy*w0],[x1+vx*w1+ux*e,y1+vy*w1+uy*e],[x1-vx*w1+ux*e,y1-vy*w1+uy*e],[x0-vx*w0,y0-vy*w0]];
 g.P(poly(2.6,2.0,1),'O');g.P(poly(1.7,1.1,0),'W');
 const xk=x0+dx*k,yk=y0+dy*k;g.P([[xk+vx*1.6,yk+vy*1.6],[x1+vx*1.1,y1+vy*1.1],[x1-vx*1.1,y1-vy*1.1],[xk-vx*1.6,yk-vy*1.6]],'K');}
function wing(g,dx,dy,da){const WR=[30+dx,8+dy],RT=[23+dx,19+dy],ang=[48,31,14,-3,-20].map(a=>a+da),len=[13,14,14,13,11];
 for(let i=ang.length-1;i>=0;i--){const t=i/(ang.length-1),bx=WR[0]+(RT[0]-WR[0])*t,by=WR[1]+(RT[1]-WR[1])*t,r=ang[i]*Math.PI/180;
  feather(g,bx,by,bx+Math.cos(r)*len[i],by-Math.sin(r)*len[i],0.72);}
 g.P([[RT[0]-4,RT[1]],[WR[0]-3,WR[1]-3],[WR[0]+1,WR[1]-3],[WR[0]+2,WR[1]],[RT[0]+3,RT[1]+1]],'O');
 g.P([[RT[0]-3,RT[1]-1],[WR[0]-2,WR[1]-2],[WR[0],WR[1]-2],[WR[0]+1,WR[1]],[RT[0]+2,RT[1]]],'W');
 for(let k=1;k<4;k++){const t=k/4;g.S(WR[0]+(RT[0]-WR[0])*t+1,WR[1]+(RT[1]-WR[1])*t+0.5,'G');}
 g.outline();}
function fin(g,dx,dy){g.P([[16,5],[17,2],[20,0],[25,0],[27,1],[27,3],[24,2],[22,3],[21,5]].map(p=>[p[0]+dx,p[1]+dy]),'A');
 g.L(18+dx,3+dy,20+dx,2+dy,'S');g.L(18+dx,4+dy,20+dx,4+dy,'S');g.S(26+dx,2+dy,'S');}
function chin(g,dx,dy){for(const [x,y,c] of [[15,9,'F'],[16,9,'F'],[15,10,'F'],[16,10,'F'],[16,11,'f'],[17,11,'D'],[14,9,'O'],[14,10,'O'],[15,11,'O']])g.S(x+dx,y+dy,c);}
function sword(g,hx,hy,ang,len){const r=ang*Math.PI/180,ux=Math.cos(r),uy=Math.sin(r),vx=-uy,vy=ux;   // (hx,hy) 護手位置,ang 0=朝右 180=朝左
 const tx=hx+ux*len,ty=hy+uy*len;
 const bl=(w,e)=>[[hx+vx*w,hy+vy*w],[tx+vx*(w-0.3)-ux*1.5,ty+vy*(w-0.3)-uy*1.5],[tx+ux*(0.5+e),ty+uy*(0.5+e)],[tx-vx*(w-0.3)-ux*1.5,ty-vy*(w-0.3)-uy*1.5],[hx-vx*w,hy-vy*w]];
 g.P(bl(2.1,1),'O');g.L(hx+vx*3.9,hy+vy*3.9,hx-vx*3.9,hy-vy*3.9,'O',1);
 g.P([[hx+vx*1.1,hy+vy*1.1],[tx+vx*0.8-ux*1.5,ty+vy*0.8-uy*1.5],[tx+ux*0.5,ty+uy*0.5],[tx-vx*0.8-ux*1.5,ty-vy*0.8-uy*1.5],[hx-vx*1.1,hy-vy*1.1]],'L');
 g.L(hx+ux*1.5+vx*0.5,hy+uy*1.5+vy*0.5,tx-ux*2+vx*0.5,ty-uy*2+vy*0.5,'T');
 g.L(hx+vx*3,hy+vy*3,hx-vx*3,hy-vy*3,'D');                 // 十字護手
 g.L(hx-ux*1,hy-uy*1,hx-ux*3,hy-uy*3,'M');}                 // 握柄
function arm(g,sh,el,ha){g.L(sh[0],sh[1],el[0],el[1],'D',2);g.L(el[0],el[1],ha[0],ha[1],'D',2);g.R(ha[0]-1,ha[1]-1,3,3,'S');g.S(ha[0]-1,ha[1]-1,'A');}
function leg(g,hip,kn,ft,c,c2,toe){g.L(hip[0],hip[1],kn[0],kn[1],c,3);g.L(kn[0],kn[1],ft[0],ft[1],c,3);g.S(kn[0],kn[1],'A');
 g.R(ft[0]+(toe<0?-2:0),ft[1]+2,5,2,c2);}
const LG2=[0,1,3,6,7,8,9,10].map(i=>LG[i]);
const P={ // u 為上半身畫布(下移 3 像素,讓頭盔進入判定框),g 為原座標(腿)
 idle(g,u){wing(u,0,0,0);sword(u,9,22,155,12);u.outline();stamp(u,U,8,5);stamp(u,SK,8,21);stamp(g,LG2,8,34);fin(u,0,0);chin(u,0,0);
  arm(u,[15,16],[12,19],[11,21]);},
 walk(g,u){wing(u,0,0,-3);sword(u,9,22,158,12);u.outline();
  leg(g,[20,34],[19,36],[19,37],'D','M',-1);leg(g,[15,34],[12,35],[13,36],'S','D',-1);g.outline();
  stamp(u,U,8,6);stamp(u,SK,8,22);fin(u,0,1);chin(u,0,1);arm(u,[15,17],[12,20],[11,22]);},
 windup(g,u){wing(u,0,0,6);u.outline();stamp(u,U,8,5);stamp(u,SK,8,21);stamp(g,LG2,8,34);fin(u,0,0);chin(u,0,0);
  arm(u,[16,16],[12,12],[13,7]);sword(u,13,5,-68,14);},
 slash(g,u){wing(u,1,1,-8);sword(u,7,24,178,15);u.outline();stamp(u,U,7,6);stamp(u,SK,8,21);stamp(g,LG2,8,34);fin(u,-1,1);chin(u,-1,1);
  arm(u,[14,17],[11,21],[8,24]);},
 thrust(g,u){wing(u,1,3,-14);sword(u,4,20,180,15);u.outline();
  leg(g,[13,34],[9,36],[6,37],'S','D',-1);leg(g,[21,34],[24,36],[27,37],'D','M',1);g.outline();
  stamp(u,U,5,6);stamp(u,SK,6,21);fin(u,-3,1);chin(u,-3,1);arm(u,[12,17],[8,19],[5,20]);},
 plunge(g,u){wing(u,0,-1,16);u.outline();
  leg(g,[14,34],[11,36],[15,37],'S','D',-1);leg(g,[20,34],[23,35],[26,36],'D','M',1);g.outline();
  stamp(u,U,8,5);stamp(u,SK,8,21);fin(u,0,0);chin(u,0,0);arm(u,[15,16],[11,19],[10,22]);sword(u,9,24,92,19);u.R(8,22,3,2,'S');u.S(8,22,'A');},
};
function pose(n){const g=Grid(CW,CH,OX,OY),u=Grid(CW,CH,OX,OY+3,g.g);P[n](g,u);g.outline();return g.rows();}
module.exports={pose,P,OX,OY,CW,CH};
