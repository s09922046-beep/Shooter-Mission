// 1 王第 2 回小樣總表(11/9),輸出 art-src/boss1-gen/mock.png
// 1 鐵鍊頂端、2 月亮位置、3 電流條、4 燃燒彈、5 裝甲復原線框;遊戲像素放大顯示,紅虛線=判定
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{
 const hs=i=>{let h=(i|0)*374761393;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296;};
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
   const g={c,x,w,h,px:(X,Y,W,H,col)=>{x.fillStyle=col;x.fillRect(Math.round(X),Math.round(Y),W,H);},
     disc:(cx,cy,r,col)=>{x.fillStyle=col;for(let yy=Math.floor(cy-r);yy<=cy+r;yy++)for(let xx=Math.floor(cx-r);xx<=cx+r;xx++)if((xx+.5-cx)**2+(yy+.5-cy)**2<=r*r)x.fillRect(xx,yy,1,1);},
     line:(x0,y0,x1,y1,col,t)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;x.fillStyle=col;t=t||1;
       for(;;){x.fillRect(x0-(t>>1),y0-(t>>1),t,t);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}},
     dash:(X,Y,W,H,col)=>{x.fillStyle=col;for(let i=0;i<W;i+=3){x.fillRect(X+i,Y,Math.min(2,W-i),1);x.fillRect(X+i,Y+H-1,Math.min(2,W-i),1);}for(let i=0;i<H;i+=3){x.fillRect(X,Y+i,1,Math.min(2,H-i));x.fillRect(X+W-1,Y+i,1,Math.min(2,H-i));}}};
   return g;};
 const SKY='#1a2436',SKY2='#222e44';
 const sky=(g)=>{for(let y=0;y<g.h;y++)g.px(0,y,g.w,1,((y>>2)+(y&1))%5<2?SKY2:SKY);};
 const deck=(g,gy)=>{g.px(0,gy,g.w,g.h-gy,'#2a3244');g.px(0,gy,g.w,1,'#6a7894');g.px(0,gy+1,g.w,1,'#4a5670');for(let x=8;x<g.w;x+=16)g.px(x,gy+2,1,g.h-gy-2,'#20283a');};
 // 主畫布
 const SW=2460;let SH=0;const blocks=[];
 const add=(title,opts,sc)=>{blocks.push({title,opts,sc});};
 // ---------- 1 鐵鍊頂端 ----------
 const chain=(g,cx,y0,y1)=>{for(let y=y0,i=0;y<y1;y+=6,i++){if(i&1){g.px(cx-1,y,2,7,'#8a94a8');g.px(cx,y,1,7,'#5a6478');}else{g.px(cx-2,y,4,1,'#8a94a8');g.px(cx-2,y+6,4,1,'#5a6478');g.px(cx-2,y,1,7,'#8a94a8');g.px(cx+1,y,1,7,'#5a6478');}}};
 const chainTile=(k)=>{const g=mk(40,120);sky(g);chain(g,20,48,120);
   if(k==='A'){g.px(18,0,1,30,'#3a4458');g.px(21,0,1,30,'#3a4458');g.px(15,28,10,6,'#5a6478');g.px(15,28,10,1,'#8a94a8');g.px(19,34,2,8,'#6a7488');   // 細鋼索、滑輪組、吊鉤
     g.px(17,41,1,5,'#8a94a8');g.px(17,46,6,1,'#8a94a8');g.px(22,43,1,4,'#5a6478');g.px(21,42,2,1,'#5a6478');}
   else{g.px(17,44,1,4,'#8a94a8');g.px(16,43,1,2,'#8a94a8');g.px(22,45,1,3,'#5a6478');g.px(23,44,1,2,'#5a6478');g.px(17,48,6,1,'#8a94a8');}   // 斷開的最上一節
   g.dash(12,48,16,72,'#3fff6a');return [g];};
 add('1 鐵鍊頂端(第 7、18 欄,鍊頂在 y=48;綠虛線=可攀範圍)',[['A 吊鉤:鍊頂掛在吊鉤上,滑輪組以兩條細鋼索往上出畫面(鋼索細暗,看得出抓不住)',chainTile('A')],['B 斷鍊:最上一節斷開翹起,上方什麼都沒有',chainTile('B')]],3);
 // ---------- 2 月亮位置(縮半的整張場地) ----------
 const moonTile=(k)=>{const g=mk(256,144);sky(g);
   g.x.fillStyle='#283650';g.x.beginPath();g.x.moveTo(12,104);g.x.lineTo(40,84);g.x.lineTo(70,86);g.x.lineTo(74,70);g.x.lineTo(80,70);g.x.lineTo(84,86);g.x.lineTo(140,90);g.x.lineTo(150,80);g.x.lineTo(162,92);g.x.lineTo(162,104);g.x.fill();   // 遠景巨艦剪影
   if(k==='A'){g.disc(55,26,13,'rgba(200,212,234,.10)');g.disc(55,26,9,'#c8d4ea');g.disc(52,23,3,'#e0e8f6');}
   if(k==='B'){g.disc(172,20,20,'rgba(200,212,234,.10)');g.disc(172,20,12,'rgba(200,212,234,.14)');g.disc(174,20,9,'#c8d4ea');}
   deck(g,104);g.px(96,72,32,2,'#6a7894');g.px(136,48,32,2,'#6a7894');g.px(58,24,1,80,'#5a6478');g.px(148,24,1,80,'#5a6478');
   g.px(170,13,86,56,'#3a465e');g.px(180,0,76,13,'#3a465e');g.px(196,0,10,4,'#2a3244');   // 艦體佔位(往上往右出畫面)
   if(k==='B'){g.px(170,13,1,56,'#8a9cc0');g.px(180,0,1,13,'#8a9cc0');g.px(170,13,10,1,'#8a9cc0');}   // 月光勾邊
   g.px(179,17,18,13,'#6e7f9e');g.px(179,33,18,13,'#6e7f9e');g.px(179,49,18,13,'#6e7f9e');g.px(205,28,20,20,'#2b3348');g.px(212,35,6,6,'#a02030');
   return [g];};
 add('2 月亮位置(整張場地縮半;右上灰塊=艦體佔位)',[['A 左上:月亮在開闊天空,不被艦體擋',moonTile('A')],['B 艦後:月亮半藏在艦體左緣後,艦體邊緣被月光勾亮',moonTile('B')],['C 不畫月亮:只留冷色天光',moonTile('C')]],1.5);
 // ---------- 3 電流條 ----------
 const beamTile=(k)=>{const fr=[];
   for(const [ph,p] of [['w',.3],['w',.85],['l',0],['l',1]]){const g=mk(128,44);sky(g);deck(g,32);
     g.px(96,0,4,24,'#4a5670');g.px(97,0,1,24,'#6a7894');g.px(95,24,6,3,'#5a6478');   // 接地電極(三案相同)
     if(ph==='w'){for(let x=8,i=0;x<128;x+=16,i++){const on=hs(i*7+(p*10|0))<p;g.px(x,32,1,1,on?'#bfefff':'#3a6a8a');
         if(p>.6&&on){g.px(x,30,1,2,'#5ad8ff');g.px(x+(i&1?1:-1),29,1,1,'#bfefff');}
         if(k==='C')g.px(x,33,1,10,`rgba(90,216,255,${p*.5})`);}
       if(k==='C')g.px(0,32,128,1,`rgba(90,216,255,${p*.6})`);g.dash(0,20,128,12,'#ffd23a');}
     else{const s=p*17|0;
       if(k==='A'){g.px(0,20,128,12,'rgba(90,216,255,.14)');let py=26;for(let x=0;x<128;x+=6){const ny=21+hs(x*3+s)*10;g.line(x,py,x+6,ny,'#5ad8ff',3);py=ny;}
         py=26;for(let x=0;x<128;x+=6){const ny=21+hs(x*3+s)*10;g.line(x,py,x+6,ny,'#f4fdff',1);py=ny;}}
       if(k==='B'){g.px(0,20,128,12,'rgba(90,216,255,.10)');for(const o of [0,1]){let py=23+o*6;for(let x=0;x<128;x+=4){const ny=20+hs(x*5+s+o*99)*11;g.line(x,py,x+4,ny,o?'#5ad8ff':'#f4fdff',1);py=ny;}}
         for(let i=0;i<8;i++)g.px(hs(i+s*11)*128,20+hs(i*3+s)*12,1,1,'#ffffff');}
       if(k==='C'){g.px(0,20,128,12,'rgba(90,216,255,.30)');g.px(0,31,128,1,'#bfefff');for(let i=0;i<14;i++){const x=hs(i*13+s)*128|0,hh=4+hs(i+s)*8|0;for(let y=0;y<hh;y++)g.px(x+(hs(y+i*7+s)<.5?0:1),31-y,1,1,y<hh-2?'#5ad8ff':'#f4fdff');}}
       if(p===1)g.dash(0,20,128,12,'#ff3030');}
     fr.push(g);}return fr;};
 add('3 電流條(地面上 12 像素高、全寬;依序:預警 30%、預警 85%、生效兩幀;黃虛線=預警範圍、紅虛線=扣血範圍)',[['A 單股粗電流鋸齒',beamTile('A')],['B 雙股細電流交錯加跳動火花',beamTile('B')],['C 地面整條發光加許多短電弧',beamTile('C')]],3);
 // ---------- 4 燃燒彈 ----------
 const shellTile=(k)=>{const fr=[];for(let f=0;f<4;f++){const g=mk(40,40);sky(g);const cx=18,cy=22,dx=.55,dy=-.83;   // 往左下飛,拖尾朝右上
     if(k==='A'){for(let i=3;i>=1;i--)g.disc(cx+dx*i*4+((f+i)&1)*.5,cy+dy*i*4,4-i,i===1?'#ff8a3c':'#c86a30');g.disc(cx,cy,5,'#ff8a3c');g.disc(cx-.5,cy+.5,3.5,'#ffc060');g.disc(cx-1,cy+1,2,'#fff4d0');}
     if(k==='B'){for(let i=0;i<16;i++){const t=i/16,w=Math.sin(t*7+f*1.6)*2.5*t;g.disc(cx+dx*(4+i)-dy*w,cy+dy*(4+i)+dx*w,2.6*(1-t)+.6,i<6?'#ff8a3c':i<11?'#e06a28':'#a04a20');}
       g.disc(cx,cy,4.5,'#ff8a3c');g.disc(cx-.5,cy+.5,3,'#ffc060');g.disc(cx-1,cy+1,1.5,'#fff4d0');}
     if(k==='C'){for(let i=1;i<=3;i++)g.disc(cx+dx*(i*3+2),cy+dy*(i*3+2),3.2-i*.7+((f+i)&1)*.4,i<2?'#ffc060':'#ff8a3c');
       g.disc(cx,cy,4.6,'#3a3a44');g.disc(cx+dx*1.4,cy+dy*1.4,3.2,'#55566a');g.disc(cx-dx*2.4,cy-dy*2.4,2.4,'#ffd080');g.disc(cx-dx*3,cy-dy*3,1.3,'#fff4d0');}
     if(f===3)g.dash(cx-5,cy-5,10,10,'#ff3030');fr.push(g);}return fr;};
 add('4 燃燒彈(由核心噴出、往左下飛;第 4 格紅虛線=判定 r=5)',[['A 熾白芯火球加短尾焰',shellTile('A')],['B 日珥火舌:火球拖一條彎曲擺動的長火舌',shellTile('B')],['C 帶殼砲彈:暗色彈殼前端燒紅白熱,加尾焰',shellTile('C')]],4);
 // ---------- 5 裝甲復原線框 ----------
 const plateTile=(k)=>{const fr=[];for(const p of [.25,.6,.95,-1,2]){const g=mk(52,94);g.px(0,0,52,94,'#2a3244');g.px(0,0,8,94,'#39445c');   // 艦首佔位
     for(const oy of [4,36,68]){const X=8,Y=oy,Wd=36,Hd=26;
       if(p===2){g.px(X,Y,Wd,Hd,'#6e7f9e');g.px(X+2,Y+2,Wd-4,6,'#96a9c9');g.px(X,Y+Hd-2,Wd,2,'#4b5975');continue;}
       g.px(X+4,Y+6,Wd-8,Hd-12,'#1a2030');   // 空的裝甲座
       if(p===-1){g.px(X,Y,Wd,Hd,'rgba(191,232,255,.75)');continue;}   // 最後 30 幀閃爍(亮的那一拍)
       if(k==='A'){const fy=Math.round(Hd*p);for(let y=0;y<fy;y+=2)g.px(X,Y+y,Wd,1,'rgba(191,232,255,.35)');g.px(X,Y+fy,Wd,1,'#e8f8ff');}
       if(k==='B'){const st=p<.4?8:p<.7?4:2;for(let x=st;x<Wd;x+=st)g.px(X+x,Y,1,Hd,`rgba(191,232,255,${.15+p*.3})`);for(let y=st;y<Hd;y+=st)g.px(X,Y+y,Wd,1,`rgba(191,232,255,${.15+p*.3})`);}
       if(k==='C'){for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++)if(hs(x*31+y*977+oy)<p)g.px(X+x,Y+y,1,1,'rgba(191,232,255,.55)');}
       g.px(X,Y,Wd,1,'#bfe8ff');g.px(X,Y+Hd-1,Wd,1,'#bfe8ff');g.px(X,Y,1,Hd,'#bfe8ff');g.px(X+Wd-1,Y,1,Hd,'#bfe8ff');}
     fr.push(g);}return fr;};
 add('5 裝甲復原預兆(最後 120 幀;依序:25%、60%、95%、最後 30 幀閃爍的亮拍、復原後實體)',[['A 掃描線由上往下填滿',plateTile('A')],['B 線框內網格由疏變密',plateTile('B')],['C 點陣逐點亮起',plateTile('C')]],3);
 // ---------- 排版 ----------
 const PAD=16,LBL=26,TTL=34;let y=PAD;const place=[];
 for(const b of blocks){let x=PAD,rowH=0;const items=[],y0=y;
   for(const [lab,fr] of b.opts){const fw=fr.reduce((s,g)=>s+g.w*b.sc+6,0)-6,fh=fr[0].h*b.sc;const w=Math.max(fw,lab.length*13);if(x+w>SW-PAD){y+=rowH+LBL+16;x=PAD;rowH=0;}
     items.push({lab,fr,x,y:y+TTL,fw});x+=w+28;rowH=Math.max(rowH,fh);}
   place.push({b,items,y:y0});y+=TTL+rowH+LBL+20;}
 SH=y+PAD;const o=document.createElement('canvas');o.width=SW;o.height=SH;const X=o.getContext('2d');X.imageSmoothingEnabled=false;X.fillStyle='#0c0f16';X.fillRect(0,0,SW,SH);
 for(const {b,items,y:by} of place){X.fillStyle='#ffd23a';X.font='bold 20px sans-serif';X.fillText(b.title,PAD,by+22);
   for(const it of items){X.fillStyle='#e8ecf4';X.font='15px sans-serif';X.fillText(it.lab,it.x,it.y+14);let fx=it.x;for(const g of it.fr){X.drawImage(g.c,fx,it.y+LBL,g.w*b.sc,g.h*b.sc);fx+=g.w*b.sc+6;}}}
 return o.toDataURL().split(',')[1];});
require('fs').writeFileSync(__dirname+'/mock.png',Buffer.from(d,'base64'));await br.close();})();
