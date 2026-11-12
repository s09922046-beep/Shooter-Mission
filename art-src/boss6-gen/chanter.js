// 6 王詠嘆者手繪精靈(11/12 使用者要求加強補繪;參考 boss6-chanter-main.webp),輸出 chanter-hand.png(24×36,面朝左)
// 判定框 18×26 在精靈 x4、y10(腳底 = 精靈底);光輪高出判定框約 9 像素,提鐘在框左緣外。
// 做法:位置依原圖量測換算;部件由後往前疊,重要部件(頭、袖、手、鐘)在外側畫 1 像素外框蓋過後方,最後整體外側補外框
// 用法:node chanter.js [放大倍數];另輸出 chanter-view.png(放大檢視,左為手繪、右為原圖縮圖)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
const Z=+process.argv[2]||10;
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const ref='data:image/webp;base64,'+fs.readFileSync(__dirname+'/../boss6-chanter-main.webp').toString('base64');
const r=await pg.evaluate(async([ref,Z])=>{
 const W=24,H=36,OY=1;   // 原圖對應:精靈 x=(X-380)/28.7、y=(Y-20)/28.7+OY
 const PAL={O:'#2c2622',W:'#f2eacf',C:'#ddd3b5',G:'#b8ae96',g:'#8e8674',D:'#55504a',d:'#3c3834',M:'#f8f2e2',m:'#d6cdb4',n:'#8a8270',
   K:'#4a4640',k:'#5e5952',H:'#948c80',h:'#6c665c',B:'#8e7044',b:'#5e4828',L:'#c0a268',l:'#e0c690',R:'#e01818',w:'#fbf7ec',A:'#7c766c',a:'#9a9484'};
 const out=new Array(W*H).fill(null);
 const grp=()=>new Map();
 const set=(L,x,y,c)=>{x=Math.round(x);y=Math.round(y)+OY;if(x<0||y<0||x>=W||y>=H)return;L.set(y*W+x,c);};
 const span=(L,y,x0,x1,c)=>{for(let x=x0;x<=x1;x++)set(L,x,y,c);};
 const rows=(L,y0,list)=>list.forEach((s,j)=>{if(s)span(L,y0+j,s[0],s[1],s[2]);});
 const disc=(L,cx,cy,r,c)=>{for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++)if((x+.5-cx)**2+(y+.5-cy)**2<=r*r)set(L,x,y,c);};
 const ring=(L,cx,cy,r0,r1,c)=>{for(let y=Math.floor(cy-r1);y<=cy+r1;y++)for(let x=Math.floor(cx-r1);x<=cx+r1;x++){const q=(x+.5-cx)**2+(y+.5-cy)**2;if(q<=r1*r1&&q>r0*r0)set(L,x,y,c);}};
 const ell=(L,cx,cy,rx,ry,c)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1)set(L,x,y,c);};
 // 疊合:edge=true 時先在部件外側一圈畫外框(蓋過後方部件),再放部件
 const put=(L,edge,ec)=>{if(edge)for(const q of L.keys()){const x=q%W,y=(q/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const p=Y*W+X;if(!L.has(p))out[p]=ec||'O';}}for(const [q,c] of L)out[q]=c;};
 // 1 光輪:圓盤、近外緣一圈刻線、內圈亮(原圖中心約 15,5.5、半徑 4.8)
 const halo=grp();disc(halo,15,5,5.5,'W');ring(halo,15,5,3.8,4.8,'g');disc(halo,15,5,3.8,'C');put(halo);
 // 2 長袍:近直筒略寬的鐘形、直條紋(亮/灰交錯)、袍底灰燼
 const robe=grp();for(let y=14;y<=34;y++){const t=(y-14)/20,l=Math.round(8.3-t*.9),r=Math.round(19.6+t*.9);for(let x=l;x<=r;x++){const u=(x-l)/(r-l);
   let c=(u>.18&&u<.28)||(u>.62&&u<.7)?'G':(u>.86?'G':'W');if(u<.07)c='C';if(y>=32)c=y===32?'a':'A';set(robe,x,y,c);}}put(robe);
 // 3 後側寬袖(從右肩垂下到 y24,開口朝左;內側一道褶)
 const bsl=grp();rows(bsl,13,[[16,21,'W'],[15,21,'W'],[15,21,'C'],[15,21,'C'],[16,21,'C'],[16,21,'C'],[16,21,'G'],[17,21,'G'],[17,21,'G'],[17,21,'G'],[18,21,'G'],[19,20,'g']]);
 for(let y=14;y<=22;y++)set(bsl,19,y,'G');span(bsl,15,15,16,'G');put(bsl,true);
 // 4 披肩(圓肩,右端尖角)
 const cape=grp();rows(cape,9,[[11,17,'W'],[10,19,'W'],[9,20,'W'],[9,21,'C'],[9,21,'C'],[10,13,'G']]);put(cape,true);
 // 5 聖帶(深灰 3 寬,由領口直落袍底)與胸前聖徽(唯一紅色,白圈)
 const st=grp();for(let y=9;y<=34;y++){span(st,y,13,14,'D');set(st,15,y,'d');}put(st);
 // 6 掌心向上的手(從後袖口伸出,托在聖帶前)
 const ph=grp();rows(ph,15,[[10,15,'H'],[11,14,'h']]);set(ph,10,14,'H');put(ph,true);
 // 7 頭:深色頭巾貼後腦 + 聖徒面具側臉(額、鼻尖、下垂閉眼、小口、下巴)
 const head=grp();const P=(c,pts)=>pts.forEach(([x,y])=>set(head,x,y,c));
 P('K',[[13,1],[14,1],[15,1],[14,2],[15,2],[16,2],[15,3],[16,3],[17,3],[15,4],[16,4],[17,4],[15,5],[16,5],[17,5],[15,6],[16,6],[17,6],[15,7],[16,7],[17,7],[15,8],[16,8]]);
 P('k',[[16,3],[16,4]]);                                                       // 頭巾亮面
 P('M',[[12,2],[13,2],[12,3],[13,3],[12,4],[11,5],[12,5],[13,5],[12,6],[13,6],[13,7],[13,8]]);   // 面具:額、鼻尖(x11)、下巴
 P('m',[[14,2],[14,3],[14,4],[14,5],[14,6],[14,7],[14,8]]);                      // 面具側面陰影
 P('g',[[13,4],[12,7]]);                                                       // 閉眼、小口
 P('h',[[12,1],[11,2],[11,3],[11,4],[10,5],[11,6],[11,7],[12,8],[13,9]]);        // 側臉輪廓線(深灰,不用黑以免吃掉面具)
 put(head);
 // 8 立領
 const col=grp();rows(col,8,[[13,16,'G'],[13,16,'g']]);put(col,true);
 // 9 高舉的前臂與寬袖(袖子從前臂垂到腰,兩道褶)
 const slv=grp();rows(slv,6,[[6,7,'C'],[6,8,'C'],[6,9,'W'],[6,10,'W'],[6,11,'W'],[5,11,'W'],[5,11,'C'],[5,11,'C'],[5,11,'C'],[5,11,'C'],[5,11,'C'],[5,11,'C'],[6,11,'G'],[6,10,'C'],[7,10,'G'],[8,9,'G']]);
 for(let y=11;y<=19;y++)set(slv,7,y,'G');for(let y=10;y<=17;y++)set(slv,10,y,'G');put(slv,true);
 // 聖徽放在袖子之後,避免被袖子外框蓋掉
 const seal=grp();rows(seal,11,[[13,15,'w'],[12,16,'w'],[12,16,'w'],[13,15,'w']]);span(seal,12,13,15,'R');span(seal,13,13,15,'R');put(seal);
 // 10 手(握鐘柄)
 const hand=grp();rows(hand,5,[[4,5,'H'],[3,6,'H'],[4,6,'h']]);put(hand,true);
 // 11 提鐘(約頭大):鐘柄穿過手往上,鐘口朝下;左亮右暗、口緣暗線
 const bell=grp();for(let y=2;y<=4;y++){set(bell,4,y,'L');set(bell,5,y,'b');}set(bell,4,8,'L');set(bell,5,8,'b');
 rows(bell,9,[[3,5,'B'],[3,5,'B'],[2,6,'B'],[2,6,'B'],[2,6,'B'],[1,7,'b']]);for(let y=10;y<=13;y++){set(bell,y<11?3:2,y,'L');set(bell,6,y,'b');}set(bell,3,10,'l');
 put(bell,true);
 // 全體外側外框
 const q0=out.slice();for(let i=0;i<W*H;i++){if(q0[i])continue;const x=i%W,y=(i/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&q0[Y*W+X]){out[i]='O';break;}}}
 // 輸出
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 for(let i=0;i<W*H;i++)if(out[i]){x.fillStyle=PAL[out[i]];x.fillRect(i%W,(i/W)|0,1,1);}
 // 檢視:手繪 ×Z(上疊判定框)、原圖縮圖
 const im=new Image();im.src=ref;await im.decode();
 const v=document.createElement('canvas');v.width=W*Z*2+40;v.height=H*Z+20;const vx=v.getContext('2d');vx.fillStyle='#4c4757';vx.fillRect(0,0,v.width,v.height);vx.imageSmoothingEnabled=false;
 vx.drawImage(c,10,10,W*Z,H*Z);vx.strokeStyle='#ff4040';vx.setLineDash([6,4]);vx.lineWidth=2;vx.strokeRect(10+4*Z,10+10*Z,18*Z,26*Z);
 vx.imageSmoothingEnabled=true;const s=(H*Z)/975;{const k=Z/28.7;vx.drawImage(im,380,20-28.7,24*28.7,36*28.7,W*Z+30,10,24*Z,36*Z);}
 return [c.toDataURL().split(',')[1],v.toDataURL().split(',')[1]];},[ref,Z]);
fs.writeFileSync(__dirname+'/chanter-hand.png',Buffer.from(r[0],'base64'));fs.writeFileSync(__dirname+'/chanter-view.png',Buffer.from(r[1],'base64'));await br.close();})();
