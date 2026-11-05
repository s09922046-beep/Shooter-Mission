// 把多組字元格依調色盤畫成 PNG:每格放大 z 倍,另附 1 倍、3 倍在深色底上
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
module.exports=async function(sets,pal,out,z=8){
 const br=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const pg=await br.newPage();
 const d=await pg.evaluate(([sets,pal,z])=>{
  let W=0,H=0;for(const s of sets){W+=s.rows[0].length*z+20;H=Math.max(H,s.rows.length*z);}
  const c=document.createElement('canvas');c.width=Math.max(W,600);c.height=H+20+sets[0].rows.length*3+20;const x=c.getContext('2d');
  x.fillStyle='#3a3040';x.fillRect(0,0,c.width,c.height);
  let ox=0;for(const s of sets){const r=s.rows;
   x.fillStyle='#ff00ff';x.fillRect(ox,0,r[0].length*z,r.length*z);
   for(let j=0;j<r.length;j++)for(let i=0;i<r[j].length;i++){const k=pal[r[j][i]];if(k){x.fillStyle=k;x.fillRect(ox+i*z,j*z,z,z);}}
   ox+=r[0].length*z+20;}
  // 1x 與 3x 遊戲尺寸(深色夜景底,旁邊放 12x18 主角框)
  const y0=H+10;x.fillStyle='#141a2a';x.fillRect(0,y0,c.width,c.height-y0);
  let bx=10;for(const s of sets){const r=s.rows;for(const sc of [1,3]){
    for(let j=0;j<r.length;j++)for(let i=0;i<r[j].length;i++){const k=pal[r[j][i]];if(k){x.fillStyle=k;x.fillRect(bx+i*sc,y0+5+j*sc,sc,sc);}}
    if(sc===3){x.fillStyle='#202028';x.fillRect(bx+r[0].length*3+4,y0+5+(r.length-18)*3,36,54);x.fillStyle='#8e1c2c';x.fillRect(bx+r[0].length*3+4,y0+5+(r.length-14)*3,36,6);}
    bx+=r[0].length*sc+(sc===3?60:8);}}
  return c.toDataURL().split(',')[1];},[sets,pal,z]);
 require('fs').writeFileSync(out,Buffer.from(d,'base64'));await br.close();
};
