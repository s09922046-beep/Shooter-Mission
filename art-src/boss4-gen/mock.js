// 4 王第 2 回小樣總表(11/11),輸出 art-src/boss4-gen/mock.png
// 1 眼窩魂火、2 脊椎骨鏈對照骨板橋、3 瘴氣浪與左緣預警、4 瘴氣炸開、5 骨矛落下、6 斷橋龜裂、7 閃瞬預兆
// 遊戲像素放大 3 倍顯示;紅虛線=扣血判定,黃虛線=預警範圍。配色暫定,定案配色到第 3 回預覽頁用切換開關挑
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{
 const hs=i=>{let h=(i|0)*374761393;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296;};
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
   const g={c,x,w,h,px:(X,Y,W,H,col)=>{x.fillStyle=col;x.fillRect(Math.round(X),Math.round(Y),W,H);},
     disc:(cx,cy,r,col)=>{x.fillStyle=col;for(let yy=Math.floor(cy-r);yy<=cy+r;yy++)for(let xx=Math.floor(cx-r);xx<=cx+r;xx++)if((xx+.5-cx)**2+(yy+.5-cy)**2<=r*r)x.fillRect(xx,yy,1,1);},
     ell:(cx,cy,rx,ry,col)=>{x.fillStyle=col;for(let yy=Math.floor(cy-ry);yy<=cy+ry;yy++)for(let xx=Math.floor(cx-rx);xx<=cx+rx;xx++)if(((xx+.5-cx)/rx)**2+((yy+.5-cy)/ry)**2<=1)x.fillRect(xx,yy,1,1);},
     line:(x0,y0,x1,y1,col,t)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;x.fillStyle=col;t=t||1;
       for(;;){x.fillRect(x0-(t>>1),y0-(t>>1),t,t);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}},
     dash:(X,Y,W,H,col)=>{x.fillStyle=col;for(let i=0;i<W;i+=3){x.fillRect(X+i,Y,Math.min(2,W-i),1);x.fillRect(X+i,Y+H-1,Math.min(2,W-i),1);}for(let i=0;i<H;i+=3){x.fillRect(X,Y+i,1,Math.min(2,H-i));x.fillRect(X+W-1,Y+i,1,Math.min(2,H-i));}}};
   return g;};
 const BG='#1c1814',BG2='#221d18';
 const bg=g=>{for(let y=0;y<g.h;y++)g.px(0,y,g.w,1,((y>>2)+(y&1))%5<2?BG2:BG);};
 const BN=['#3e3428','#7a6a52','#b4a284','#e2d6b8'];            // 骨:暗→亮
 const MI=['#3a4a1c','#6a8a2a','#9ac43a','#d4f070'];            // 瘴氣(攻擊,亮黃綠)
 const FR=['#5a0a10','#b81a1a','#ff3a2a','#ff9a7a','#fff0e0'];  // 魂火(只有核心用紅)
 const P=(g,x,y)=>{g.px(x,y,10,14,'#d8dce8');g.px(x+1,y+1,8,3,'#eef0f6');g.px(x,y+5,10,2,'#8e1c2c');};
 const ground=(g,gy)=>{g.px(0,gy,g.w,g.h-gy,'#3a3226');for(let x=0;x<g.w;x++)g.px(x,gy,1,1+(hs(x)<.3?1:0),'#5a4e3a');for(let i=0;i<g.w/10;i++)g.px(hs(i*3)*g.w,gy+4+hs(i*7)*10,3,1,BN[1]);};
 const bridge=(g,X,Y,W)=>{for(let i=0;i<W;i+=8){g.px(X+i,Y,7,4,BN[2]);g.px(X+i,Y,7,1,BN[3]);g.px(X+i,Y+3,7,1,BN[1]);g.px(X+i+7,Y,1,4,BN[0]);}};
 const blocks=[];const add=(title,opts)=>blocks.push({title,opts});
 // ---------- 1 眼窩魂火(頭骨示意 46x34,眼窩中心 14,10),4 格動畫 ----------
 const skull=(g,X,Y)=>{g.ell(X+26,Y+12,18,11,BN[2]);g.ell(X+14,Y+16,14,6,BN[2]);g.px(X+2,Y+18,30,3,BN[1]);g.ell(X+22,Y+27,16,4,BN[1]);
   for(let i=0;i<7;i++)g.px(X+5+i*4,Y+21,1,4,BN[3]);g.line(X+36,Y+4,X+46,Y-2,BN[2],2);g.line(X+40,Y+8,X+46,Y+4,BN[1],2);g.ell(X+14,Y+10,5,4,'#120c0a');};
 const fireA=(g,cx,cy,f)=>{const h=[6,8,5,9][f];g.ell(cx,cy,3,3,FR[1]);for(let i=0;i<h;i++){const w=Math.max(0,3-i*0.45)|0;g.px(cx-w+((i*f)&1),cy-i,w*2+1,1,i<h*0.5?FR[2]:FR[1]);}g.px(cx,cy-1,1,2,FR[4]);g.px(cx-1,cy,3,1,FR[3]);};
 const fireB=(g,cx,cy,f)=>{const s=[1,1.6,1.2,1][f];g.disc(cx,cy,3.5*s,FR[1]);g.disc(cx,cy,2.4*s,FR[2]);g.disc(cx,cy,1.2*s,FR[4]);if(f===1){g.x.globalAlpha=.4;g.disc(cx,cy,6,FR[2]);g.x.globalAlpha=1;}};
 const fireC=(g,cx,cy,f)=>{g.disc(cx,cy,3,FR[2]);g.px(cx,cy,1,1,FR[4]);for(let i=1;i<14;i++){const yy=cy-1+Math.round(Math.sin((i+f*2)/2.2)*1.5);g.px(cx+i,yy,1,Math.max(1,3-(i>>2)),i<5?FR[2]:i<10?FR[1]:FR[0]);}};
 add('1 眼窩魂火(核心;4 格動畫,約每 6 幀一格)',[['A 跳動火苗:火舌高低交替',fireA],['B 心跳脈動:每秒兩下鼓脹加光暈',fireB],['C 鬼火拖尾:火往後飄成尾巴',fireC]].map(([t,fn])=>({t,w:4*60,h:50,draw:g=>{bg(g);for(let f=0;f<4;f++){skull(g,f*60+8,10);fn(g,f*60+22,20,f);}}})));
 // ---------- 2 脊椎骨鏈(繩梯,16 寬)對照骨板橋 ----------
 const VC=['#2a1e16','#5a4434','#8a6e54','#b49a7a'];             // 骨鏈較暗、偏褐,與橋的灰白象牙拉開
 const chainA=(g,X,Y,H)=>{for(let y=0;y<H;y+=8){g.px(X+7,Y+y,2,8,'#4a2a20');g.ell(X+8,Y+y+4,5,3,VC[2]);g.px(X+3,Y+y+3,10,1,VC[3]);g.px(X+6,Y+y+6,4,1,VC[0]);g.px(X+1,Y+y+4,2,1,VC[1]);g.px(X+13,Y+y+4,2,1,VC[1]);}};
 const chainB=(g,X,Y,H)=>{for(let y=0;y<H;y+=8){g.ell(X+8,Y+y+3,3,3,VC[2]);g.px(X+7,Y+y+3,2,1,VC[0]);g.line(X+1,Y+y+6,X+15,Y+y+6,VC[3],1);g.px(X+1,Y+y+7,14,1,VC[1]);}};
 const chainC=(g,X,Y,H)=>{for(let y=0;y<H;y++)g.px(X+(y%6<3?7:8),Y+y,1,1,'#5a5a5e');for(let y=0;y<H;y+=12){g.ell(X+8,Y+y+5,5,4,VC[2]);g.px(X+4,Y+y+3,8,1,VC[3]);g.ell(X+8,Y+y+5,1.5,1.5,'#5a5a5e');}};
 add('2 脊椎骨鏈(繩梯 16 寬,判定=綠虛線)與骨板橋並排;骨鏈偏暗褐,與象牙色骨板橋區隔',[['A 椎骨以筋腱串連',chainA],['B 椎骨加骨橫檔(像梯子)',chainB],['C 鐵鍊穿過椎骨',chainC]].map(([t,fn])=>({t,w:120,h:110,draw:g=>{bg(g);ground(g,96);bridge(g,0,40,120);fn(g,52,8,88);g.dash(52,8,16,88,'#3fff6a');P(g,54,60);}})));
 // ---------- 3 瘴氣浪 64x24,左緣預警 ----------
 const waveA=(g,X,Y)=>{for(let i=0;i<10;i++)g.disc(X+4+i*6.5,Y+14-hs(i)*4,6+hs(i+9)*3,MI[1]);for(let i=0;i<8;i++)g.disc(X+8+i*7,Y+12-hs(i+3)*4,3.5,MI[2]);for(let i=0;i<5;i++)g.px(X+10+i*12,Y+6+hs(i)*6,2,2,MI[3]);g.px(X,Y+20,64,4,MI[0]);};
 const waveB=(g,X,Y)=>{for(let y=0;y<24;y++){const w=64-Math.abs(12-y)*1.2;g.px(X+(64-w),Y+y,w,1,y<6?MI[1]:y<18?MI[2]:MI[1]);}g.disc(X+30,Y+10,4,MI[0]);g.px(X+27,Y+9,2,2,MI[3]);g.px(X+32,Y+9,2,2,MI[3]);g.px(X+28,Y+13,4,1,MI[3]);g.disc(X+48,Y+12,3,MI[0]);};
 const waveC=(g,X,Y)=>{g.px(X,Y+10,52,14,MI[1]);g.px(X,Y+14,52,6,MI[2]);for(let a=0;a<16;a++){const t=a/16*Math.PI*1.4;g.disc(X+52+Math.cos(-t+1)*8,Y+12-Math.sin(-t+1)*8,2.5,a<8?MI[2]:MI[3]);}g.ell(X+56,Y+16,8,8,MI[1]);for(let i=0;i<6;i++)g.px(X+4+i*8,Y+12,4,1,MI[3]);};
 const warnL=(g,Y,v,f)=>{if(v===0){for(let i=0;i<3;i++){g.px(0,Y+4+i*7,2+f,4,MI[3]);g.line(2+f,Y+4+i*7,6+f,Y+6+i*7,MI[2],1);}g.px(0,Y,2,24,MI[1]);}else{for(let i=0;i<8;i++)g.disc(hs(i+f)*8,Y+3+i*3,1.5+hs(i*3)*2,i&1?MI[2]:MI[1]);}};
 add('3 瘴氣浪(判定 64×24 紅虛線,每幀往右 3.3);右欄=預警時畫面左緣的標記(判定還在畫面外)',[
   ...[['A 翻滾毒霧團',waveA],['B 霧帶浮出骷髏臉',waveB],['C 前緣捲起成浪頭',waveC]].map(([t,fn])=>({t,w:120,h:60,draw:g=>{bg(g);ground(g,48);fn(g,30,24);g.dash(30,24,64,24,'#ff4040');P(g,100,34);}})),
   {t:'預警甲:左緣箭頭閃爍 / 乙:牆縫滲出霧泡',w:120,h:60,draw:g=>{bg(g);ground(g,48);g.px(0,0,16,48,'#4a4036');warnL(g,24,0,1);g.dash(0,24,4,24,'#ffd23a');g.px(60,0,1,48,'#000');g.px(61,0,16,48,'#4a4036');g.x.save();g.x.translate(61,0);warnL(g,24,1,2);g.x.restore();g.dash(61,24,4,24,'#ffd23a');}}]);
 // ---------- 4 瘴氣炸開 87x45,生效 14 幀 ----------
 const burstA=(g,X,Y,f)=>{const k=[.4,1,.85,.5][f];for(let i=0;i<9;i++){const a=i/9*6.28,r=k*16;g.disc(X+43+Math.cos(a)*r*1.6,Y+22+Math.sin(a)*r*.8,(7+hs(i)*5)*k,f<3?MI[1]:MI[0]);}g.disc(X+43,Y+22,10*k,f<2?MI[3]:MI[2]);};
 const burstB=(g,X,Y,f)=>{const k=[.3,.7,1,1][f];g.x.globalAlpha=f===3?.5:1;g.ell(X+43,Y+22,43*k,22*k,MI[2]);g.ell(X+43,Y+22,43*k-4,22*k-3,BG);g.ell(X+43,Y+22,20*(1-k*.3),12*(1-k*.3),f<2?MI[3]:MI[1]);g.x.globalAlpha=1;};
 const burstC=(g,X,Y,f)=>{g.ell(X+43,Y+40,10,4,MI[1]);for(let i=0;i<22;i++){const a=-Math.PI*hs(i),s=(f+1)*(6+hs(i+5)*10);g.disc(X+43+Math.cos(a)*s*1.3,Y+40+Math.sin(a)*s*.9,1.5+hs(i)*1.5,i&1?MI[3]:MI[2]);}};
 add('4 瘴氣炸開(判定 87×45,只生效 14 幀;4 格=生效期的變化)',[['A 毒霧團瞬間膨脹',burstA],['B 環形衝擊波',burstB],['C 孢子由下往上噴',burstC]].map(([t,fn])=>({t,w:4*96,h:56,draw:g=>{bg(g);for(let f=0;f<4;f++){fn(g,f*96+4,5,f);g.dash(f*96+4,5,87,45,'#ff4040');}}})));
 // ---------- 5 骨矛落下(判定 16 寬,畫面頂到地面,整條同時生效 20 幀) ----------
 const spearA=(g,X,top,bot)=>{g.px(X+5,top,6,bot-top,BN[2]);g.px(X+5,top,2,bot-top,BN[3]);g.px(X+10,top,1,bot-top,BN[0]);for(let y=top;y<bot-10;y+=14){g.px(X+3,y,10,3,BN[2]);g.px(X+3,y,10,1,BN[3]);}g.px(X+6,bot-10,4,6,BN[3]);g.px(X+7,bot-4,2,4,BN[3]);};
 const spearB=(g,X,top,bot)=>{for(let y=top;y<bot;y+=12){g.ell(X+8,y+6,7,5,BN[2]);g.px(X+3,y+4,10,1,BN[3]);g.px(X+7,y+11,2,1,BN[0]);}g.line(X+8,bot-12,X+8,bot,BN[3],3);};
 const spearC=(g,X,top,bot)=>{g.px(X+2,top,12,bot-top-16,BN[1]);g.px(X+3,top,4,bot-top-16,BN[2]);for(let i=0;i<3;i++){g.line(X+2+i*5,bot-16,X+4+i*4,bot,BN[3],2);}g.px(X+1,top,14,2,BN[0]);};
 const impact=(g,X,gy,f)=>{if(f<2)return;for(let i=0;i<8;i++)g.px(X+8+(i-4)*(f*1.5),gy-1-hs(i+f)*f*3,2,2,BN[i&1?2:3]);g.px(X-4,gy-2,24,2,BN[1]);};
 add('5 骨矛落下(判定 16 寬紅虛線,整條同時生效 20 幀;4 格=生效第 0、1、2、6 幀,穿過斷橋插進地面)',[['A 巨大長骨矛(有節)',spearA],['B 一串椎骨像雨柱',spearB],['C 巨爪指骨插下',spearC]].map(([t,fn])=>({t,w:4*44,h:120,draw:g=>{bg(g);ground(g,104);for(let f=0;f<4;f++){const X=f*44+14,fr=[0,1,2,6][f];bridge(g,f*44,50,40);const bot=fr===0?40:fr===1?80:104;fn(g,X,0,bot);if(fr>=1)g.px(X-2,50,20,4,BG);impact(g,X,104,fr);g.dash(X,0,16,104,'#ff4040');}}})));
 // ---------- 6 斷橋龜裂 40 幀 ----------
 const crackA=(g,X,Y,f)=>{bridge(g,X,Y,112);const n=[2,5,9,14][f];for(let i=0;i<n;i++){const cx=X+4+hs(i*5)*104;g.line(cx,Y,cx+(hs(i)-.5)*6,Y+3,'#120c0a',1);}for(let i=0;i<f*3;i++)g.px(X+hs(i*11)*112,Y+5+((f*7+i*5)%20),1,2,BN[1]);};
 const crackB=(g,X,Y,f)=>{for(let i=0;i<112;i+=8){const k=Math.floor(i/8),dy=f===0?0:Math.round(hs(k+f*13)*f*1.2)*(k%3===0?1:0),sh=(f>=2&&(k+f)%2)?1:0;g.px(X+i+sh,Y+dy,7,4,BN[2]);g.px(X+i+sh,Y+dy,7,1,BN[3]);g.px(X+i+sh,Y+dy+3,7,1,BN[1]);}};
 add('6 上層斷橋崩毀預警(40 幀,期間照常可站;4 格=第 0、13、26、39 幀)',[['A 裂縫蔓延加碎屑掉落',crackA],['B 骨板逐片下沉、抖動',crackB]].map(([t,fn])=>({t,w:4*120,h:40,draw:g=>{bg(g);for(let f=0;f<4;f++){fn(g,f*120+4,14,f);}}})));
 // ---------- 7 骨影閃瞬:隱身最後 60 幀,目標位置的預兆 ----------
 const preA=(g,X,Y,f)=>{const k=(f+1)/4;for(let i=0;i<14;i++){const a=i/14*6.28+f*.6,r=30*(1-k)+6;g.px(X+23+Math.cos(a)*r,Y+17+Math.sin(a)*r*.7,2,1,BN[2+(i&1)]);}g.x.globalAlpha=k;g.disc(X+14,Y+10,1.5+k*1.5,FR[2]);g.disc(X+14,Y+10,1,FR[4]);g.x.globalAlpha=1;};
 const preB=(g,X,Y,f)=>{const k=(f+1)/4;g.x.globalAlpha=.25+.5*k;g.ell(X+23,Y+17,24*k+4,14*k+3,'#000000');g.x.globalAlpha=1;g.x.globalAlpha=k;g.disc(X+14,Y+10,1.5+k*1.5,FR[2]);g.x.globalAlpha=1;};
 add('7 骨影閃瞬預兆(現身前 60 幀,目標位置;黃虛線=現身後蛇頭判定 46×34;4 格=倒數 60、40、20、1 幀)',[['A 魂火浮現加骨片螺旋聚集',preA],['B 魂火浮現加黑影擴大',preB]].map(([t,fn])=>({t,w:4*70,h:50,draw:g=>{bg(g);for(let f=0;f<4;f++){fn(g,f*70+12,8,f);g.dash(f*70+12,8,46,34,'#ffd23a');}}})));
 // ---------- 拼版 ----------
 const S=3,PAD=14,TH=26,LH=20,SW=1800;let H=PAD;const lay=[];
 for(const b of blocks){let rowH=0,xx=PAD;const it=[];for(const o of b.opts){const w=o.w*S;if(xx+w>SW-PAD){H+=rowH+LH+6;xx=PAD;rowH=0;}it.push({o,x:xx,y:0});xx+=w+PAD;rowH=Math.max(rowH,o.h*S);}lay.push({b,top:H,it,rowH});H+=TH+rowH+LH+18;}
 // 重新計算(每塊一列內換行時位置)
 const out=document.createElement('canvas');out.width=SW;out.height=8000;const X=out.getContext('2d');X.fillStyle='#0c0a08';X.fillRect(0,0,SW,8000);X.imageSmoothingEnabled=false;
 let y=PAD;for(const b of blocks){X.fillStyle='#fff';X.font='bold 18px sans-serif';X.fillText(b.title,PAD,y+18);y+=TH;let xx=PAD,rowH=0;
   for(const o of b.opts){const w=o.w*S;if(xx+w>SW-PAD){y+=rowH+LH+6;xx=PAD;rowH=0;}const g=mk(o.w,o.h);o.draw(g);X.drawImage(g.c,0,0,o.w,o.h,xx,y,w,o.h*S);
     X.fillStyle='#ffd88a';X.font='15px sans-serif';X.fillText(o.t,xx,y+o.h*S+16);xx+=w+PAD;rowH=Math.max(rowH,o.h*S);}
   y+=rowH+LH+18;}
 const fin=document.createElement('canvas');fin.width=SW;fin.height=y;fin.getContext('2d').drawImage(out,0,0);
 return fin.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/mock.png',Buffer.from(d,'base64'));await br.close();})();
