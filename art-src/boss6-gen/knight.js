// 6 王騎士手繪精靈(11/12 第 3 回手修;參考 boss6-knight-main.webp 與 boss6-knight-poses.webp),輸出 knight-hand.png(6 姿勢圖集,面朝左)
// 圖集格式與舊版自動縮圖相同:各格底端對齊、間隔 1 像素;各格尺寸維持舊版(B6KR 不變),判定框 22×30 貼各格右緣(減 B6RX)與底緣。
// 做法:頭盔、肩甲、胸甲(爐心)、腰帶、裙甲、腿、後臂、拳頭為固定零件(文字像素格),各姿勢只改擺位,手臂與戟由程式依座標畫,
//   最後整體外側補外框。調色:O 外框、1~5 冷灰由暗到亮、6 亮點、a A 裂縫暗琥珀(只在裂縫)、R P 爐心(唯一紅色)。
// 用法:node knight.js [放大倍數];另輸出 knight-view.png(上排手繪疊判定框、下排舊版自動縮圖)
const fs=require('fs'),zlib=require('zlib');
const Z=+process.argv[2]||8;
const PAL={O:'#0a0808',1:'#2e2d33',2:'#46454b',3:'#605f65',4:'#828187',5:'#a9a8ac',6:'#d2d0cc',a:'#6e4410',A:'#a8721c',R:'#e61818',P:'#ff3c30'};
const SIZE=[[34,35],[24,34],[28,40],[37,30],[33,25],[26,33]],RX=[0,0,2,4,6,0];
// ---- 零件(面朝左;'.' 透明) ----
const PART={
 helm:[            // 平頂桶盔:左為正面,眼縫在正面
  'OOOOOOOO',
  'O655443O',
  'O544332O',
  'OOOOO32O',
  'O533322O',
  'O433O22O',
  'O433221O',
  'O332211O',
  'OOOOOOOO'],
 paul:[            // 單側大圓肩甲,左上受光,一道連續裂縫
  '...OOOOO...',
  '..O55443O..',
  '.O55443a3O.',
  'O554433a32O',
  'O54433a332O',
  'O44333A322O',
  'O433333a22O',
  'O33333a221O',
  '.O3322a21O.',
  '..O222211O.',
  '...OOOOO...'],
 torso:[           // 胸甲,破口內爐心(5 寬,唯一紅色)
  'OOOOOOOOOOO',
  'O444OOO332O',
  'O44ORRRO32O',
  'O4ORPPRRO2O',
  'O4ORPPRRO2O',
  'O4ORRRRRO2O',
  'O43ORRRO22O',
  'O43aOOO322O',
  'O333a33221O',
  'O33333a211O'],
 belt:[
  'OOOOOOOOOOOO',
  'O5444433322O',
  'OOOOOOOOOOOO'],
 tasset:[          // 破爛裙甲
  'O4333O33221O',
  'O333O.O3221O',
  '.O3O..O321O.',
  '..O....O2O..'],
 leg:[             // 站姿腿(腿甲、膝甲、鐵靴朝左)
  '..O4332O.',
  '..O4322O.',
  '.O54432O.',
  '.OO4322O.',
  '..O4322O.',
  '..O3321O.',
  '.O54332O.',
  'O5443321O',
  'OOOOOOOOO'],
 barm:[            // 後臂(垂在肩甲下方)與拳頭
  'O33321O',
  'O43a21O',
  'O4332O.',
  'O4322O.',
  'OO444OO',
  'O54432O',
  'O43321O',
  'O33211O',
  '.OOOOO.'],
 fist:[            // 握桿拳頭(縱握,戟桿從中間穿過)
  '.OOOO.',
  'O5443O',
  'O4O33O',
  'O4332O',
  '.OOOO.'],
 fistH:[           // 握桿拳頭(橫握)
  '.OOO.',
  'O544O',
  'O4O3O',
  'O433O',
  'O332O',
  '.OOO.'],
 boot:[            // 鐵靴(趾朝左)
  '.O443O.',
  'O54332O',
  'OOOOOOO'],
};
// ---- 畫布 ----
function frame(w,h){const g=[];for(let y=0;y<h;y++)g.push(new Array(w).fill('.'));return {w,h,g,
  set(x,y,c){if(x>=0&&y>=0&&x<w&&y<h)g[y][x]=c;},get(x,y){return x>=0&&y>=0&&x<w&&y<h?g[y][x]:'.';}};}
