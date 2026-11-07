// 5 王小樣總表(11/7 第 2 回):場景 A/B、環狀掃描與防護罩 A/B、無限大砲 A/B、衝撞預兆框與力場殼 A/B
// 魔王本體為暫代六角形(正式精靈等 GPT 概念圖);主角為 10x14 暫代剪影。綠虛線=判定邊界(主角中心在線內才安全)
// 用法:node mock.js [輸出檔]
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const outp=process.argv[2]||__dirname+'/mock.png';
const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{
 const W=512,H=288,TS=16;
 const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');return [c,x];};
 const h=(a,b)=>{let n=(a*374761393+b*668265263)|0;n=(n^(n>>13))*1274126177|0;return ((n^(n>>16))>>>0)/4294967296;};
 const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
 const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
 const PLATS=[{x:2,y:12,w:5},{x:7,y:11,w:3},{x:10,y:9,w:5},{x:18,y:12,w:5},{x:25,y:7,w:5},{x:13,y:13,w:7}];
 const BAY=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
 // ---------- 場景 ----------
 function scene(x,v,alarm){
  // 牆:合金磚 32x16 整齊排列,每塊上亮下暗斜角
  const base=alarm?'#2a2420':'#1c2433',hi=alarm?'#3c3228':'#2a3548',lo=alarm?'#16120f':'#121822',seam=alarm?'#0c0a08':'#0a0e15';
  x.fillStyle=base;x.fillRect(0,0,W,H);
  for(let by=0;by<12;by++)for(let bx=0;bx<16;bx++){const X=bx*32+(v==='B'?0:(by%2)*16),Y=by*16;
   x.fillStyle=seam;x.fillRect(X,Y,32,1);x.fillRect(X,Y,1,16);
   x.fillStyle=hi;x.fillRect(X+1,Y+1,31,1);x.fillRect(X+1,Y+1,1,14);
   x.fillStyle=lo;x.fillRect(X+1,Y+15,31,1);
   if(h(bx,by)<0.12){x.fillStyle=lo;x.fillRect(X+10,Y+6,12,4);}}                    // 少數磚上的散熱槽
  if(v==='B'){for(const cx of[72,200,312,440]){x.fillStyle=seam;x.fillRect(cx-9,0,18,192);x.fillStyle='#0f1520';x.fillRect(cx-8,0,16,192);}} // B:嵌入式柱槽
  // 流動光帶
  const lc=alarm?'#ffb03a':'#5ff0ff';
  if(v==='A'){for(const ly of[40,104,168]){x.fillStyle=seam;x.fillRect(0,ly-1,W,4);
    for(let i=0;i<W;i++){const t=((i+ly*3)%96)/96;const k=t<0.25?t/0.25:Math.max(0,1-(t-0.25)/0.35);
     if(k>0.05){x.fillStyle=mix('#0f1520',lc,0.25+0.75*k);x.fillRect(i,ly,1,2);}}}}
  else{for(const cx of[72,200,312,440])for(let yy=0;yy<192;yy++){const t=((yy+cx)%80)/80,k=t<0.2?t/0.2:Math.max(0,1-(t-0.2)/0.4);
    if(k>0.05){x.fillStyle=mix('#0f1520',lc,0.25+0.75*k);x.fillRect(cx-1,yy,2,1);}}}
  // 深井:第 12 列以下漸暗到全黑(抖色),兩側管線往深處縮
  for(let yy=176;yy<H;yy++){const k=Math.min(1,(yy-176)/100);
   for(let xx=0;xx<W;xx++){const th=BAY[yy&3][xx&3]/16;if(k>th){x.fillStyle=k>0.8?'#000':'#05070b';x.fillRect(xx,yy,1,1);}}}
  for(const px_ of[40,120,392,472]){for(let yy=180;yy<H;yy++){const s=1-(yy-180)/140;if(s<=0)break;x.fillStyle=mix('#000000',alarm?'#3a2a18':'#22304a',s*0.8);x.fillRect(px_,yy,Math.max(1,Math.round(6*s)),1);}}
  for(let i=0;i<5;i++){const lx=60+i*96,ly=230+(i%2)*22;x.fillStyle=alarm?'#ff8a2a':'#3aa0c0';x.fillRect(lx,ly,1,1);}   // 井底遠方指示燈
  // 側牆
  x.fillStyle='#10151e';x.fillRect(0,0,16,H);x.fillRect(496,0,16,H);x.fillStyle='#2a3548';x.fillRect(15,0,1,H);x.fillRect(496,0,1,H);
 }
 function plats(x,extra){
  for(const p of PLATS.concat(extra?[extra]:[])){const X=p.x*TS,Y=p.y*TS,w=p.w*TS,am=p===extra;
   x.fillStyle='#0c1018';x.fillRect(X,Y,w,6);
   x.fillStyle=am?'#c9c2b0':'#aeb8c8';x.fillRect(X+1,Y,w-2,2);x.fillStyle=am?'#7a7262':'#5e6a80';x.fillRect(X+1,Y+2,w-2,3);
   if(am){for(let i=0;i<w-2;i+=6){x.fillStyle='#ffb03a';x.fillRect(X+1+i,Y+3,3,1);}}                 // 大砲留下的板:琥珀燈條
   else{x.fillStyle='#5ff0ff';x.fillRect(X+4,Y+3,2,1);x.fillRect(X+w-6,Y+3,2,1);}
   for(const tx of[X+8,X+w-11]){x.fillStyle='#2a3040';x.fillRect(tx,Y+6,4,2);                           // 底部推進器與推進光
    x.fillStyle=am?'#ffb03a':'#5ff0ff';x.fillRect(tx+1,Y+8,2,2);x.fillStyle=am?'#6a4a20':'#1f5a6a';x.fillRect(tx+1,Y+10,2,2);}}
 }
 function boss(x,cx,cy,lens,shell){   // 暫代六角形本體(判定框 76x60,中心 cx,cy)
  const pts=[[-34,0],[-17,-26],[17,-26],[34,0],[17,26],[-17,26]];
  x.fillStyle='#0c1018';x.beginPath();pts.forEach((p,i)=>i?x.lineTo(cx+p[0],cy+p[1]):x.moveTo(cx+p[0],cy+p[1]));x.fill();
  x.fillStyle='#c8ccd2';x.beginPath();pts.forEach((p,i)=>{const q=[p[0]*0.92,p[1]*0.9];i?x.lineTo(cx+q[0],cy+q[1]):x.moveTo(cx+q[0],cy+q[1]);});x.fill();
  for(let i=0;i<6;i++){const a=i/6*6.283+0.52,hx=Math.round(cx+Math.cos(a)*18),hy=Math.round(cy+Math.sin(a)*15);x.fillStyle='#6a7280';x.fillRect(hx-4,hy-3,8,6);x.fillStyle='#3a4050';x.fillRect(hx-3,hy-2,6,4);}
  x.fillStyle='#2a3040';x.fillRect(cx-8,cy-8,16,16);x.fillStyle=lens||'#b0182a';x.fillRect(cx-5,cy-5,10,10);x.fillStyle='#fff';x.fillRect(cx-3,cy-3,2,2);
  x.fillStyle='#6a7280';x.fillRect(cx-36,cy+14,6,8);x.fillRect(cx+30,cy+14,6,8);
  if(shell==='A'){x.fillStyle='rgba(95,240,255,.22)';x.fillRect(cx-38,cy-30,76,1);x.fillRect(cx-38,cy+29,76,1);x.fillRect(cx-38,cy-30,1,60);x.fillRect(cx+37,cy-30,1,60);
   for(const [a,b] of[[-38,-30],[34,-30],[-38,26],[34,26]]){x.fillStyle='rgba(95,240,255,.55)';x.fillRect(cx+a,cy+b+(b<0?0:3),4,1);x.fillRect(cx+a+(a<0?0:3),cy+b,1,4);}}
  if(shell==='B'){for(let yy=-30;yy<30;yy++)for(let xx=-38;xx<38;xx++){const edge=Math.min(xx+38,37-xx,yy+30,29-yy);
    const hexline=((xx+38+((Math.floor((yy+30)/6)%2)*4))%8===0)||((yy+30)%6===0);if(edge<5&&hexline&&!(Math.abs(xx)<34&&Math.abs(yy)<26)){x.fillStyle='rgba(95,240,255,.30)';x.fillRect(cx+xx,cy+yy,1,1);}}}
 }
 function hero(x,X,Y){x.fillStyle='#0a0a0a';x.fillRect(X,Y,10,14);x.fillStyle='#e8eef4';x.fillRect(X+2,Y+1,6,4);x.fillStyle='#2a2a30';x.fillRect(X+1,Y+5,8,7);x.fillStyle='#8e1c2c';x.fillRect(X+1,Y+5,3,2);}
 function ring(x,cx,cy,R,col,core,style,domes){   // 逐像素畫環:|d-R|<=11 為光暈範圍(=判定帶 22),中央亮芯;防護罩內不畫
  const id=x.getImageData(0,0,W,H),D=id.data,C=hex(col),K=hex(core);
  for(let yy=Math.max(0,cy-R-12);yy<Math.min(H,cy+R+12);yy++)for(let xx=0;xx<W;xx++){const dd=Math.hypot(xx-cx,yy-cy)-R,a=Math.abs(dd);if(a>11)continue;
   if(domes.some(q=>Math.hypot(xx-q.cx,yy-q.cy)<=q.r&&yy<=q.cy))continue;
   let c,al;
   if(a<=1.5){c=[255,255,255];al=1;}else if(a<=4){c=K;al=1;}
   else{const t=(a-4)/7;c=C;al=style==='B'?(((Math.floor(Math.atan2(yy-cy,xx-cx)*R/6)&1)?0.75:0.35)*(1-t*0.6)):0.62*(1-t)+0.18;
    if(a>10)al=Math.max(al,0.5);}                                                // 最外 1 像素加一道淡邊線,讓光暈邊緣=判定邊緣可讀
   const i=(yy*W+xx)*4;D[i]=D[i]*(1-al)+c[0]*al;D[i+1]=D[i+1]*(1-al)+c[1]*al;D[i+2]=D[i+2]*(1-al)+c[2]*al;}
  x.putImageData(id,0,0);}
 function dome(x,q,col,style){const id=x.getImageData(0,0,W,H),D=id.data,C=hex(col);
  for(let yy=q.cy-q.r-1;yy<=q.cy;yy++)for(let xx=q.cx-q.r-1;xx<=q.cx+q.r+1;xx++){const dd=Math.hypot(xx-q.cx,yy-q.cy);if(dd>q.r+0.5)continue;
   let al=0.14;if(dd>q.r-1.5)al=0.9;else if(style==='B'){const r6=(yy-q.cy+60)%6===0,c6=(xx-q.cx+60+(Math.floor((yy-q.cy+60)/6)%2)*3)%6===0;if(r6||c6)al=0.34;}
   else if(dd>q.r-4)al=0.3;
   const i=(yy*W+xx)*4;D[i]=D[i]*(1-al)+C[0]*al;D[i+1]=D[i+1]*(1-al)+C[1]*al;D[i+2]=D[i+2]*(1-al)+C[2]*al;}
  x.putImageData(id,0,0);}
 function judge(x,q){x.fillStyle='#3fff6a';for(let a=0;a<=Math.PI;a+=0.05){if(Math.floor(a/0.1)%2)continue;x.fillRect(Math.round(q.cx-Math.cos(a)*q.r),Math.round(q.cy-Math.sin(a)*q.r),1,1);}}
 const dq=p=>({cx:(p.x+p.w/2)*TS,cy:p.y*TS,r:p.w*TS/2});
 const panels=[];const add=(lab,f,crop)=>{const [c,x]=mk();f(x);panels.push({c,lab,crop});};
 const BX=248,BY=64;
 add('場景 A:錯位合金磚、三條水平流動光帶、下方深井',x=>{scene(x,'A');plats(x);boss(x,BX,BY,null,'A');hero(x,64,178);});
 add('場景 B:對齊合金磚、四道嵌入柱槽直向光流',x=>{scene(x,'B');plats(x);boss(x,BX,BY,null,'A');hero(x,64,178);});
 const sp=[PLATS[0],PLATS[2],PLATS[3]].map(dq);
 add('掃描 A:紅雷射環(白芯,光暈外緣=判定)、平滑藍罩',x=>{scene(x,'A');plats(x);boss(x,BX,BY,'#ff6a6a','A');for(const q of sp)dome(x,q,'#8fe0ff','A');ring(x,BX,BY,150,'#ff2a3a','#ff8a8a','A',sp);for(const q of sp)judge(x,q);hero(x,64,178);hero(x,92,178);},[0,40,320,180]);
 add('掃描 B:同上但光暈分段(仍連續有判定)、六角格罩',x=>{scene(x,'A');plats(x);boss(x,BX,BY,'#ff6a6a','A');for(const q of sp)dome(x,q,'#8fe0ff','B');ring(x,BX,BY,150,'#ff2a3a','#ff8a8a','B',sp);for(const q of sp)judge(x,q);hero(x,64,178);hero(x,92,178);},[0,40,320,180]);
 const ex={x:3,y:9,w:5},eq=dq(ex);
 add('大砲 A:琥珀能量波、琥珀罩、全場警報色、琥珀燈條新平台',x=>{scene(x,'A',1);plats(x,ex);boss(x,BX,BY,'#ffd890','A');dome(x,eq,'#ffc060','A');ring(x,BX,BY,120,'#ff9a20','#ffe0a0','A',[eq]);judge(x,eq);hero(x,eq.cx-5,eq.cy-14);},[0,20,320,180]);
 add('大砲 B:同 A 但波面分段、六角格罩',x=>{scene(x,'A',1);plats(x,ex);boss(x,BX,BY,'#ffd890','A');dome(x,eq,'#ffc060','B');ring(x,BX,BY,120,'#ff9a20','#ffe0a0','B',[eq]);judge(x,eq);hero(x,eq.cx-5,eq.cy-14);},[0,20,320,180]);
 const box=(x,X,Y,st)=>{const c='#ff5a2a';
  if(st==='A'){for(let yy=0;yy<60;yy++)for(let xx=0;xx<76;xx++)if((xx+yy)%6===0){x.fillStyle='rgba(255,90,42,.30)';x.fillRect(X+xx,Y+yy,1,1);}
   x.fillStyle=c;for(const [a,b] of[[0,0],[68,0],[0,59],[68,59]])x.fillRect(X+a,Y+b,8,1);for(const [a,b] of[[0,0],[75,0],[0,52],[75,52]])x.fillRect(X+a,Y+b,1,8);}
  else{x.fillStyle='rgba(255,90,42,.16)';x.fillRect(X,Y,76,60);x.fillStyle=c;x.fillRect(X,Y,76,1);x.fillRect(X,Y+59,76,1);x.fillRect(X,Y,1,60);x.fillRect(X+75,Y,1,60);
   x.fillStyle='#ffd0b0';for(const [a,b] of[[0,0],[73,0],[0,57],[73,57]])x.fillRect(X+a,Y+b,3,3);}};
 const thr=(x,cx,cy)=>{for(const s of[-1,1]){const X=cx+s*33-(s<0?3:0);x.fillStyle='#ffe0a0';x.fillRect(X,cy+22,3,2);x.fillStyle='#ff9a20';x.fillRect(X,cy+24,3,3);x.fillStyle='#a04a10';x.fillRect(X,cy+27,3,2);}};
 add('衝撞預兆 A:斜線填色加四角括號(=衝撞結束時機身 76×60);力場殼 A 細框加角',x=>{scene(x,'A');plats(x);boss(x,BX,BY,null,'A');thr(x,BX,BY);box(x,BX-38-110,BY-30,'A');hero(x,64,178);},[60,0,320,180]);
 add('衝撞預兆 B:淡填色加實線框與亮角;力場殼 B 邊緣六角格',x=>{scene(x,'A');plats(x);boss(x,BX,BY,null,'B');thr(x,BX,BY);box(x,BX-38-110,BY-30,'B');hero(x,64,178);},[60,0,320,180]);
 // 拼圖:每格裁切後放大到 768x432
 const CW=768,CH=432,o=document.createElement('canvas');o.width=CW*2;o.height=(CH+28)*4;const X=o.getContext('2d');X.imageSmoothingEnabled=false;X.fillStyle='#000';X.fillRect(0,0,o.width,o.height);
 panels.forEach((p,i)=>{const cr=p.crop||[0,0,512,288],ox=(i%2)*CW,oy=Math.floor(i/2)*(CH+28);
  const s=Math.min(CW/cr[2],CH/cr[3]);X.drawImage(p.c,cr[0],cr[1],cr[2],cr[3],ox,oy+28,cr[2]*s,cr[3]*s);
  X.fillStyle='#fff';X.font='17px sans-serif';X.fillText((i%2?'右 ':'左 ')+p.lab,ox+8,oy+20);});
 return o.toDataURL().split(',')[1];});
require('fs').writeFileSync(outp,Buffer.from(d,'base64'));await br.close();console.log('已存',outp);})();
