// 5 王精靈手修(11/7):讀 down.json → 裁到本體外框 → 6 個艙門改蓋六角門樣板 → 鏡頭眼抽出成獨立小矩陣(本體該處改外框色,由 coreDraw 另畫)
// 輸出 frames.txt(貼進 index.html 的 B5F)與 build.png(×8 檢視:本體、開艙、鏡頭)
// 用法:node build.js
const fs=require('fs'),path=require('path');
const {rows,pal}=JSON.parse(fs.readFileSync(path.join(__dirname,'down.json'),'utf8'));
const g=rows.map(r=>[...r]);const H=g.length,W=g[0].length;
const HATCH=[            // 15×13 六角門:O 外框、A 門框、E 門板上半、D 門板下半、O 中縫(蓋過原圖兩層外框)
 '....OOOOOOO....',
 '...OAAAAAAAO...',
 '..OAOOOOOOOAO..',
 '.OAOEEEEEEEOAO.',
 'OAOEEEEEEEEEOAO',
 'OAOEEEEEEEEEOAO',
 'OAOOOOOOOOOOOAO',
 'OAODDDDDDDDDOAO',
 'OAODDDDDDDDDOAO',
 '.OAODDDDDDDOAO.',
 '..OAOOOOOOOAO..',
 '...OAAAAAAAO...',
 '....OOOOOOO....'];
const HC=[[27,14],[49,14],[19,30],[57,30],[27,46],[49,46]];   // 艙門中心(判定框座標);第 3 個 (19,30) 對齊小蜂出口 (20,30)
const go=g.map(r=>r.slice());   // 開艙版:門板改黑洞(K)、門板內側外框改青光(F)、中縫也是黑洞
const inner=(j,i)=>[[0,1],[0,-1],[1,0],[-1,0]].some(([a,b])=>'ED'.includes((HATCH[j+a]||'')[i+b]||'.'));
for(const [cx,cy] of HC)HATCH.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='.')return;const Y=cy-6+j,X=cx-7+i;g[Y][X]=ch;
  go[Y][X]='ED'.includes(ch)?'K':(ch==='O'&&inner(j,i)?(j===6?'K':'F'):ch);}));
// 鏡頭:中心 (38,30),半徑 8 內的 G/H/E 抽出
const LC=[38,30],LR=9,lens=[],lensPx=[];
for(let y=LC[1]-LR;y<=LC[1]+LR;y++){let s='';for(let x=LC[0]-LR;x<=LC[0]+LR;x++){const ch=g[y][x],d=Math.hypot(x-LC[0],y-LC[1]);
  if(d<=LR+0.3&&'GHE'.includes(ch)){s+=ch;g[y][x]='O';lensPx.push([x,y]);}else s+='.';}lens.push(s);}
for(const [x,y] of lensPx)go[y][x]='O';
// 大砲蓄能版:鏡頭外圈裝甲環沿 6 道縫裂開(縫寬約 8 度)並整圈外推 1 像素,像花瓣張開
const gc=g.map(r=>r.slice());
for(let y=LC[1]-14;y<=LC[1]+14;y++)for(let x=LC[0]-14;x<=LC[0]+14;x++){const d=Math.hypot(x-LC[0],y-LC[1]),a=(Math.atan2(y-LC[1],x-LC[0])*180/Math.PI+390)%60,gap=Math.min(a,60-a)<9;
  if(d>8.3&&d<=12.3)gc[y][x]=gap?'O':(d>11.3?'A':g[y][x]==='O'&&d>10.8?'A':g[y][x]);
  else if(d>12.3&&d<=13.2&&!gap)gc[y][x]='O';}
// 裁切
let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]!=='.'){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
const cut=m=>m.slice(y0,y1+1).map(r=>r.slice(x0,x1+1).join(''));const body=cut(g),bodyO=cut(go),bodyC=cut(gc);
const out=`// 本體 ${x1-x0+1}x${y1-y0+1},左上在判定框內 (${x0},${y0});艙門中心(判定框座標) ${JSON.stringify(HC)};鏡頭中心 (${LC}) 半徑 ${LR}\n`+
 `body:\n${body.map(r=>"'"+r+"',").join('\n')}\nopen:\n${bodyO.map(r=>"'"+r+"',").join('\n')}\ncannon:\n${bodyC.map(r=>"'"+r+"',").join('\n')}\nlens:\n${lens.map(r=>"'"+r+"',").join('\n')}\n`;
fs.writeFileSync(path.join(__dirname,'frames.txt'),out);
// 檢視圖
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
 const d=await pg.evaluate(({body,bodyO,bodyC,lens,pal,HC,x0,y0})=>{const Z=8,o=document.createElement('canvas');o.width=(body[0].length+4)*Z*3;o.height=(body.length+4)*Z;const x=o.getContext('2d');
  x.fillStyle='#1c2433';x.fillRect(0,0,o.width,o.height);
  const P=Object.assign({},pal,{K:'#000'});
  const dr=(m,ox,oy,f)=>m.forEach((r,j)=>[...r].forEach((ch,i)=>{const c=f?f(ch,i,j):ch;if(c==='.')return;x.fillStyle=P[c]||c;x.fillRect((ox+i)*Z,(oy+j)*Z,Z,Z);}));
  dr(body,2,2);dr(lens,2+38-8-x0,2+30-8-y0);
  dr(bodyO,body[0].length+6,2);dr(bodyC,body[0].length*2+10,2);
  return o.toDataURL().split(',')[1];},{body,bodyO,bodyC,lens,pal,HC,x0,y0});
 fs.writeFileSync(path.join(__dirname,'build.png'),Buffer.from(d,'base64'));await br.close();console.log(out.split('\n')[0]);})();
