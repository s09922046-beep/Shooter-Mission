// 9 王第 2 回小樣總表(11/10),輸出 art-src/boss9-gen/mock.png
// 1 核心複眼、2 子彈、3 狙擊預兆、4 橫向光束與生物砲管、5 高壓氣流孔與甲板流動、6 翻轉預告;遊戲像素放大顯示,綠/紅虛線=判定
// 配色只是暫定(艦殼暗灰銅、肉質灰白),定案配色到第 3 回預覽頁用切換開關挑
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{
 const hs=i=>{let h=(i|0)*374761393;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296;};
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
   const g={c,x,w,h,px:(X,Y,W,H,col)=>{x.fillStyle=col;x.fillRect(Math.round(X),Math.round(Y),W,H);},
     disc:(cx,cy,r,col)=>{x.fillStyle=col;for(let yy=Math.floor(cy-r);yy<=cy+r;yy++)for(let xx=Math.floor(cx-r);xx<=cx+r;xx++)if((xx+.5-cx)**2+(yy+.5-cy)**2<=r*r)x.fillRect(xx,yy,1,1);},
     ell:(cx,cy,rx,ry,col)=>{x.fillStyle=col;for(let yy=Math.floor(cy-ry);yy<=cy+ry;yy++)for(let xx=Math.floor(cx-rx);xx<=cx+rx;xx++)if(((xx+.5-cx)/rx)**2+((yy+.5-cy)/ry)**2<=1)x.fillRect(xx,yy,1,1);},
     line:(x0,y0,x1,y1,col,t,dsh)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy,i=0;x.fillStyle=col;t=t||1;
       for(;;){if(!dsh||(i%dsh[0])<dsh[1])x.fillRect(x0-(t>>1),y0-(t>>1),t,t);i++;if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}},
     dash:(X,Y,W,H,col)=>{x.fillStyle=col;for(let i=0;i<W;i+=3){x.fillRect(X+i,Y,Math.min(2,W-i),1);x.fillRect(X+i,Y+H-1,Math.min(2,W-i),1);}for(let i=0;i<H;i+=3){x.fillRect(X,Y+i,1,Math.min(2,H-i));x.fillRect(X+W-1,Y+i,1,Math.min(2,H-i));}}};
   return g;};
 const SP='#0a0e1a',SP2='#0e1424';
 const space=(g)=>{for(let y=0;y<g.h;y++)g.px(0,y,g.w,1,((y>>2)+(y&1))%5<2?SP2:SP);for(let i=0;i<g.w*g.h/180;i++)g.px(Math.floor(hs(i*7+g.w)*g.w),Math.floor(hs(i*13+g.h)*g.h),1,1,hs(i)<.3?'#8ab0e8':'#3a4a6a');};
 const HULL=['#14151a','#24252d','#383a44','#545664'],FL=['#3c3a34','#5e5b50','#848070','#aaa592'];
 const flesh=(g,X,Y,W,H)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=hs(Math.floor((x+X)/3)*91+Math.floor((y+Y)/3)*37);g.px(X+x,Y+y,1,1,FL[v<.25?0:v<.75?1:2]);}};
 const P=(g,x,y)=>{g.px(x,y,10,14,'#d8dce8');g.px(x+1,y+1,8,3,'#eef0f6');g.px(x,y+5,10,2,'#8e1c2c');};   // 主角佔位 10x14
 const SW=2460;const blocks=[];const add=(title,opts,sc)=>blocks.push({title,opts,sc});
 // ---------- 1 核心複眼(60x60,紅色只在眼) ----------
 const eye=(g,cx,cy,r,shut,look)=>{g.disc(cx,cy,r+1,'#1a0a0e');if(shut){g.px(cx-r,cy,r*2+1,1,'#5a0a14');return;}g.disc(cx,cy,r,'#8a1020');g.disc(cx,cy-r*.15,r*.8,'#d0243a');g.disc(cx,cy-r*.3,r*.45,'#ff5a5a');
   const pr=Math.max(1,r*.28);g.ell(cx+(look||0)*r*.3,cy,pr*.6,pr*1.6,'#22040a');g.px(cx-r*.45,cy-r*.55,Math.max(1,r*.25),Math.max(1,r*.25),'#fff0f0');};
 const coreTile=(k)=>{const fr=[];for(const st of [0,1]){const g=mk(76,76);g.px(0,0,76,76,HULL[1]);flesh(g,6,6,64,64);
     const E={A:[[38,36,12],[20,22,6],[56,22,6],[18,50,6],[58,50,6],[38,14,4],[38,60,4]],
              B:[[30,30,9],[50,24,7],[46,46,8],[22,50,6],[60,40,4],[16,20,4],[58,60,4],[34,60,3],[40,12,3],[66,22,3],[12,36,3],[26,40,3]],
              C:[[28,30,11],[50,30,11],[20,54,5],[38,54,5],[56,54,5],[38,14,4],[14,16,3],[62,16,3]]}[k];
     for(const [x,y,r] of E)eye(g,x,y,r,st===1&&r<8&&hs(x*3+y)<.5,st===1?0:-1);
     g.dash(8,8,60,60,'#ffa030');fr.push(g);}return fr;};
 add('1 核心複眼(60x60 橘虛線=核心判定;左:平時瞳孔看主角,右:受擊時一起眨眼(小眼半數閉合))',[['A 中央大眼加 6 顆環繞',coreTile('A')],['B 12 顆大小不一散布',coreTile('B')],['C 兩顆主眼加下排小眼(蜘蛛式)',coreTile('C')]],3);
 // ---------- 2 子彈(數量、速度、判定不變) ----------
 const bul=(fn)=>{const g=mk(28,28);space(g);fn(g);return g;};
 const sporeA=g=>{g.disc(14,14,4,'#3a1040');g.disc(14,14,3,'#c050c0');g.disc(13,13,2,'#f0a0f0');g.px(15,15,1,1,'#3a1040');g.px(12,15,1,1,'#3a1040');g.dash(11,11,6,6,'#3fff6a');};
 const sporeB=g=>{g.disc(14,14,3,'#c050c0');g.disc(13,13,1.5,'#f6c0f6');for(const [dx,dy] of [[0,-5],[0,5],[-5,0],[5,0],[-4,-4],[4,4],[-4,4],[4,-4]])g.px(14+dx*.8,14+dy*.8,1,1,'#e070e0');g.dash(11,11,6,6,'#3fff6a');};
 const acidA=g=>{g.disc(15,14,3,'#ff9a30');g.disc(14,13,1.5,'#ffe0a0');g.px(18,14,2,1,'#c86010');g.px(20,15,2,1,'#8a4010');g.px(22,15,1,1,'#5a2a08');g.dash(12,11,6,6,'#3fff6a');};
 const acidB=g=>{g.disc(14,14,3,'#ffa040');g.disc(14,14,2,'#ffc870');g.px(13,13,1,1,'#fff0c0');g.px(15,15,1,1,'#c86010');g.px(17,11,2,2,'#ff9a30');g.px(19,17,1,1,'#ff9a30');g.dash(11,11,6,6,'#3fff6a');};
 const spikeA=g=>{for(let i=0;i<12;i++){const t=i/11;g.px(3+i*1.6,14,2,i>8?1:2,i<3?'#6a1018':i<8?'#c02030':'#ff6a6a');}g.px(22,14,2,1,'#fff0f0');g.dash(10,10,8,8,'#3fff6a');};
 const spikeB=g=>{for(let i=0;i<10;i++)g.px(5+i*1.8,13.5,2,2,i<2?'#6a1018':'#d02838');g.px(23,14,2,1,'#ffd0d0');for(const i of [3,6])g.px(5+i*1.8,11.5,1,2,'#c02030'),g.px(5+i*1.8,15.5,1,2,'#c02030');g.dash(10,10,8,8,'#3fff6a');};
 add('2 子彈(綠虛線=判定;扇形與齊射 r=3、狙擊 r=4;顏色沿用原本的粉紫、橙、紅以區分招式)',[['扇形孢子 A 帶黑點囊',[bul(sporeA)]],['扇形孢子 B 帶觸鬚',[bul(sporeB)]],['齊射酸液 A 拖滴',[bul(acidA)]],['齊射酸液 B 冒泡',[bul(acidB)]],['狙擊骨刺 A 細長漸尖',[bul(spikeA)]],['狙擊骨刺 B 帶倒鉤',[bul(spikeB)]]],6);
 // ---------- 3 狙擊預兆:準星加瞄準線 ----------
 const snipe=(k,p)=>{const g=mk(150,70);space(g);g.px(0,58,150,12,'#2a3040');g.px(0,58,150,1,'#5a6478');const ex=140,ey=10,tx=30,ty=50;g.disc(ex,ey,4,'#1a0a0e');g.disc(ex,ey,3,p>.75?'#ff8080':'#d0243a');P(g,25,44);
   const r=Math.round(p>.75?5:8),bl=p>.75&&(p*40|0)%2;if(!bl){
   if(k==='A'){g.line(ex,ey,tx,ty,'rgba(255,90,90,.55)',1,[4,2]);for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){g.px(tx+sx*r-(sx>0?1:0),ty+sy*r-(sy>0?2:0),1,3,'#ff4a4a');g.px(tx+sx*r-(sx>0?2:0),ty+sy*r-(sy>0?1:0),3,1,'#ff4a4a');}g.px(tx,ty,1,1,'#ffd0d0');}
   else{g.line(ex,ey,tx,ty,`rgba(255,90,90,${.25+p*.5})`,1);for(let a=0;a<32;a++){const q=a/32*6.283;g.px(tx+Math.cos(q)*r,ty+Math.sin(q)*r,1,1,'#ff4a4a');}g.px(tx-r-3,ty,4,1,'#ff4a4a');g.px(tx+r,ty,4,1,'#ff4a4a');g.px(tx,ty-r-3,1,4,'#ff4a4a');g.px(tx,ty+r,1,4,'#ff4a4a');}}
   return g;};
 add('3 狙擊預兆(依序:鎖定 30%、最後 30 幀收縮、最後 30 幀閃爍的暗拍;右上紅點=發射眼)',[['A 四角括號準星加虛線瞄準線',[snipe('A',.3),snipe('A',.8),snipe('A',.81)]],['B 像素圓圈十字加實線(越近越亮)',[snipe('B',.3),snipe('B',.8),snipe('B',.81)]]],3);
 // ---------- 4 橫向光束(全寬 22 高)與右緣生物砲管 ----------
 const beam=(k,ph)=>{const g=mk(170,40);space(g);const y0=9,H=22;
   const tube=(L)=>{for(let i=0;i<L;i++){const r=5-i/L*1.5;g.px(170-i,20-r,1,r*2,i%5<2?FL[1]:FL[2]);g.px(170-i,20-r,1,1,FL[3]);}g.disc(170-L,20,5,FL[0]);g.disc(170-L,20,3.5,'#2a0a30');};
   if(ph===0){tube(22);g.line(0,20,148,20,'rgba(220,170,255,.6)');g.disc(148,20,3,'#e0a0ff');}
   else{for(let x=0;x<148;x++){const w=k==='A'?(Math.sin(x*.35+ph)*1.5+9):(((x+ph*6)%14)<7?10:8);for(let y=-11;y<11;y++){const a=Math.abs(y)/w;if(a>1)continue;g.px(x,20+y,1,1,a<.3?'#f6e0ff':a<.6?'#c070f0':'#6a2a9a');}
       if(k==='B'&&((x+ph*6)%14)===0)g.px(x,20-11,1,22,'#e8c0ff');}tube(22);g.disc(148,20,4,'#f6e0ff');}
   g.dash(0,y0,150,H,'#ff3030');return g;};
 add('4 橫向光束(紅虛線=判定 22 高;左:預警時砲管伸出、砲口蓄光加中線細線;右兩格:生效)',[['A 電漿帶邊緣波動',[beam('A',0),beam('A',1),beam('A',3)]],['B 脈衝環節一節節推進',[beam('B',0),beam('B',1),beam('B',2)]]],3);
 // ---------- 5 高壓氣流孔與甲板流動(實際會動,這裡用兩格示意) ----------
 const vent=(k,f)=>{const g=mk(170,80);space(g);const gy=56;g.px(0,gy,170,24,'#262a34');g.px(0,gy,170,1,'#6a7488');
   g.px(130,0,40,50,HULL[1]);g.px(130,0,2,50,HULL[3]);flesh(g,140,4,30,40);   // 母艦左緣佔位
   for(const vy of [12,30]){g.px(126,vy,6,8,HULL[2]);g.px(126,vy+1,2,6,'#0a0a0e');}   // 氣流孔
   for(let x=0;x<170;x+=12){const sx=(x-f*5+340)%170;g.px(sx,gy+4,6,1,'#1c2028');g.px(sx+2,gy+9,8,1,'#1c2028');}   // 甲板防滑條往左流
   if(k!=='C'){for(let i=0;i<14;i++){const yy=6+hs(i*5)*46,L=6+hs(i*9)*12,xx=(hs(i*3)*170-f*14+340)%170;if(xx>126)continue;g.px(xx,yy,L,1,k==='A'?'rgba(200,220,255,.35)':'rgba(200,220,255,.18)');}}
   if(k==='B'){for(let i=0;i<10;i++){const xx=(hs(i*11)*130-f*9+260)%130;g.px(xx,gy-1-hs(i)*3,2,1,'#7a8498');}}
   for(const vy of [12,30])for(let i=0;i<4;i++)g.px(120-i*3-(f%2)*2,vy+2+i%3,3,1,'rgba(220,235,255,.5)');
   P(g,50,gy-14);return g;};
 add('5 高壓氣流孔(右側母艦左緣兩個孔)與甲板流動(兩格示意移動;實際每幀往左推 0.84 像素)',[['A 孔口噴氣加全場淡氣流線加甲板條紋',[vent('A',0),vent('A',1)]],['B 孔口噴氣加貼地揚塵加甲板條紋',[vent('B',0),vent('B',1)]],['C 只有孔口噴氣加甲板條紋(問卷 10B 原意)',[vent('C',0),vent('C',1)]]],3);
 // ---------- 6 翻轉預告(新地形投影) ----------
 const flip=(k,p)=>{const g=mk(170,80);space(g);const gy=56;g.px(0,gy,170,24,'#262a34');g.px(0,gy,170,1,'#6a7488');g.px(30,gy,32,24,SP);g.px(30,36,60,4,'#4a5468');g.px(120,8,16,48,'rgba(0,0,0,0)');
   for(let y=8;y<56;y+=4)g.px(124,y,8,2,'#3a6a8a');
   const a=.25+p*.6,C=`rgba(191,232,255,${a})`;const out=(X,Y,W,H)=>{g.px(X,Y,W,1,C);g.px(X,Y+H-1,W,1,C);g.px(X,Y,1,H,C);g.px(X+W-1,Y,1,H,C);};
   if(k==='A'){out(100,gy,32,24);out(70,36,60,4);out(36,8,16,48);}
   else{for(let y=0;y<24;y+=2)g.px(100,gy+y,32,1,`rgba(191,232,255,${a*.5})`);out(100,gy,32,24);for(let y=0;y<4;y+=2)g.px(70,36+y,60,1,C);for(let y=8;y<56;y+=2)g.px(36,y,16,1,`rgba(191,232,255,${a*.45})`);}
   g.px(100,gy,32,1,`rgba(255,120,255,${a})`);return g;};
 add('6 翻轉預告(翻轉前 90 幀;依序 20%、60%、95%;藍白=翻轉後的新坑、新平台、新繩梯)',[['A 線框',[flip('A',.2),flip('A',.6),flip('A',.95)]],['B 線框加掃描線填色(同 1 王裝甲復原)',[flip('B',.2),flip('B',.6),flip('B',.95)]]],3);
 // ---------- 排版 ----------
 const PAD=16,LBL=26,TTL=34;let y=PAD;const place=[];
 for(const b of blocks){let x=PAD,rowH=0;const items=[],y0=y;
   for(const [lab,fr] of b.opts){const fw=fr.reduce((s,g)=>s+g.w*b.sc+6,0)-6,fh=fr[0].h*b.sc;const w=Math.max(fw,lab.length*15);if(x+w>SW-PAD){y+=rowH+LBL+16;x=PAD;rowH=0;}
     items.push({lab,fr,x,y:y+TTL,fw});x+=w+28;rowH=Math.max(rowH,fh);}
   place.push({b,items,y:y0});y+=TTL+rowH+LBL+20;}
 const SH=y+PAD;const o=document.createElement('canvas');o.width=SW;o.height=SH;const X=o.getContext('2d');X.imageSmoothingEnabled=false;X.fillStyle='#05070c';X.fillRect(0,0,SW,SH);
 for(const {b,items,y:by} of place){X.fillStyle='#ffd23a';X.font='bold 20px sans-serif';X.fillText(b.title,PAD,by+22);
   for(const it of items){X.fillStyle='#e8ecf4';X.font='15px sans-serif';X.fillText(it.lab,it.x,it.y+14);let fx=it.x;for(const g of it.fr){X.drawImage(g.c,fx,it.y+LBL,g.w*b.sc,g.h*b.sc);fx+=g.w*b.sc+6;}}}
 return o.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/mock.png',Buffer.from(d,'base64'));await br.close();})();
