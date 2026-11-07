// 10 王第 2 段面容:以 face-auto.json(概念圖左案自動縮圖,倍率 7)為底稿
// 步驟:去掉 GPT 城垛王冠與青色裂縫 → 外框收成 1 像素、內部黑線改深影摺痕 → 黑曜配色 → 殘存灰白石殼片 → 細裂縫 → 眼縫 → 上緣月光邊光 → 接手繪三齒斷角王冠
// 輸出 face.json(兩款:A 石殼較多、B 石殼較少)與 face.png。用法:node face.js
const view=require('../boss2-gen/view.js');const fs=require('fs');
const A=require('./face-auto.json')[0];
// 色號:O 外框、k 深影摺痕、D/M/N/L/S 黑曜由暗到亮、E 青色裂縫、H 王冠亮面、R/r 眼縫紅光(核心)、a~d 殘存石殼由暗到亮
const PAL={O:'#07060c',k:'#100e18',D:'#1c1a2a',M:'#2a2740',N:'#3c3858',L:'#6c6894',S:'#9a98c0',E:'#3ad0c8',H:'#7a769e',
  R:'#ff5a5a',r:'#c41e2c',a:'#4a4850',b:'#76747c',c:'#8a8890',d:'#a8a6ae'};
const h=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
const N4=[[1,0],[-1,0],[0,1],[0,-1]],N8=[...N4,[1,1],[1,-1],[-1,1],[-1,-1]];
function build(shell){
  let F=A.slice(17).map(r=>r.split(''));const HH=F.length,WW=F[0].length;
  const at=(x,y)=>y>=0&&y<HH&&x>=0&&x<WW?F[y][x]:'.';
  // 1 青色裂縫、GPT 眼睛先換成鄰近色(之後自己畫)
  for(let it=0;it<4;it++)for(let y=0;y<HH;y++)for(let x=0;x<WW;x++)if('CRr'.includes(F[y][x])){
    const cnt={};for(const [dx,dy] of N8){const q=at(x+dx,y+dy);if('DNLS'.includes(q))cnt[q]=(cnt[q]||0)+1;}
    let b=null,bv=0;for(const k in cnt)if(cnt[k]>bv){bv=cnt[k];b=k;}if(b)F[y][x]=b;else if(it===3)F[y][x]='K';}
  // 2 外框:貼透明的 K 留作 O;外圈第二層 K 改鄰近填色(外框收成 1 像素);其他內部 K 改深影摺痕 k
  const O=F.map((r,y)=>r.map((c,x)=>c==='K'&&N4.some(([dx,dy])=>at(x+dx,y+dy)==='.')));
  const G=F.map(r=>r.slice());
  for(let y=0;y<HH;y++)for(let x=0;x<WW;x++){if(F[y][x]!=='K')continue;
    if(O[y][x]){G[y][x]='O';continue;}
    const nearOut=N8.some(([dx,dy])=>{const yy=y+dy,xx=x+dx;return yy>=0&&yy<HH&&xx>=0&&xx<WW&&O[yy][xx];});
    if(nearOut){const cnt={};for(const [dx,dy] of N8)for(const s of [1,2]){const q=at(x+dx*s,y+dy*s);if('DNLS'.includes(q))cnt[q]=(cnt[q]||0)+1;}
      let b=null,bv=0;for(const k in cnt)if(cnt[k]>bv){bv=cnt[k];b=k;}G[y][x]=b||'k';}
    else G[y][x]='k';}
  F=G;
  // 3 去孤點:四鄰都不同色的內部像素改成多數色
  for(let it=0;it<2;it++)for(let y=1;y<HH-1;y++)for(let x=1;x<WW-1;x++){const c=F[y][x];if(c==='.'||c==='O')continue;
    if(N4.every(([dx,dy])=>at(x+dx,y+dy)!==c)){const cnt={};for(const [dx,dy] of N8){const q=at(x+dx,y+dy);if(q!=='.'&&q!=='O')cnt[q]=(cnt[q]||0)+1;}
      let b=c,bv=0;for(const k in cnt)if(cnt[k]>bv){bv=cnt[k];b=k;}F[y][x]=b;}}
  // 4 黑曜配色:GPT 暗面 D→D、中間 N→M、亮面 L/S→N(壓暗成黑曜,邊光再提一階)
  for(let y=0;y<HH;y++)for(let x=0;x<WW;x++)F[y][x]={D:'D',N:'M',L:'N',S:'N'}[F[y][x]]||F[y][x];
  // 5 殘存石殼:不規則片(橢圓加位置雜訊),邊緣一圈暗灰 a 當剝落斷口
  const pat=shell==='A'?[[[14,1],[34,1],[38,4],[31,7],[24,6],[18,8],[13,5]],[[5,18],[12,17],[14,22],[10,27],[6,25]],[[38,18],[43,17],[44,22],[40,23]],[[18,42],[26,41],[27,45],[21,47]]]
    :[[[16,1],[28,1],[30,4],[24,6],[17,5]],[[5,18],[12,17],[14,22],[10,27],[6,25]]];
  const inP=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [xi,yi]=p[i],[xj,yj]=p[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
  const inS=(x,y)=>pat.some(p=>inP(x+0.5,y+0.5,p));   // 石殼片為多邊形(平面剝落片,不用圓形以免像污漬)
  const body=(x,y)=>'kDMNL'.includes(at(x,y));
  const S=F.map((r,y)=>r.map((c,x)=>body(x,y)&&inS(x,y)));
  for(let y=0;y<HH;y++)for(let x=0;x<WW;x++)if(S[y][x]){
    const edge=N4.some(([dx,dy])=>{const yy=y+dy,xx=x+dx;return body(xx,yy)&&!S[yy][xx];});
    const up=!(S[y-1]&&S[y-1][x]);F[y][x]=edge&&dyDown(x,y)?'a':up?'d':{k:'a',D:'b',M:'b',N:'c',L:'c'}[F[y][x]];}
  function dyDown(x,y){return !(S[y+1]&&S[y+1][x])||!(S[y][x+1]);}   // 斷口只畫在右下側,像有厚度
  // 6 細裂縫(1 像素,只在黑曜上):左頰一條長裂縫、右額一條短裂縫
  const CR=[[[19,1],[17,5],[14,7],[11,11],[9,16],[6,21],[7,27],[10,33],[12,38],[12,44]],[[47,2],[46,6],[48,10]]];
  for(const l of CR)for(let i=0;i+1<l.length;i++){const [ax,ay]=l[i],[bx,by]=l[i+1],n=Math.max(Math.abs(bx-ax),Math.abs(by-ay));
    for(let s=0;s<=n;s++){const x=Math.round(ax+(bx-ax)*s/n),y=Math.round(ay+(by-ay)*s/n);if('DMNLk'.includes(at(x,y)))F[y][x]='E';}}
  // 7 眼縫(半閉):上眼瞼深影、亮紅一列、下方暗紅短一列
  for(const [x0,x1] of [[15,22],[41,48]]){for(let x=x0-1;x<=x1+1;x++)if(at(x,13)!=='.')F[13][x]='k';
    for(let x=x0;x<=x1;x++)F[14][x]='R';for(let x=x0+1;x<=x1-1;x++)F[15][x]='r';}
  // 8 上緣月光邊光:上方是外框或透明的像素提亮一階
  const UP={D:'M',M:'N',N:'L',L:'S',b:'c',c:'d',d:'d'};
  for(let y=HH-1;y>=1;y--)for(let x=0;x<WW;x++){const u=at(x,y-1);if((u==='O'||u==='.')&&UP[F[y][x]])F[y][x]=UP[F[y][x]];}
  // 9 王冠(14 列):三齒尖角,中齒斷裂只剩鋸齒殘根(沿用第 1 段),齒間各加一個小齒(使用者 11/7,避免像角);齒左半亮、右半暗
  const CW=WW,CH=14,C=Array.from({length:CH},()=>Array(CW).fill('.'));
  const fill=(x,y,c)=>{if(x>=0&&x<CW&&y>=0&&y<CH)C[y][x]=c;};
  for(let y=9;y<CH;y++)for(let x=1;x<=57;x++)fill(x,y,y<11?'H':'M');               // 冠帶
  for(const [cx,top,brk] of [[7,0,0],[18,4,0],[30,1,5],[41,4,0],[52,0,0]])for(let y=top;y<9;y++){const hw=Math.floor((y-top+1)*5/9);   // 齒
    if(brk&&y<brk+((cx+y)%3===0?1:0))continue;for(let x=cx-hw;x<=cx+hw;x++)fill(x,y,x<cx?'H':x===cx?'L':'M');}
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)if(C[y][x]!=='.'){                     // 外框
    const e=N4.some(([dx,dy])=>{const yy=y+dy,xx=x+dx;return yy<0||xx<0||xx>=CW||(yy<CH&&C[yy][xx]==='.');});if(e)C[y][x]='O';}
  for(let x=0;x<CW;x++)if(C[CH-1][x]!=='.')C[CH-1][x]='O';                           // 冠帶下緣
  for(const [x,y] of [[30,5],[29,6],[31,6],[28,6],[32,6],[30,6]])if(C[y]&&C[y][x]&&C[y][x]!=='.')C[y][x]=C[y][x]==='O'?'O':'k';   // 斷口暗面
  const rows=[...C.map(r=>r.join('')),...F.map(r=>r.join(''))];
  // 去掉全空的右側欄
  let mx=0;for(const r of rows)for(let i=r.length-1;i>=0;i--)if(r[i]!=='.'){mx=Math.max(mx,i);break;}
  return rows.map(r=>r.slice(0,mx+1));}
const OUT={A:build('A'),B:build('B')};
module.exports={OUT,PAL};
if(require.main===module){fs.writeFileSync(__dirname+'/face.json',JSON.stringify(OUT));
  for(const k in OUT)console.log(k,OUT[k][0].length+'x'+OUT[k].length);
  view([{rows:OUT.A},{rows:OUT.B}],PAL,__dirname+'/face.png',8);}