const DK={6:'5',5:'4',4:'3',3:'2',2:'1',1:'1',A:'a'};
function put(F,name,x0,y0,o={}){const P=PART[name];P.forEach((row,y)=>{for(let x=0;x<row.length;x++){let c=row[o.fl?row.length-1-x:x];if(c==='.')continue;if(o.dk&&DK[c])c=DK[c];F.set(x0+x,y0+y,c);}});}
// 粗線(手臂、腿):寬 r,沿線上緣亮、下緣暗,外側補外框
function limb(F,pts,r,o={}){const L=new Map();
  for(let i=0;i<pts.length-1;i++){const [x0,y0]=pts[i],[x1,y1]=pts[i+1],n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);
    for(let k=0;k<=n*2;k++){const t=k/(n*2),cx=x0+(x1-x0)*t,cy=y0+(y1-y0)*t;
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r+0.5)continue;const X=Math.round(cx+dx),Y=Math.round(cy+dy);const s=-dx*0.5-dy;   // s>0 偏左上
        const c=s>r*0.6?'4':s<-r*0.6?'2':'3';const q=Y*999+X;if(!L.has(q)||c>L.get(q)[2])L.set(q,[X,Y,c]);}}}
  if(o.dk)for(const v of L.values())v[2]=DK[v[2]];
  for(const [X,Y] of L.values())for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=(Y+dy)*999+X+dx;if(!L.has(q))F.set(X+dx,Y+dy,'O');}
  for(const [X,Y,c] of L.values())F.set(X,Y,c);}
// 戟桿:1 像素寬,兩側外框
function shaft(F,x0,y0,x1,y1){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0)),P=[];
  for(let k=0;k<=n;k++)P.push([Math.round(x0+(x1-x0)*k/n),Math.round(y0+(y1-y0)*k/n)]);
  const S=new Set(P.map(([x,y])=>y*999+x));
  for(const [x,y] of P)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!S.has((y+dy)*999+x+dx))F.set(x+dx,y+dy,'O');
  for(const [x,y] of P)F.set(x,y,'3');}
function outline(F){const q=F.g.map(r=>r.slice());for(let y=0;y<F.h;y++)for(let x=0;x<F.w;x++){if(q[y][x]!=='.')continue;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<F.w&&Y<F.h&&q[Y][X]!=='.'&&q[Y][X]!=='O'){F.g[y][x]='O';break;}}}}
// 戟:socket 為矛尖底座,(ux,uy) 指向矛尖,(vx,vy) 指向斧刃側,L 為桿長。在戟自己的座標(u 沿桿、v 垂直)逐像素判斷,任何角度外形一致
function halberd(F,sx,sy,ux,uy,vx,vy,L){const H=new Map();
  for(let y=-4;y<F.h+4;y++)for(let x=-4;x<F.w+4;x++){const dx=x+0.5-sx,dy=y+0.5-sy,u=dx*ux+dy*uy,v=dx*vx+dy*vy;let c=null;
    if(u>=-L&&u<0.5&&Math.abs(v)<=0.55)c='3';
    if(u>=0.5&&u<6.5){const hw=u<1.6?1.25:1.35*(6.5-u)/4.9;if(Math.abs(v)<=hw)c=v>0.1?'5':(u>5?'6':'4');}   // 矛尖
    const uc=-4.2,du=u-uc,vo=6.3-0.2*du*du;
    if(u>-9.8&&u<0.6&&v>0.5&&v<=vo&&!(v<3&&Math.abs(du)>2.4))c=v>vo-1.3?'5':v>3?'4':'3';   // 新月斧刃(兩端的角往桿彎)
    if(u>-2.2&&u<-0.6&&v<-0.5&&v>-2.2+(u+2.2)*0.6)c='2';   // 背刺
    if(c)H.set(y*999+x,[x,y,c]);}
  for(const [X,Y] of H.values())for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!H.has((Y+dy)*999+X+dx))F.set(X+dx,Y+dy,'O');
  for(const [X,Y,c] of H.values())F.set(X,Y,c);}
