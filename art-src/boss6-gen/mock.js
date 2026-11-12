// 6 王第 2 回小樣總表(11/12,Opus),輸出 art-src/boss6-gen/mock.png;先跑 down.js 產生 knight.png、kposes.png、arena.png
// 0 場景與精靈初稿對位、1 騎士平時與出招外觀對比、2 揮砍刃光、3 預警提示、4 橫掃、5 衝刺殘影、6 地面圈、7 縱柱、8 繩索隱形、9 骷髏出現
// 遊戲像素放大 3 倍顯示;紅虛線=扣血判定,黃虛線=預警範圍,灰虛線=本體(碰到不扣血),綠虛線=可攀。精靈為自動縮圖初稿,第 3 回手修
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const ld=f=>'data:image/png;base64,'+fs.readFileSync(__dirname+'/'+f).toString('base64');
const d=await pg.evaluate(async J=>{
 const load=async s=>{const im=new Image();im.src=s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c;};
 const ARENA=await load(J.arena),KN=await load(J.knight),KP=await load(J.kposes);
 const hs=i=>{let h=(i|0)*374761393;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296;};
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
   const g={c,x,w,h,px:(X,Y,W,H,col)=>{x.fillStyle=col;x.fillRect(Math.round(X),Math.round(Y),W,H);},
     disc:(cx,cy,r,col)=>{x.fillStyle=col;for(let yy=Math.floor(cy-r);yy<=cy+r;yy++)for(let xx=Math.floor(cx-r);xx<=cx+r;xx++)if((xx+.5-cx)**2+(yy+.5-cy)**2<=r*r)x.fillRect(xx,yy,1,1);},
     ell:(cx,cy,rx,ry,col)=>{x.fillStyle=col;for(let yy=Math.floor(cy-ry);yy<=cy+ry;yy++)for(let xx=Math.floor(cx-rx);xx<=cx+rx;xx++)if(((xx+.5-cx)/rx)**2+((yy+.5-cy)/ry)**2<=1)x.fillRect(xx,yy,1,1);},
     ring:(cx,cy,rx,ry,t,col,a0,a1)=>{x.fillStyle=col;a0=a0??-9;a1=a1??9;for(let yy=Math.floor(cy-ry-1);yy<=cy+ry+1;yy++)for(let xx=Math.floor(cx-rx-1);xx<=cx+rx+1;xx++){const u=(xx+.5-cx)/rx,v=(yy+.5-cy)/ry,q=Math.hypot(u,v),a=Math.atan2(v,u);if(q<=1&&q>=1-t/Math.min(rx,ry)&&a>=a0&&a<=a1)x.fillRect(xx,yy,1,1);}},
     line:(x0,y0,x1,y1,col,t)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;x.fillStyle=col;t=t||1;
       for(;;){x.fillRect(x0-(t>>1),y0-(t>>1),t,t);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}},
     dash:(X,Y,W,H,col)=>{X=Math.round(X);Y=Math.round(Y);x.fillStyle=col;for(let i=0;i<W;i+=3){x.fillRect(X+i,Y,Math.min(2,W-i),1);x.fillRect(X+i,Y+H-1,Math.min(2,W-i),1);}for(let i=0;i<H;i+=3){x.fillRect(X,Y+i,1,Math.min(2,H-i));x.fillRect(X+W-1,Y+i,1,Math.min(2,H-i));}},
     a:v=>{x.globalAlpha=v;}};
   return g;};
 // 遊戲座標面板:畫場景切片(地面以下補石地),之後的繪製都用遊戲座標
 const FL=['#2a2836','#3a3746','#4c4757','#5e596a'];
 const world=(g,wx,wy)=>{g.x.drawImage(ARENA,wx,wy,g.w,g.h,0,0,g.w,g.h);g.x.translate(-wx,-wy);
   if(wy+g.h>224){g.px(wx,224,g.w,288-224,FL[1]);g.px(wx,224,g.w,1,FL[3]);for(let X=Math.floor(wx/16)*16;X<wx+g.w;X+=16){g.px(X,224,1,16,FL[0]);g.px(X+8,240,1,16,FL[0]);}g.px(wx,240,g.w,1,FL[0]);g.px(wx,256,g.w,1,FL[0]);}};
 const plat=(g,c0,c1,row)=>{const Y=row*16;for(let X=c0*16;X<(c1+1)*16;X+=16){g.px(X,Y,16,6,FL[2]);g.px(X,Y,16,1,FL[3]);g.px(X,Y+5,16,1,FL[0]);g.px(X+15,Y,1,6,FL[0]);}};
 const IR=['#1c1a22','#3a3842','#5e5c66','#8a8892'];
 const chain=(g,col,r0,r1,alpha)=>{const X=col*16;g.a(alpha??1);for(let Y=r0*16;Y<(r1+1)*16;Y+=8){g.px(X+6,Y,4,6,IR[2]);g.px(X+7,Y+1,2,4,IR[0]);g.px(X+6,Y,1,6,IR[3]);g.px(X+7,Y+5,2,3,IR[1]);g.px(X+7,Y+6,2,1,IR[2]);}g.a(1);};
 // ---- 騎士精靈:主圖 36×36(判定框 22×30 在精靈 x14、y5),姿勢表以連通塊切出 5 姿勢 ----
 const comps=(()=>{const c=KP,x=c.getContext('2d'),D=x.getImageData(0,0,c.width,c.height).data,W=c.width,H=c.height,lab=new Int32Array(W*H).fill(-1),out=[];
   for(let s=0;s<W*H;s++){if(lab[s]>=0||D[s*4+3]===0)continue;const id=out.length,st=[s];lab[s]=id;let x0=W,y0=H,x1=0,y1=0,n=0;
     while(st.length){const q=st.pop(),X=q%W,Y=(q/W)|0;n++;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y;
       for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const XX=X+dx,YY=Y+dy;if(XX<0||YY<0||XX>=W||YY>=H)continue;const p=YY*W+XX;if(lab[p]<0&&D[p*4+3]>0){lab[p]=id;st.push(p);}}}
     out.push({id,x0,y0,x1,y1,n});}
   const big=out.filter(o=>o.n>60).sort((a,b)=>a.x0-b.x0);
   return big.map(o=>{const cv=document.createElement('canvas');cv.width=o.x1-o.x0+1;cv.height=o.y1-o.y0+1;const cx=cv.getContext('2d'),id=cx.createImageData(cv.width,cv.height);
     for(let Y=o.y0;Y<=o.y1;Y++)for(let X=o.x0;X<=o.x1;X++){const p=Y*W+X;if(lab[p]!==o.id)continue;const q=((Y-o.y0)*cv.width+X-o.x0)*4;for(let k=0;k<4;k++)id.data[q+k]=D[p*4+k];}
     cx.putImageData(id,0,0);return cv;});})();
 // 姿勢:0 走路 1 舉戟 2 橫持 3 衝刺 4 跪地;rx=精靈右緣對齊判定框右緣的偏移
 const POSE=[{c:KN,rx:1,bot:0},...comps.map((c,i)=>({c,rx:[0,2,4,6,0][i]||0,bot:0}))];
 const tint=(src,fn)=>{const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const x=c.getContext('2d');x.drawImage(src,0,0);const id=x.getImageData(0,0,c.width,c.height),D=id.data;
   for(let i=0;i<D.length;i+=4){if(!D[i+3])continue;const r=fn(D[i],D[i+1],D[i+2],(i>>2)%c.width,((i>>2)/c.width)|0,c);if(!r){D[i+3]=0;continue;}D[i]=r[0];D[i+1]=r[1];D[i+2]=r[2];if(r[3]!==undefined)D[i+3]=r[3];}x.putImageData(id,0,0);return c;};
 const isRed=(r,g,b)=>r>180&&g<60&&b<60, isAmb=(r,g,b)=>r>90&&r>b*2&&g>40&&!isRed(r,g,b);
 const lum=(r,g,b)=>r*.3+g*.59+b*.11;
 const KB={x:330,y:194,w:22,h:30};
 const knight=(g,pose,hx,hy,face,src)=>{const P=POSE[pose],c=src||P.c,X=hx+22+P.rx-c.width,Y=hy+30-c.height;
   if(face>0){g.x.save();g.x.translate(hx*2+22,0);g.x.scale(-1,1);g.x.drawImage(c,X,Y);g.x.restore();}else g.x.drawImage(c,X,Y);};
 const FI=['#3a1408','#8a2a0e','#d4561a','#ff9a3a','#ffd890','#fff6e6'];
 const AS=['#3e3a40','#6a666a','#9a968f','#c8c4ba','#ece8dc'];
 const TL=['#14403a','#2e8a74','#5ad4b0','#8affd0','#e8fff6'];
 const blocks=[];const add=(title,opts)=>blocks.push({title,opts});
 // ---------- 0 場景與精靈初稿 ----------
 const CHN=await load(J.chanter);
 const chanter=g=>{g.x.drawImage(CHN,400-4,112-CHN.height);};   // 手繪 chanter.js → chanter-hand.png;判定框在精靈 x4、y10
 add('0 場景(GPT 背景縮 1/3 壓 12 色)與精靈初稿對位(騎士為自動縮圖待第 3 回手修,詠嘆者為手繪第 2 版)',[{t:'整張場景 512×288:平台、鐵鍊、騎士起始位置、詠嘆者站位',w:512,h:288,draw:g=>{world(g,0,0);
   plat(g,21,29,7);plat(g,4,11,10);chain(g,6,2,13);chain(g,17,2,13);knight(g,0,KB.x,KB.y,-1);chanter(g);
   g.dash(KB.x,KB.y,22,30,'#b0b0b0');g.dash(400,86,18,26,'#ff4040');g.dash(96,32,16,192,'#3fff6a');g.dash(272,32,16,192,'#3fff6a');}},
   {t:'精靈放大:騎士 5 姿勢(走路/舉戟/橫掃/衝刺/跪地)與詠嘆者',w:230,h:48,draw:g=>{g.px(0,0,230,48,'#4c4757');let X=4;for(let i=1;i<POSE.length;i++){const c=POSE[i].c;g.x.drawImage(c,X,46-c.height);X+=c.width+3;}g.x.drawImage(CHN,X+2,46-CHN.height);}}]);
 // ---------- 1 騎士平時與出招外觀對比 ----------
 const ghost=src=>tint(src,(r,gg,b,x,y)=>{if(isRed(r,gg,b))return [150,40,40,120];const L=lum(r,gg,b);return [L*.7+40,L*.8+46,L+60,(x+y)%2?110:140];});
 const cold=src=>tint(src,(r,gg,b)=>{if(isRed(r,gg,b))return [120,24,20];if(isAmb(r,gg,b))return [70,64,60];const L=lum(r,gg,b);return [L*.92+4,L*.95+6,L+12];});
 const blaze=src=>tint(src,(r,gg,b)=>{if(isRed(r,gg,b))return [255,246,230];const L=lum(r,gg,b),k=Math.min(5,Math.floor(L/26));const c=FI[Math.max(1,k)];return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];});
 const crumble=(src,seed)=>tint(src,(r,gg,b,x,y,cv)=>{if(isRed(r,gg,b))return [140,30,24];const ctx=cv.getContext('2d');const L=lum(r,gg,b);
   const edge=L<20;if(edge&&hs(x*31+y*7+seed)<.45)return null;if(edge)return [96,92,90];return [L*.9+10,L*.9+10,L*.9+12];});
 const ember=src=>tint(src,(r,gg,b)=>{if(isRed(r,gg,b))return [255,70,40];if(isAmb(r,gg,b))return [255,170,60];const L=lum(r,gg,b);if(L<20)return [214,110,30];return [Math.min(255,r*1.15+20),gg*1.05+6,b];});
 const ashUp=(g,hx,hy,f)=>{for(let i=0;i<16;i++){const x=hx-6+hs(i*3+f)*34,yy=hy+4-((hs(i*7)*30+f*3)%30);g.px(x,yy,1,1,AS[2+(i&1)]);}};
 const trailFire=(g,x0,x1,y)=>{for(let x=x0;x<x1;x++){const k=(x-x0)/(x1-x0),h=Math.round(4+k*14);for(let j=0;j<h;j++)if(hs(x*13+j)<.75)g.px(x,y+28-j-hs(x)*6*k,1,1,FI[Math.min(5,1+Math.floor(k*3+j/h*2))]);}};
 const pair=(t,idleFn,atkFn)=>({t,w:150,h:56,draw:g=>{world(g,250,176);
   knight(g,0,268,194,-1,idleFn(POSE[0].c));g.dash(268,194,22,30,'#b0b0b0');
   atkFn(g);}});
 add('1 騎士平時(左,灰虛線=碰到不扣血)與衝刺中(右,紅虛線=扣血)的外觀對比;挑兩案到第 3 回預覽頁動態比較;A 的疑慮:騎士全程吃子彈,虛影像打不到',[
   pair('A 虛影與實體:平時半透明冷色,出招成實體',ghost,g=>{knight(g,4,346,194,-1);g.dash(346,194,22,30,'#ff4040');}),
   pair('B 冷甲與熾燃:平時冷灰,衝刺燒成橘白拖火尾',cold,g=>{trailFire(g,366,398,194);knight(g,4,346,194,-1,blaze(POSE[4].c));g.dash(346,194,22,30,'#ff4040');}),
   {t:'C 灰燼聚散:平時邊緣崩散成灰,出招凝聚發亮',w:150,h:56,draw:g=>{world(g,250,176);knight(g,0,268,194,-1,crumble(POSE[0].c,3));ashUp(g,268,194,2);g.dash(268,194,22,30,'#b0b0b0');
     knight(g,4,346,194,-1,ember(POSE[4].c));g.dash(346,194,22,30,'#ff4040');}}]);
 // ---------- 2 揮砍刃光(判定 36×26 在身前,預警 34 幀、生效 12 幀;判定框跟著騎士) ----------
 const CH={x:KB.x-34,y:KB.y,w:36,h:26};
 const slashA=(g,f)=>{const k=[1,.8,.45][f];const cx=CH.x+30,cy=CH.y+30;g.a(k);g.ring(cx,cy,30,30,f===0?4:3,FI[3],-Math.PI,-Math.PI/2+.25);g.ring(cx,cy,29,29,1.5,FI[5],-Math.PI,-Math.PI/2+.25);g.a(1);
   if(f>0)for(let i=0;i<8;i++)g.px(CH.x+hs(i+f*9)*30,CH.y+10+hs(i*5)*16-f*3,1,1,FI[3+(i&1)]);};
 const slashB=(g,f)=>{const n=[4,3,2][f];for(let i=0;i<n;i++){const a=-Math.PI*0.58-i*0.36,X=KB.x+Math.cos(a)*28,Y=KB.y+24+Math.sin(a)*22;g.a(.85-i*.2);g.ell(X,Y,4,6,i?FI[2]:AS[4]);g.px(X+1,Y-2,2,4,i?FI[3]:'#ffffff');g.a(1);}};
 const slashC=(g,f)=>{const X=CH.x+8;if(f===0){g.px(X,CH.y,2,26,FI[5]);g.px(X-1,CH.y,1,26,FI[3]);}else g.px(X,CH.y+26-f*4,2,f*4,FI[3]);
   for(let i=0;i<10;i++){const s=(f+1)*3;g.px(X+(hs(i)-.5)*s*4,224-1-hs(i+3)*s*1.5,1,1,FI[2+(i%3)]);}for(let i=-8;i<10;i++)if(hs(i+40)<.6)g.px(X+i,223,1,1,f<2?FI[3]:FI[1]);};
 add('2 揮砍刃光(判定 36×26 紅虛線,生效 12 幀;3 格=生效第 0、4、10 幀)',[['A 月牙刃光:由上往前下劈的弧形白芯橘邊',slashA],['B 戟刃殘影:戟頭沿劈砍路徑留下 3~4 個殘影',slashB],['C 劈地火花:一道直劈白線,落點地面迸出餘燼並留短暫焦痕',slashC]].map(([t,fn])=>({t,w:3*76,h:50,draw:g=>{
   for(let f=0;f<3;f++){const s=mk(76,50);world(s,284,180);knight(s,3,KB.x,KB.y,-1);fn(s,f);s.dash(CH.x,CH.y,36,26,'#ff4040');g.x.drawImage(s.c,f*76,0);g.px(f*76,0,1,50,'#000');}}})));
 // ---------- 3 預警提示(揮砍 34 幀、橫掃 44 幀共用風格) ----------
 const warnA=(g,f,B)=>{const k=[.3,.65,1][f];for(let i=0;i<B.w;i++){if(hs(i*7)>k)continue;g.px(B.x+hs(i*3)*B.w,222-hs(i+9)*3,1+(i%3===0),1,f===2&&i%2?FI[4]:FI[3]);}g.a(.45*k);g.px(B.x,221,B.w,3,FI[2]);g.a(1);};
 const warnB=(g,f)=>{const X=KB.x+15,Y=KB.y-11;g.a([.3,.6,1][f]);g.disc(X,Y,1+f,FI[4]);g.px(X-3-f,Y,7+f*2,1,FI[5]);g.px(X,Y-3-f,1,7+f*2,FI[5]);g.a(1);};
 add('3 預警提示(揮砍、橫掃共用;3 格=預警前段、中段、最後幾幀;黃虛線=預警時已決定的範圍)',[
   {t:'甲 範圍內地面餘燼漸亮(看得出範圍;推薦)',w:3*76,h:50,draw:g=>{for(let f=0;f<3;f++){const s=mk(76,50);world(s,284,180);knight(s,2,KB.x,KB.y,-1);warnA(s,f,CH);s.dash(CH.x,CH.y,36,26,'#ffd23a');g.x.drawImage(s.c,f*76,0);g.px(f*76,0,1,50,'#000');}}},
   {t:'乙 只有戟刃蓄光閃爍(畫面乾淨,但看不出範圍)',w:3*76,h:50,draw:g=>{for(let f=0;f<3;f++){const s=mk(76,50);world(s,284,180);knight(s,2,KB.x,KB.y,-1);warnB(s,f);s.dash(CH.x,CH.y,36,26,'#ffd23a');g.x.drawImage(s.c,f*76,0);g.px(f*76,0,1,50,'#000');}}}]);
 // ---------- 4 橫掃(判定 90×36,騎士在正中,生效 14 幀) ----------
 const SW={x:KB.x-34,y:KB.y-4,w:90,h:36};
 const sweepA=(g,f)=>{const cx=KB.x+11,cy=KB.y+18;const a0=[-Math.PI,-Math.PI*1.9,-Math.PI*2.6][f];g.a(f===2?.5:1);g.ring(cx,cy,44,17,3,FI[2]);g.ring(cx,cy,44,17,1.5,FI[4]);g.a(1);
   g.ring(cx,cy,44,17,4,FI[5],Math.max(-Math.PI,a0%Math.PI),Math.max(-Math.PI,a0%Math.PI)+1.2);};
 const sweepB=(g,f)=>{const k=[1,.75,.4][f];g.a(k);for(const s of [-1,1]){const cx=KB.x+11+s*14,cy=KB.y+18;g.ring(cx,cy,30,16,3,FI[3],s<0?Math.PI/2:-Math.PI/2,s<0?Math.PI*1.5:Math.PI/2);}g.a(1);
   g.a(k);for(const s of [-1,1]){const cx=KB.x+11+s*14,cy=KB.y+18;for(let a=-1.4;a<1.4;a+=.05){const X=cx+s*Math.cos(a)*30,Y=cy+Math.sin(a)*16;g.px(X,Y,1,1,FI[5]);}}g.a(1);};
 const sweepC=(g,f)=>{const cx=KB.x+11,cy=KB.y+18;for(let i=0;i<46;i++){const a=hs(i)*6.28+f*.9,r=.55+hs(i+7)*.45;g.px(cx+Math.cos(a)*44*r,cy+Math.sin(a)*17*r,i%4?1:2,1,i%3?AS[2+(i&1)]:FI[3]);}g.a(.35);g.ring(cx,cy,44,17,2,AS[3]);g.a(1);};
 add('4 橫掃(判定 90×36 紅虛線,生效 14 幀;3 格=生效第 0、6、13 幀)',[['A 環形火弧:一圈完整火環,亮點繞騎士轉一圈',sweepA],['B 兩側刃光:左右各一道半月刃痕',sweepB],['C 灰燼旋風:灰燼與火星沿圓環捲動',sweepC]].map(([t,fn])=>({t,w:3*110,h:52,draw:g=>{
   for(let f=0;f<3;f++){const s=mk(110,52);world(s,286,180);knight(s,3,KB.x,KB.y,-1);fn(s,f);s.dash(SW.x,SW.y,90,36,'#ff4040');g.x.drawImage(s.c,f*110,0);g.px(f*110,0,1,52,'#000');}}})));
 // ---------- 5 衝刺殘影(21 幀位移 63 像素,無預警;衝刺中本體扣血) ----------
 const dashA=(g,x)=>{for(let i=3;i>=1;i--){g.a(.15+.15*(3-i));knight(g,4,x+i*14,KB.y,-1);g.a(1);}};
 const dashB=(g,x)=>{trailFire(g,x+12,x+60,KB.y);};
 const dashC=(g,x)=>{for(let i=0;i<40;i++){const X=x+14+hs(i)*48,Y=KB.y+6+hs(i+5)*24-(X-x)*.15;g.px(X,Y,1,1,AS[1+(i%3)]);}for(let X=x+10;X<x+62;X++)if(hs(X)<.7)g.px(X,223,1,1,X<x+30?FI[2]:AS[0]);};
 add('5 衝刺殘影(由右往左衝 63 像素;2 格=衝刺中段、衝到定位)',[['A 三重殘影(半透明)',dashA],['B 火尾拖曳',dashB],['C 灰燼拖痕加地面焦痕',dashC]].map(([t,fn])=>({t,w:2*100,h:46,draw:g=>{
   for(let f=0;f<2;f++){const s=mk(100,46);world(s,262,182);const x=[318,286][f];fn(s,x);knight(s,4,x,KB.y,-1);s.dash(x,KB.y,22,30,'#ff4040');g.x.drawImage(s.c,f*100,0);g.px(f*100,0,1,46,'#000');}}})));
 // ---------- 6 地面圈(詠嘆者;判定 34×16 貼地,預警 95 幀跟著主角、生效 40 幀) ----------
 const GZ={x:200,y:208,w:34,h:16};
 const gA=(g,f)=>{const cx=GZ.x+17;if(f<2){g.a(f?.9:.45);g.ring(cx,222,17,3.5,1,TL[2]);for(let i=0;i<6;i++)g.px(cx-14+i*5.6,221,1,2,TL[3]);g.a(1);}
   else{g.ring(cx,222,17,3.5,1,TL[3]);const k=f===2?1:.5;g.a(.4*k);g.px(GZ.x+2,GZ.y,30,16,TL[2]);g.a(k);for(let i=0;i<12;i++)g.px(GZ.x+2+hs(i)*30,GZ.y+((hs(i+3)*16+f*5)%16),1,2,TL[4]);g.a(1);}};
 const gB=(g,f)=>{const cx=GZ.x+17;const n=f<2?f+1:3;for(let i=0;i<n;i++){const r=(i+1)/3*17;g.a(f<2?.6:1-i*.25);g.ring(cx,222,r,r*.22+1,1,f<2?TL[2]:TL[3]);g.a(1);}
   if(f>=2){g.a(f===2?.8:.4);for(let i=0;i<4;i++){const X=GZ.x+4+i*8;g.px(X,GZ.y+4,1,12,TL[3]);g.px(X+1,GZ.y+2+i%2*3,1,3,TL[4]);}g.a(1);}};
 const gC=(g,f)=>{const cx=GZ.x+17;for(let i=-16;i<17;i++)if(hs(i+20)<(f<2?.35+f*.35:.9)){g.px(cx+i,222,1,2,f<1?TL[1]:TL[2]);if(hs(i+50)<.3)g.px(cx+i,221-(i&1),1,1,TL[3]);}
   if(f>=2){for(let i=0;i<7;i++){const X=GZ.x+3+i*4.5,h=6+hs(i+f)*10;g.px(X,224-h,2,h,TL[2]);g.px(X,224-h,2,2,TL[4]);}}};
 add('6 地面圈(詠嘆者法術,判定 34×16;4 格=預警前段、預警末段(此時已停止跟隨)、生效第 0 幀、生效末段)',[['A 聖紋法陣:地上一圈刻紋,生效時光點上升',gA],['B 歌聲漣漪:同心波紋擴散,生效時豎起光絲',gB],['C 地縫青光:地面裂縫亮起,生效時竄出短光焰',gC]].map(([t,fn])=>({t,w:4*60,h:40,draw:g=>{
   for(let f=0;f<4;f++){const s=mk(60,40);world(s,187,190);fn(s,f);s.dash(GZ.x,GZ.y,34,16,f<2?'#ffd23a':'#ff4040');g.x.drawImage(s.c,f*60,0);g.px(f*60,0,1,40,'#000');}}})));
 // ---------- 7 縱柱(詠嘆者;判定寬 24、畫面頂到地面,預警 85 幀、生效 26 幀) ----------
 const PZ={x:220,w:24};
 const win=(g,cx,top,a)=>{g.a(a);g.px(cx-5,top+4,10,20,'#cfe8e2');g.px(cx-4,top+2,8,2,'#cfe8e2');g.px(cx-2,top+1,4,1,'#cfe8e2');g.px(cx,top+1,1,23,'#5a6a6a');g.px(cx-5,top+12,10,1,'#5a6a6a');g.a(1);};

 const pA=(g,f)=>{const cx=PZ.x+12;if(f<2){g.a(f?.9:.5);g.a(1);win(g,cx,8,f?1:.5);g.a(f?.5:.25);g.ell(cx,20,9,14,TL[4]);g.a(1);g.a(f?.5:.25);g.px(cx,34,1,190,TL[3]);g.a(1);g.ell(cx,223,4+f*3,1.5,TL[3]);}
   else{g.a(f===2?.85:.5);g.px(PZ.x,0,24,224,TL[2]);g.px(PZ.x+4,0,16,224,TL[3]);g.px(PZ.x+9,0,6,224,TL[4]);g.a(1);g.ell(cx,223,14,2,TL[4]);}};
 const pB=(g,f)=>{const cx=PZ.x+12;if(f<2){g.a(f?.8:.4);g.ell(cx,0,10,4+f*3,TL[4]);g.a(1);for(let i=0;i<(f+1)*8;i++)g.px(PZ.x+2+hs(i)*20,(hs(i+4)*220+f*30)%220,1,1,TL[3]);}
   else{g.a(f===2?.8:.45);g.px(PZ.x,0,24,224,TL[2]);g.px(PZ.x+6,0,12,224,TL[4]);g.a(1);for(let i=0;i<20;i++)g.px(PZ.x+hs(i)*24,hs(i+9)*224,1,2,'#ffffff');}};
 const pC=(g,f)=>{const cx=PZ.x+12;if(f<2){g.a(f?.9:.5);g.a(1);win(g,cx,8,f?.9:.5);g.a(.35*(f+1));g.px(PZ.x,218,24,6,TL[2]);g.a(1);}
   else{g.a(f===2?.75:.4);g.px(PZ.x,0,24,224,TL[3]);g.a(1);g.a(f===2?.6:.3);for(let y=0;y<224;y+=14){g.px(PZ.x,y,24,2,TL[1]);}g.px(PZ.x+11,0,2,224,TL[1]);g.a(1);}};
 add('7 縱柱(判定寬 24 紅虛線,從畫面頂到地面;位置跟主角 x,不一定對到高窗;4 格=預警前段、預警末段、生效第 0 幀、生效末段)',[['A 臨時光窗:光柱正上方的牆上浮現一扇發光高窗,細光線指向落點',pA],['B 頂端光斑:畫面頂端漏光,塵埃在柱內落下',pB],['C 窗格光柱:光柱帶窗櫺橫條暗紋,落點地面先亮',pC]].map(([t,fn])=>({t,w:4*50,h:232,draw:g=>{
   for(let f=0;f<4;f++){const s=mk(50,232);world(s,207,0);fn(s,f);s.dash(PZ.x,0,24,224,f<2?'#ffd23a':'#ff4040');g.x.drawImage(s.c,f*50,0);g.px(f*50,0,1,232,'#000');}}})));
 // ---------- 8 繩索隱形(預警 40 幀照常可爬 → 消失 190 幀 → 回來前 30 幀原位閃現) ----------
 const rA=(g,f)=>{ // 由下往上逐節化灰
   if(f===0)chain(g,6,2,13);else if(f<3){const k=f===1?.5:1,top=224-k*192;chain(g,6,2,13);for(let Y=top;Y<224;Y+=8){g.px(102,Y,4,6,FI[1]);g.px(103,Y+1,2,3,FI[2+(f===2&&Y%16?1:0)]);}}
   else if(f===3){for(let i=0;i<30;i++)g.px(98+hs(i)*12,32+hs(i+4)*192-i*.5,1,1,AS[2+(i&1)]);}
   else if(f===4){if(true){g.a(.4);chain(g,6,2,13);g.a(1);}}else chain(g,6,2,13);};
 const rB=(g,f)=>{if(f===0||f===5)chain(g,6,2,13);else if(f===1)chain(g,6,2,13,.7);else if(f===2)chain(g,6,2,13,.35);else if(f===4){g.a(.35);g.dash(96,32,16,192,IR[3]);g.a(1);}};
 const rC=(g,f)=>{if(f===0||f===5){chain(g,6,2,13);return;}if(f<3){chain(g,6,2,13);const n=f===1?6:14;for(let i=0;i<n;i++){const Y=40+i*13,X=104+Math.sin(i*1.3)*6;g.px(X,Y,2,2,TL[3]);g.px(X,Y-2,1,2,TL[2]);}}
   else if(f===3){for(let i=0;i<24;i++)g.px(98+hs(i)*12,32+hs(i+4)*192,1,1,TL[2+(i&1)]);}else{g.a(.45);chain(g,6,2,13);g.a(1);for(let i=0;i<6;i++)g.px(100+hs(i)*8,40+i*30,1,1,TL[3]);}};
 add('8 繩索隱形(左鐵鍊為例,綠虛線=可攀;6 格=平常、預警第 20 幀、預警第 39 幀、消失那幀、回來前閃現、回來)',[['A 鍊環由下往上燒紅逐節化灰',rA],['B 整條漸淡閃爍後消失',rB],['C 青綠音紋沿鍊纏繞後散成光點(詠嘆者的法術色)',rC]].map(([t,fn])=>({t,w:6*36,h:232,draw:g=>{
   for(let f=0;f<6;f++){const s=mk(36,232);world(s,86,0);fn(s,f);if(f<3||f===5)s.dash(96,32,16,192,'#3fff6a');g.x.drawImage(s.c,f*36,0);g.px(f*36,0,1,232,'#000');}}})));
 // ---------- 9 骷髏出現(骑士死後詠嘆者召喚;出現當幀起就是敵人,不加預兆時間,只加特效) ----------
 const skel=(g,X,Y,a)=>{g.a(a??1);g.px(X+3,Y,7,5,'#cfc8b4');g.px(X+4,Y+2,2,1,'#2a2420');g.px(X+7,Y+2,2,1,'#2a2420');g.px(X+5,Y+5,3,5,'#a89e88');for(let i=0;i<3;i++)g.px(X+3,Y+6+i*2,7,1,'#cfc8b4');g.px(X+4,Y+10,2,4,'#a89e88');g.px(X+8,Y+10,2,4,'#a89e88');g.px(X,Y+6,3,1,'#a89e88');g.px(X+10,Y+6,3,1,'#a89e88');g.a(1);};
 const SK={x:140,y:210};
 const sA=(g,f)=>{const cx=SK.x+6;if(f===0){g.a(.8);g.px(cx-6,170,12,54,AS[3]);g.px(cx-3,170,6,54,AS[4]);g.a(1);g.disc(cx,214,9,'#ffffff');}
   else{const k=[0,.8,.45,.15][f];g.a(k);g.px(cx-5+f,170+f*8,10-f*2,54-f*8,AS[2]);g.a(1);for(let i=0;i<10;i++)g.px(cx-8+hs(i+f)*16,206-f*6-hs(i)*20,1,1,AS[3]);}skel(g,SK.x,SK.y,f===0?.6:1);};
 const sB=(g,f)=>{const cx=SK.x+6;g.a([1,.7,.4,.15][f]);g.ell(cx,223,10,2,TL[3]);g.a(1);if(f===0)g.disc(cx,214,8,'#ffffff');for(let i=-8;i<9;i++)if(hs(i+3)<.5)g.px(cx+i,222-hs(i)*2,1,1,TL[2]);skel(g,SK.x,SK.y+[6,3,1,0][f],1);};
 const sC=(g,f)=>{const cx=SK.x+6;if(f===0)g.disc(cx,214,7,'#ffffff');const k=[.3,.6,.85,1][f];for(let i=0;i<24;i++){const t=hs(i);g.px(cx-8+t*16,SK.y-30*(1-k)*hs(i+5)+hs(i+9)*14,1,1,AS[2+(i&1)]);}skel(g,SK.x,SK.y,k);};
 add('9 骷髏出現(出現那幀已是敵人;4 格=第 0、3、8、16 幀)',[['A 灰燼柱噴起加白閃',sA],['B 地面青光加破土升起(只是外觀,判定照舊當幀在原位)',sB],['C 灰燼由上落下聚成骷髏',sC]].map(([t,fn])=>({t,w:4*40,h:66,draw:g=>{
   for(let f=0;f<4;f++){const s=mk(40,66);world(s,126,164);fn(s,f);s.dash(SK.x,SK.y,13,14,'#ff4040');g.x.drawImage(s.c,f*40,0);g.px(f*40,0,1,66,'#000');}}})));
 // ---------- 拼版 ----------
 const S=3,PAD=14,TH=26,LH=20,SW2=1800;
 const out=document.createElement('canvas');out.width=SW2;out.height=9000;const X=out.getContext('2d');X.fillStyle='#0c0a10';X.fillRect(0,0,SW2,9000);X.imageSmoothingEnabled=false;
 let y=PAD;for(const b of blocks){X.fillStyle='#fff';X.font='bold 18px sans-serif';X.fillText(b.title,PAD,y+18);y+=TH;let xx=PAD,rowH=0;
   for(const o of b.opts){const w=o.w*S;if(xx+w>SW2-PAD){y+=rowH+LH+6;xx=PAD;rowH=0;}const g=mk(o.w,o.h);o.draw(g);X.drawImage(g.c,0,0,o.w,o.h,xx,y,w,o.h*S);
     X.fillStyle='#ffd88a';X.font='15px sans-serif';X.fillText(o.t,xx,y+o.h*S+16);xx+=w+PAD;rowH=Math.max(rowH,o.h*S);}
   y+=rowH+LH+18;}
 const fin=document.createElement('canvas');fin.width=SW2;fin.height=y;fin.getContext('2d').drawImage(out,0,0);
 return fin.toDataURL().split(',')[1];},{arena:ld('arena.png'),knight:ld('knight.png'),kposes:ld('kposes.png'),chanter:ld('chanter-hand.png')});
fs.writeFileSync(__dirname+'/mock.png',Buffer.from(d,'base64'));await br.close();})();
