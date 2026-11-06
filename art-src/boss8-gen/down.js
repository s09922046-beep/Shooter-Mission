// 概念圖自動縮圖當底稿:切出姿勢、依分類取眾數、輸出字元格(之後手修)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const fs=require('fs');
const REF={K:[12,8,16],U:[70,30,95],P:[110,50,140],W:[230,222,195],G:[175,165,140],E:[150,235,70],R:[235,25,30],r:[150,15,25],F:[60,240,80]};
module.exports=async function(file,crops,scale){
 const br=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const pg=await br.newPage();
 const src='data:image/webp;base64,'+fs.readFileSync(file).toString('base64');
 const res=await pg.evaluate(async([src,crops,scale,REF])=>{
  const im=new Image();im.src=src;await im.decode();
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
  const D=x.getImageData(0,0,c.width,c.height).data,Wd=c.width;
  const keys=Object.keys(REF);
  function cls(i){const r=D[i],g=D[i+1],b=D[i+2];if(r>180&&b>180&&g<110)return '.';
   let best='.',bd=1e9;for(const k of keys){const q=REF[k];const d=(r-q[0])**2+(g-q[1])**2+(b-q[2])**2;if(d<bd){bd=d;best=k;}}return best;}
  const out=[];
  for(const [cx,cy,cw,ch] of crops){
   // 先找非底色外框
   let x0=1e9,y0=1e9,x1=-1,y1=-1;
   for(let y=cy;y<cy+ch;y+=2)for(let xx=cx;xx<cx+cw;xx+=2){if(cls((y*Wd+xx)*4)!=='.'){x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
   const ow=Math.ceil((x1-x0)/scale),oh=Math.ceil((y1-y0)/scale),rows=[];
   for(let j=0;j<oh;j++){let row='';for(let i=0;i<ow;i++){const cnt={};let tot=0,bg=0;
     for(let y=Math.floor(y0+j*scale);y<Math.floor(y0+(j+1)*scale);y++)for(let xx=Math.floor(x0+i*scale);xx<Math.floor(x0+(i+1)*scale);xx++){
      const k=cls((y*Wd+xx)*4);tot++;if(k==='.'){bg++;continue;}cnt[k]=(cnt[k]||0)+1;}
     if(bg/tot>0.55){row+='.';continue;}
     // 少量但重要的色(眼、寶石、骨、火)優先
     let best='.',bv=-1;for(const k in cnt){const w=cnt[k]*({E:4,R:2.5,r:2,W:1.6,F:3,G:1.2}[k]||1);if(w>bv){bv=w;best=k;}}
     row+=best;}rows.push(row);}
   out.push(rows);}
  return out;},[src,crops,scale,REF]);
 await br.close();return res;};