function line(F,x,y,s){for(let i=0;i<s.length;i++)if(s[i]!=='.')F.set(x+i,y,s[i]);}
// ---- 六個姿勢 ----
const POSE=[
 F=>{ // 0 待機:戟直立在身前,前臂從胸甲後方伸出握桿,右臂垂下
  put(F,'leg',23,26,{dk:1});put(F,'barm',27,19);put(F,'leg',14,26);
  limb(F,[[18,20],[9,19]],1.6);
  put(F,'tasset',15,23);put(F,'belt',15,21);put(F,'torso',15,12);put(F,'paul',23,10);put(F,'helm',17,5);
  halberd(F,6.5,6,0,-1,-1,0,28);put(F,'fist',4,17);},
 F=>{ // 1 走路:跨步(前腳往前、後腳往後)
  limb(F,[[14,25],[17,29],[19,31]],1.6,{dk:1});put(F,'boot',15,31,{dk:1});
  limb(F,[[8,25],[7,28],[6,31]],1.6);put(F,'boot',2,31);
  put(F,'barm',17,18);limb(F,[[8,20],[7,20]],1.5);
  put(F,'tasset',5,22);put(F,'belt',5,20);put(F,'torso',5,11);put(F,'paul',13,9);put(F,'helm',7,4);
  halberd(F,6.5,6,0,-1,-1,0,27);put(F,'fist',4,18);},
 F=>{ // 2 舉戟:雙手舉戟過頭、戟桿只壓過頭盔頂角,戟頭在右上(揮砍預警)
  put(F,'leg',15,31,{dk:1});put(F,'leg',4,31);put(F,'tasset',8,28);put(F,'belt',8,26);
  limb(F,[[16,18],[13,15],[11,13]],1.5,{dk:1});limb(F,[[10,19],[7,17],[6,16]],1.5);
  put(F,'torso',8,17);put(F,'paul',16,15);put(F,'helm',10,10);
  halberd(F,22,6,0.866,-0.5,-0.5,-0.866,21);put(F,'fistH',4,13);put(F,'fistH',9,10,{dk:1});},
 F=>{ // 3 橫持:戟平端在腰前、矛尖朝前(揮砍、橫掃生效)
  put(F,'leg',24,21,{dk:1});put(F,'leg',10,21);
  limb(F,[[18,12],[14,16]],1.6);limb(F,[[28,14],[28,16]],1.5,{dk:1});
  put(F,'tasset',15,19);put(F,'belt',15,17);put(F,'torso',15,7);put(F,'paul',22,5);put(F,'helm',17,0);
  halberd(F,6,16.5,-1,0,0,1,30);put(F,'fistH',12,14);put(F,'fistH',27,14,{dk:1});},
 F=>{ // 4 衝刺:前傾低姿勢,戟朝前平端
  limb(F,[[19,16],[24,19],[27,22]],1.6,{dk:1});put(F,'boot',25,22,{dk:1});
  limb(F,[[12,16],[8,18],[7,21]],1.7);put(F,'boot',3,22);
  limb(F,[[13,9],[10,12]],1.5);
  put(F,'tasset',10,15);put(F,'belt',10,13);put(F,'torso',10,4);put(F,'paul',17,2);put(F,'helm',5,1);
  halberd(F,4,12.5,-1,0,0,1,28);put(F,'fistH',8,10);put(F,'fistH',20,10,{dk:1});},
 F=>{ // 5 跪地:單膝跪地,戟插地撐著(先死者遺留、最後死亡)
  limb(F,[[17,26],[18,30],[23,31]],1.6,{dk:1});line(F,17,32,'OOOOOOOO');
  limb(F,[[12,26],[8,26],[8,30]],1.7);put(F,'boot',4,30);
  put(F,'barm',20,19);limb(F,[[12,18],[9,18]],1.5);
  put(F,'tasset',10,23);put(F,'belt',10,21);put(F,'torso',10,12);put(F,'paul',16,10);put(F,'helm',9,6);
  halberd(F,6.5,6,0,-1,-1,0,27);put(F,'fist',4,16);},
];
const FR=POSE.map((fn,i)=>{const F=frame(...SIZE[i]);fn(F);outline(F);return F;});
// ---- PNG ----
const crc=(()=>{const T=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;T[n]=c;}return b=>{let c=-1;for(const v of b)c=T[(c^v)&255]^(c>>>8);return (c^-1)>>>0;};})();
function png(w,h,rgba){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;rgba.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
  const ch=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
  const hd=Buffer.alloc(13);hd.writeUInt32BE(w,0);hd.writeUInt32BE(h,4);hd[8]=8;hd[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',hd),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]);}
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
// 圖集
const AW=FR.reduce((s,F)=>s+F.w+1,0),AH=Math.max(...FR.map(F=>F.h));const A=Buffer.alloc(AW*AH*4);let X=0;const R=[];
for(const F of FR){const oy=AH-F.h;for(let y=0;y<F.h;y++)for(let x=0;x<F.w;x++){const c=F.g[y][x];if(c==='.')continue;if(!PAL[c])throw '未知色 '+c;const q=((oy+y)*AW+X+x)*4,[r,g,b]=hex(PAL[c]);A[q]=r;A[q+1]=g;A[q+2]=b;A[q+3]=255;}R.push([X,F.w,F.h]);X+=F.w+1;}
if(process.env.TXT)console.log(FR[+process.env.TXT].g.map(r=>r.join('')).join(String.fromCharCode(10)));fs.writeFileSync(__dirname+'/knight-hand.png',png(AW,AH,A));
// 放大檢視:上排手繪(紅虛線 = 判定框),下排舊版
const old=fs.existsSync(__dirname+'/knight-old.json')?JSON.parse(fs.readFileSync(__dirname+'/knight-old.json')):null;
const VW=AW*Z+FR.length*Z*2,VH=(AH*2+6)*Z,V=Buffer.alloc(VW*VH*4);
for(let i=0;i<VW*VH;i++){V[i*4]=0x3a;V[i*4+1]=0x38;V[i*4+2]=0x46;V[i*4+3]=255;}
const dot=(x,y,rgb)=>{if(x<0||y<0||x>=VW||y>=VH)return;const q=(y*VW+x)*4;V[q]=rgb[0];V[q+1]=rgb[1];V[q+2]=rgb[2];};
const ONLY=process.env.ONLY?process.env.ONLY.split(',').map(Number):null;let VX=0;FR.forEach((F,i)=>{if(ONLY&&!ONLY.includes(i))return;const oy=AH-F.h;
  for(let y=0;y<F.h;y++)for(let x=0;x<F.w;x++){const c=F.g[y][x];if(c==='.')continue;const rgb=hex(PAL[c]);for(let a=0;a<Z;a++)for(let b=0;b<Z;b++)dot(VX+x*Z+a,(oy+y)*Z+b,rgb);}
  const hx=F.w-22-RX[i],hy=F.h-30;for(let k=0;k<22*Z;k+=3){dot(VX+hx*Z+k,(oy+hy)*Z,[255,64,64]);dot(VX+hx*Z+k,(oy+F.h)*Z-1,[255,64,64]);}for(let k=0;k<30*Z;k+=3){dot(VX+hx*Z,(oy+hy)*Z+k,[255,64,64]);dot(VX+(hx+22)*Z-1,(oy+hy)*Z+k,[255,64,64]);}
  if(old&&old[i]){const g=old[i];g.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=row[x];if(c==='.')continue;const rgb=hex(PAL[c]||'#ff00ff');for(let a=0;a<Z;a++)for(let b=0;b<Z;b++)dot(VX+x*Z+a,(AH+6+AH-g.length+y)*Z+b,rgb);}});}
  VX+=(F.w+2)*Z;});
fs.writeFileSync(__dirname+'/'+(process.argv[3]||'knight-view.png'),png(VW,VH,V));
console.log('knight-hand.png',AW+'x'+AH,'B6KR=',JSON.stringify(R));
