// 10 王第 1 段精靈:以 auto.json(姿勢表自動縮圖)為底稿手修
// 步驟:拿掉自動縮圖的青色裂縫與紅色圓盤 → 清掉頭部換手繪頭(斷角王冠、半閉雙目)→ 去孤點 → 重算外框 → 畫少數細裂縫
// 輸出 frames.txt(貼進 index.html 的 B10F)與 seg1.png(黑曜、石殼兩版放大檢查)。用法:node seg1.js
const view=require('../boss2-gen/view.js');const fs=require('fs');
const A=require('./auto.json');
// 色號:O 外框、k 深影、D/M/N/L/S 由暗到亮、E 青色裂縫(受擊不白化)、H 王冠亮面、F 臉亮面、f 臉暗面、e 閉眼線
const PAL={O:'#07060c',k:'#100e18',D:'#1c1a2a',M:'#2a2740',N:'#3c3858',L:'#6c6894',S:'#9a98c0',E:'#3ad0c8',
  H:'#7a769e',F:'#625e86',f:'#3c3858',e:'#07060c'};
const SHELL={O:'#2a282e',k:'#5a5860',D:'#76747c',M:'#8a8890',N:'#a09ea6',L:'#b8b6bc',S:'#d4d2d6',E:'#8a8890',
  H:'#c8c6cc',F:'#b0aeb4',f:'#86848c',e:'#3a383e'};
const N4=[[1,0],[-1,0],[0,1],[0,-1]];
// 手繪頭(朝左;'.' 透明):尖角王冠三齒,中齒斷裂只剩鋸齒殘根;側臉鼻樑、雙目半閉(e 線加上眼瞼亮線)、下顎
const HEAD=[
'...O........',
'..OHO.......',
'..OHO.OO.O..',
'..OHHOHNOHO.',
'.OHHHHHHHHNO',
'.ONNNNNNNMMO',
'.OFFFNMMMkkO',
'.OeeFNNMMkkO',
'OFFFNNMMkkkO',
'.OfFNNMMkkO.',
'.OFFNMMkkkO.',
'..OOFMkkkO..'];
// 低頭版(跪地、拄劍施法):王冠前傾、臉朝下
const HEADB=[
'..O.........',
'.OHO........',
'.OHO.OO.O...',
'.OHHOHNOHO..',
'OHHHHHHHHNO.',
'.ONNNNNNNMMO',
'.ONFFNMMMkkO',
'.OFFFNNMMkkO',
'.OeeFNNMkkkO',
'OFFFNNMMkkO.',
'.OfFNMMkkO..',
'..OOOMkkO...'];
// 每個姿勢:hb 頭部清除框 [x0,y0,x1,y1]、hd 手繪頭左上、h 判定框(24×34)在圖內左上、g 護心鏡外框左上(5×5)、cr 裂縫折線
const POSE=[
 {n:'idle', hb:[20,0,33,9], hd:[21,0],head:HEAD, h:[13,10], g:[22,11],
  cr:[[[27,13],[26,17],[27,21],[26,24]],[[33,24],[34,29],[33,33],[34,37]]]},
 {n:'walk', hb:[20,0,34,9], hd:[22,0],head:HEAD, h:[14,10], g:[23,12],
  cr:[[[28,14],[27,18],[28,22]],[[34,25],[35,29],[37,33]]]},
 {n:'slash',hb:[39,0,53,9], hd:[41,0],head:HEAD, h:[33,10], g:[42,13],
  cr:[[[47,19],[46,23],[47,27]],[[52,26],[53,31],[52,35]]]},
 {n:'lunge',hb:[30,0,44,8], hd:[32,0],head:HEAD, h:[31,-2], g:[38,10],
  cr:[[[46,13],[48,16],[50,17]],[[53,17],[56,19],[57,21]]]},
 {n:'cast', hb:[9,0,24,9],  hd:[11,0],head:HEADB,h:[7,3], g:[14,11],
  fix:[[2,8,['___OOOO___','__OLNNMO__','__ONMMkO__','_OOOOOOOOOO','_OLLNOLNNNM','_ONNMONMMMD','_ONMMOMMDDk','_OOOOOOOMDk','__OMDO_OODk','__OMDO__Ok','__OMDO__Ok','__OMDO__O.']]],
  cr:[[[18,14],[17,18],[18,22]],[[24,24],[25,28],[24,32]]]},
 {n:'kneel',hb:[10,1,23,8], hd:[11,0],head:HEADB,h:[7,3], g:[14,12],
  fix:[[2,4,['___OOOO____','__OLNNMO___','__ONMMkO___','_OOOOOOOOOO','_OLLNOLNNNM','_ONNMONMMMD','_ONMMOMMDDk','_OOOOOOOMDD','__OMDO_OODM','__OMDO__OM.','__OMDO__OM.']]],
  cr:[[[19,13],[18,17],[19,21]],[[27,24],[28,28],[27,31]]]},
];
function at(g,x,y){return (g[y]&&g[y][x])||'.';}
function maj(g,x,y,skip){const c={};for(const [dx,dy] of N4){const k=at(g,x+dx,y+dy);if(!skip.includes(k))c[k]=(c[k]||0)+1;}
  let b=null,v=0;for(const k in c)if(c[k]>v){v=c[k];b=k;}return b;}
