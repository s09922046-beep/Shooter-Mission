// 4 王:body.png 裁到不透明範圍後,與 head.png、low.png、arena.png 以 base64 寫進 index.html 末端 IMGD 區塊(b4body、b4head、b4low、b4arena;已存在就取代該行)。
// 印出 body 裁切後左上角的遊戲座標(index.html 的 B4BX、B4BY)。檔案為 CRLF。用法:node export.js(先跑 arenafix.js、down.js、low.js)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const r=await pg.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 const d=x.getImageData(0,0,c.width,c.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;
 for(let y=0;y<c.height;y++)for(let i=0;i<c.width;i++)if(d[(y*c.width+i)*4+3]){x0=Math.min(x0,i);x1=Math.max(x1,i);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,-x0,-y0);
 return {u:o.toDataURL(),x0:x0+230,y0:y0-12,w:o.width,h:o.height};},'data:image/png;base64,'+fs.readFileSync(__dirname+'/body.png').toString('base64'));
await br.close();
const f=__dirname+'/../../index.html';let s=fs.readFileSync(f,'utf8');
for(const [k,u] of[["b4body",r.u],["b4head",'data:image/png;base64,'+fs.readFileSync(__dirname+'/head.png').toString('base64')],['b4low','data:image/png;base64,'+fs.readFileSync(__dirname+'/low.png').toString('base64')],["b4arena",'data:image/png;base64,'+fs.readFileSync(__dirname+'/arena.png').toString('base64')]]){const line=k+":'"+u+"'";
  const re=new RegExp('^'+k+":'data:[^'\r\n]*'",'m');
  if(re.test(s)){s=s.replace(re,line);continue;}
  const i=s.lastIndexOf('\r\n};\r\n</script>');if(i<0)throw 'IMGD 結尾找不到';
  s=s.slice(0,i)+(s[i-1]===','?'':',')+'\r\n'+line+s.slice(i);}
fs.writeFileSync(f,s);console.log('已寫入 b4body、b4head、b4low、b4arena;身體圖左上角(遊戲)',r.x0,r.y0,'大小',r.w,r.h);})();
