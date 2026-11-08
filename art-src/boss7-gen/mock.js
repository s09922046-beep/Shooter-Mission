// 7 王小樣總表(11/8 第 2 回):每格是遊戲解析度 160x90 放大 3 倍,紅虛線=判定(扣血或受擊範圍)
// 第 1 列 本體結晶 A/B/C(各畫湛藍、赤紅、幻紫三種光暈);第 2 列 灼燒炭塊 A/B/C(上方為一般長苔石板對照);
// 第 3 列 白色閃爍 A/B/C(左:平台在場,右:幻紫期間平台不在);第 4 列 虹彩光柱 A/B/C(左預警、右生效);
// 第 5 列 共鳴連線 A/B、稜形碎晶彈 A/B/C(各 3 個旋轉角度)
// 背景暫用第 7 大關天空色的平塗漸層;正式場景等 GPT 圖。用法:node mock.js [輸出檔]
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const outp=process.argv[2]||__dirname+'/mock.png';
const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{
 const GW=160,GH=90,S=3,CW=GW*S,CH=GH*S,LH=30,M=12;
 const O=document.createElement('canvas');O.width=M+3*(CW+M);O.height=5*(CH+LH+M)+M;const ox=O.getContext('2d');ox.imageSmoothingEnabled=false;
 ox.fillStyle='#10141a';ox.fillRect(0,0,O.width,O.height);
 const BAY=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
 const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
 const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
 const UN=['#9fe8c8','#d8d07a','#c79ad8','#7fc4e0','#e8a6b8'];          // 「說不出名字的顏色」:偏移的薄荷、黃褐、淡紫、灰藍、粉
 const ST={blue:'#4aa0ff',red:'#ff4a6a',pur:'#b04aff'};
 let x,cells=[];
 function cell(col,row,lab,f){const c=document.createElement('canvas');c.width=GW;c.height=GH;x=c.getContext('2d');
  for(let y=0;y<GH;y++){x.fillStyle=mix('#2e4a58','#56767c',y/GH);x.fillRect(0,y,GW,1);}   // 第 7 大關天空色暫代背景
  const ov=[];f(ov);const X=M+col*(CW+M),Y=M+row*(CH+LH+M);
  ox.drawImage(c,0,0,GW,GH,X,Y+LH,CW,CH);
  for(const [q,cl] of ov){ox.setLineDash([6,4]);ox.strokeStyle=cl||'#ff3030';ox.lineWidth=2;ox.strokeRect(X+q[0]*S,Y+LH+q[1]*S,q[2]*S,q[3]*S);ox.setLineDash([]);}
  ox.fillStyle='#e8eef2';ox.font='16px sans-serif';ox.fillText(lab,X+4,Y+20);}
 const p=(X,Y,c,a)=>{if(a!==undefined)x.globalAlpha=a;x.fillStyle=c;x.fillRect(Math.round(X),Math.round(Y),1,1);x.globalAlpha=1;};
 const inPoly=(px_,py,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];
   if((yi>py)!==(yj>py)&&px_<(xj-xi)*(py-yi)/(yj-yi)+xi)c=!c;}return c;};
 // ---------- 本體結晶 ----------
 const SHAPES={
  A:[[[9,1],[14,3],[16,12],[12,21],[7,19],[5,9]],[[1,9],[6,6],[8,15],[3,17]],[[15,5],[21,9],[19,17],[15,15]]],                 // 不規則結晶簇
  B:[[[11,0],[19,5],[22,13],[13,22],[4,18],[0,8]]],                                                                          // 單顆多面
  C:[[[11,5],[16,11],[11,17],[6,11]],[[2,2],[7,3],[4,8]],[[17,1],[21,5],[16,6]],[[19,15],[21,21],[15,19]],[[3,15],[7,20],[1,21]],[[10,0],[13,1],[11,3]]] // 核心加碎片環繞
 };
 function crystal(cx,cy,k,state,t){const P=SHAPES[k],x0=cx-11,y0=cy-11,m=[];
  // 光暈:只在判定框外圍淡淡一圈抖色像素,明顯是光
  const ac=ST[state];for(let dy=-19;dy<=19;dy++)for(let dx=-19;dx<=19;dx++){const r=Math.hypot(dx,dy);if(r<11||r>19)continue;
   const a=(1-(r-11)/8)*0.9;if(a*16>BAY[(dy+40)&3][(dx+40)&3])p(cx+dx,cy+dy,ac,0.35);}
  for(let y=0;y<22;y++)for(let X=0;X<22;X++){let i=-1;for(let s=0;s<P.length;s++)if(inPoly(X+0.5,y+0.5,P[s]))i=s;m.push(i);}
  const at=(X,y)=>X<0||y<0||X>21||y>21?-1:m[y*22+X];
  for(let y=0;y<22;y++)for(let X=0;X<22;X++){const s=at(X,y);if(s<0)continue;
   const edge=at(X-1,y)!==s||at(X+1,y)!==s||at(X,y-1)!==s||at(X,y+1)!==s;
   if(edge){p(x0+X,y0+y,'#1c1626');continue;}
   const band=Math.floor(((X+2*y+(t||0))%15)/3),lit=(X-y)>-2?0.25:-0.25;                // 斜向色帶(遊戲中會流動)、左上受光
   p(x0+X,y0+y,lit>0?mix(UN[band],'#ffffff',0.25):mix(UN[band],'#2a2438',0.3));}
  // 高光
  const hl={A:[[10,5],[11,6]],B:[[8,6],[9,7],[10,8]],C:[[10,9],[11,10]]}[k];for(const [a,b] of hl)p(x0+a,y0+b,'#ffffff');}
 const base=(ov,lab)=>{};
 for(const [i,k] of ['A','B','C'].entries())cell(i,0,`本體 ${k}:${['不規則結晶簇','單顆多面結晶','核心加碎片環繞'][i]}(湛藍/赤紅/幻紫光暈)`,ov=>{
  [['blue',30],['red',80],['pur',130]].forEach(([s,cx],j)=>{crystal(cx,44,k,s,j*3);ov.push([[cx-11,33,22,22]]);});});
 // ---------- 長苔石板與灼燒炭塊 ----------
 function slab(X,Y,n){for(let i=0;i<n*16;i++){p(X+i,Y,'#7a9a6a');p(X+i,Y+1,(i%5===0)?'#5a7a4a':'#6a8a5a');
   for(let k=2;k<7;k++)p(X+i,Y+k,k===2?'#8a9a9a':(i%16===0||i%16===15)?'#3a4848':'#5e6e6e');p(X+i,Y+7,'#2e3a3a');}}
 function burn(X,Y,n,v){const ws=v==='B'?[10,14,8,12,15,9,13,11,10]:null;let cx=X,i=0;
  while(cx<X+n*16-3){const w=ws?ws[i%ws.length]:13,oy=v==='B'?[0,1,-1,2,0,1,-1][i%7]:0,w2=Math.min(w,X+n*16-cx);
   for(let a=0;a<w2;a++)for(let b=0;b<7;b++){const e=a===0||a===w2-1||b===0||b===6;
    const hot=(a+b*3+i)%7===0&&!e;p(cx+a,Y+b+oy,e?'#2a1010':hot?'#ffd27a':b<3?'#ff6a2a':'#a8341a');}
   if(v==='C'){for(let a=2;a<w2-2;a+=4){const hgt=3+((a+i)%3);for(let b=1;b<=hgt;b++)p(cx+a,Y-b+oy,b>hgt-1?'#ffd27a':'#ff8a3a');p(cx+a+1,Y-1+oy,'#ff6a2a');}}
   for(let a=0;a<w2;a++)p(cx+a,Y+8+oy,'#ff6a2a',0.25);                                // 底下一點餘燼光
   cx+=w2+(ws?2+(i%3):3);i++;}}
 for(const [i,k] of ['A','B','C'].entries())cell(i,1,`灼燒 ${k}:${['等寬炭塊、塊間 3 像素縫','大小不一、上下錯落','A 加上竄小火苗'][i]}`,ov=>{
  slab(24,18,7);burn(24,56,7,k);ov.push([[24,56,112,16]]);});
 // ---------- 白色閃爍 ----------
 for(const [i,k] of ['A','B','C'].entries())cell(i,2,`白閃 ${k}:${['整塊覆白(閃的那一下)','白色外框','白色掃光帶'][i]}(左在場、右消失中)`,ov=>{
  slab(8,40,4);
  if(k==='A'){x.globalAlpha=0.7;x.fillStyle='#ffffff';x.fillRect(8,40,64,8);x.fillRect(88,40,64,8);x.globalAlpha=1;}
  if(k==='B'){x.strokeStyle='#ffffff';x.lineWidth=1;x.strokeRect(7.5,39.5,65,9);x.setLineDash([2,2]);x.strokeRect(87.5,39.5,65,9);x.setLineDash([]);}
  if(k==='C'){for(const X0 of[8,88])for(let a=0;a<12;a++){const al=1-Math.abs(a-6)/6;x.globalAlpha=0.85*al;x.fillStyle='#ffffff';x.fillRect(X0+26+a,40,1,8);}x.globalAlpha=1;}
  ov.push([[8,40,64,16],'#3fff6a'],[[88,40,64,16],'#3fff6a']);});
 // ---------- 虹彩光柱 ----------
 function beamWarn(X){for(let y=0;y<GH;y++){p(X+12,y,'#ffffff',0.7);p(X+13,y,'#ffffff',0.7);if(y%6<3){p(X+11,y,'#ffffff',0.3);p(X+14,y,'#ffffff',0.3);}}}
 function beam(X,k){for(let y=0;y<GH;y++)for(let a=0;a<26;a++){const d=Math.abs(a-12.5)/13;let c,al;
   if(d<0.35){c='#ffffff';al=1;}
   else if(k==='A'){c=UN[Math.floor((y+a*2)/6)%5];al=0.9-0.5*(d-0.35);}
   else if(k==='B'){c=a<13?mix('#ffd27a','#e8a6b8',(0.5-a/26)*2):mix('#7fc4e0','#c79ad8',(a/26-0.5)*2);al=0.95-0.6*(d-0.35);}
   else{const bl=((Math.floor((y+40)/7)*3+Math.floor(a/5))%4===0);c=bl?UN[(Math.floor(y/7)+a)%5]:'#eef6f4';al=bl?0.85:0.55+0.3*(1-d);}
   p(X+a,y,c,al);}}
 for(const [i,k] of ['A','B','C'].entries())cell(i,3,`光柱 ${k}:${['白芯、兩側色帶流動','白芯、左暖右冷分光','白光柱內色斑上流'][i]}(左預警、右生效)`,ov=>{
  beamWarn(30);beam(104,k);ov.push([[104,0,26,90]],[[30,0,26,90],'#ffd23a']);});
 // ---------- 共鳴連線、稜形碎晶彈 ----------
 const tri=[[28,24],[120,30],[76,70]];
 for(const [i,k] of ['A','B'].entries())cell(i,4,`共鳴 ${k}:${['直線細光、亮度隨脈動','鋸齒電弧'][i]}(3 顆結晶,縮小顯示)`,ov=>{
  for(let a=0;a<3;a++){const [x1,y1]=tri[a],[x2,y2]=tri[(a+1)%3],n=Math.hypot(x2-x1,y2-y1);
   for(let s=0;s<n;s++){const t=s/n;let X=x1+(x2-x1)*t,Y=y1+(y2-y1)*t;
    if(k==='B'){const o=((Math.floor(s/4)%2)?1:-1)*2;X+=-(y2-y1)/n*o;Y+=(x2-x1)/n*o;}
    p(X,Y,'#ffffff',k==='A'?0.55+0.45*Math.sin(s*0.3)**2:0.9);if(k==='A')p(X,Y+1,'#c79ad8',0.35);}}
  for(const [cx,cy] of tri){crystal(cx,cy,'A','blue',0);ov.push([[cx-11,cy-11,22,22],'#ffa030']);}});
 cell(2,4,'碎晶彈 A 菱形 / B 細長稜柱 / C 三角碎片(各 3 個旋轉角)',ov=>{
  const shapes={A:[[0,-4],[3,0],[0,4],[-3,0]],B:[[0,-5],[1.5,-3],[1.5,3],[0,5],[-1.5,3],[-1.5,-3]],C:[[0,-4],[4,3],[-4,3]]};
  ['A','B','C'].forEach((k,r)=>[0,0.6,1.2].forEach((ang,j)=>{const cx=30+j*50,cy=16+r*28,P=shapes[k].map(([a,b])=>[cx+a*Math.cos(ang)-b*Math.sin(ang),cy+a*Math.sin(ang)+b*Math.cos(ang)]);
   for(let y=-6;y<=6;y++)for(let X=-6;X<=6;X++){const px_=cx+X+0.5,py=cy+y+0.5;if(!inPoly(px_,py,P))continue;
    const e=!inPoly(px_+1,py,P)||!inPoly(px_-1,py,P)||!inPoly(px_,py+1,P)||!inPoly(px_,py-1,P);p(cx+X,cy+y,e?'#ff5ab0':(Math.abs(X)+Math.abs(y)<2?'#ffffff':'#ff9ae0'));}
   for(let y=-6;y<=6;y++)for(let X=-6;X<=6;X++){const r=Math.hypot(X,y);if(r>4&&r<6&&BAY[(y+8)&3][(X+8)&3]<5)p(cx+X,cy+y,'#ff9ae0',0.3);}   // 淡光暈(遊戲中由發光層處理)
   ov.push([[cx-3,cy-3,6,6]]);}));});
 return O.toDataURL().split(',')[1];});
require('fs').writeFileSync(outp,Buffer.from(d,'base64'));console.log('已存',outp);await br.close();})();