function build(p,i){
  let g=A[i].map(r=>r.split(''));const w=g[0].length,h=g.length;
  // 1 拿掉青色與紅色(換成周圍本體色,找不到就用 D)
  for(let pass=0;pass<4;pass++)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if('CRr'.includes(g[y][x])){
    const m=maj(g,x,y,'.CRrK');g[y][x]=m||(pass===3?'D':g[y][x]);}
  // 2 清頭部框、貼手繪頭
  const [x0,y0,x1,y1]=p.hb;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(g[y])g[y][x]='.';
  const H=p.head;for(let j=0;j<H.length;j++)for(let k=0;k<H[j].length;k++){const c=H[j][k],y=p.hd[1]+j,x=p.hd[0]+k;
    if(c!=='.'&&g[y]&&x>=0&&x<w)g[y][x]='#'+c;}
  // 頭與身體之間的縫(清除框底下)補成深影
  for(let x=x0;x<=x1;x++){const y=y1+1;if(at(g,x,y)!=='.'&&at(g,x,y1)==='.'){let yy=y1;while(yy>=0&&at(g,x,yy)==='.'){g[yy][x]='k';yy--;if(yy<p.hd[1]+H.length-2)break;}}}
  // 3 去孤點(單一像素與四鄰都不同)、補小洞
  for(let pass=0;pass<2;pass++){const m=g.map(r=>r.slice());
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=g[y][x];if(c[0]==='#')continue;
      const nb=N4.map(([dx,dy])=>at(g,x+dx,y+dy));
      if(c!=='.'&&!nb.includes(c)){const b=maj(g,x,y,'.');if(b&&b[0]!=='#')m[y][x]=b;}
      if(c==='.'&&nb.filter(k=>k!=='.').length>=3)m[y][x]=maj(g,x,y,'.')[0]==='#'?'k':maj(g,x,y,'.');}
    g=m;}
  // 4 外框:形狀邊緣的 K 變 O,內部 K 變 k;邊緣不是 K 的,往外補一格 O
  const fill=(x,y)=>at(g,x,y)!=='.';
  const m=g.map(r=>r.slice());
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=g[y][x];if(c==='.'||c[0]==='#')continue;
    const edge=N4.some(([dx,dy])=>!fill(x+dx,y+dy));
    if(c==='K')m[y][x]=edge?'O':'k';}
  g=m;
  const W2=w+2,H2=h+2,o=[];for(let y=0;y<H2;y++){o.push(Array(W2).fill('.'));}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)o[y+1][x+1]=g[y][x];
  const m2=o.map(r=>r.slice());
  for(let y=0;y<H2;y++)for(let x=0;x<W2;x++)if(o[y][x]==='.'){
    if(N4.some(([dx,dy])=>{const k=at(o,x+dx,y+dy);return k!=='.'&&k!=='O'&&k!=='#O';}))m2[y][x]='O';}
  g=m2.map(r=>r.map(c=>c[0]==='#'?c[1]:c));
  // 4b 細部(使用者 11/7 要求加強):收掉自動縮圖殘留的雜點(本體色 8 鄰內同色不到 2 格就改成多數色),頭部不動
  const inHead=(x,y)=>x>=p.hb[0]+1&&x<=p.hb[2]+1&&y>=p.hb[1]+1&&y<=p.hb[3]+1;
  const BODY='kDMNLS';
  for(let pass=0;pass<2;pass++){const m=g.map(r=>r.slice());
    for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){const c=g[y][x];if(!BODY.includes(c)||inHead(x,y))continue;
      const cnt={};let same=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const k=at(g,x+dx,y+dy);if(k===c)same++;if(BODY.includes(k))cnt[k]=(cnt[k]||0)+1;}
      if(same<2){let b=c,v=0;for(const k in cnt)if(cnt[k]>v){v=cnt[k];b=k;}m[y][x]=b;}}
    g=m;}
  // 4c 月光邊光:輪廓上緣與前緣(朝左的左側)內側一格提亮一階,讓盔甲、披風、劍身的外形分得開
  const UP={k:'D',D:'M',M:'N',N:'L',L:'L',S:'S'};
  {const m=g.map(r=>r.slice());
   for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){const c=g[y][x];if(!BODY.includes(c)||inHead(x,y))continue;
     const up=at(g,x,y-1),lf=at(g,x-1,y);if(up==='O'||lf==='O')m[y][x]=UP[c];}
   g=m;}
  // 4d 局部手修(各姿勢 fix:[[x,y,rows]],圖內座標含外框;'.' 不動、'_' 清成透明)
  for(const [fx,fy,R] of (p.fix||[]))R.forEach((r,j)=>r.split('').forEach((c,i)=>{if(c==='.')return;if(g[fy+j]&&fx+i<g[0].length)g[fy+j][fx+i]=c==='_'?'.':c;}));
  // 5 細裂縫(1 像素折線,只畫在本體色上);座標以原圖為準(+1 外框位移)
  const body='kDMNLS';
  for(const s of p.cr)for(let q=0;q+1<s.length;q++){const [ax,ay]=s[q],[bx,by]=s[q+1],n=Math.max(Math.abs(bx-ax),Math.abs(by-ay));
    for(let t=0;t<=n;t++){const x=Math.round(ax+(bx-ax)*t/n)+1,y=Math.round(ay+(by-ay)*t/n)+1;if(body.includes(at(g,x,y)))g[y][x]='E';}}
  // 6 護心鏡位置先挖成深影(實際由遊戲 coreDraw 畫),預覽時畫一個示意
  const [gx,gy]=p.g;for(let j=0;j<5;j++)for(let k=0;k<5;k++){const x=gx+k+1,y=gy+j+1;if(at(g,x,y)!=='.'&&at(g,x,y)!=='O')g[y][x]='k';}
  let yb=g.length-1;while(yb>0&&g[yb].every(c=>c==='.'))yb--;          // 腳底列:判定框底邊對齊
  const cb=[],seen={};for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]==='E'&&!seen[x+','+y]){   // 每條裂縫的外框(發光登記用)
    const st=[[x,y]];seen[x+','+y]=1;let a=[x,y,x,y];while(st.length){const [cx,cy]=st.pop();a=[Math.min(a[0],cx),Math.min(a[1],cy),Math.max(a[2],cx),Math.max(a[3],cy)];
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=(cx+dx)+','+(cy+dy);if(!seen[k]&&at(g,cx+dx,cy+dy)==='E'){seen[k]=1;st.push([cx+dx,cy+dy]);}}}
    cb.push([a[0],a[1],a[2]-a[0]+1,a[3]-a[1]+1]);}
  return {n:p.n,rows:g.map(r=>r.join('')),h:[p.h[0]+1,yb-33],g:[gx+1,gy+1],c:cb};
}
const OUT=POSE.map(build);
module.exports={OUT,PAL,SHELL};
if(require.main===module)(async()=>{
  const MIR=['.OOO.','OrRrO','ORHRO','OrRrO','.OOO.'];
  const pv=OUT.map(o=>{const r=o.rows.map(s=>s.split(''));for(let j=0;j<5;j++)for(let k=0;k<5;k++)if(MIR[j][k]!=='.')r[o.g[1]+j][o.g[0]+k]=MIR[j][k];
    return {rows:r.map(s=>s.join(''))};});
  const P2=Object.assign({r:'#3a0a10',R:'#7a1420',H:'#d06070'},PAL);
  await view(pv,P2,__dirname+'/seg1.png',7);
  await view(OUT.map(o=>({rows:o.rows})),SHELL,__dirname+'/seg1-shell.png',4);
  let t='';for(const o of OUT)t+='  '+o.n+':{h:['+o.h+'],g:['+o.g+'],c:'+JSON.stringify(o.c)+',r:[\n'+o.rows.map(r=>"'"+r+"'").join(',\n')+']},\n';
  fs.writeFileSync(__dirname+'/frames.txt',t);for(const o of OUT)console.log(o.n,o.rows[0].length+'x'+o.rows.length);
})();
