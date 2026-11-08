// 把 arena.png、stream.png 以 base64 寫進 index.html 末端 IMGD 區塊(b7arena、b7stream;已存在就取代該行)。檔案為 CRLF。用法:node export.js
const fs=require('fs'),f=__dirname+'/../../index.html';let s=fs.readFileSync(f,'utf8');
for(const [k,p] of[['b7arena','arena.png'],['b7stream','stream.png']]){const line=k+":'data:image/png;base64,"+fs.readFileSync(__dirname+'/'+p).toString('base64')+"'";
  const re=new RegExp('^'+k+":'data:[^'\r\n]*'",'m');
  if(re.test(s)){s=s.replace(re,line);continue;}
  const i=s.lastIndexOf('\r\n};\r\n</script>');if(i<0)throw 'IMGD 結尾找不到';
  s=s.slice(0,i)+(s[i-1]===','?'':',')+'\r\n'+line+s.slice(i);}
fs.writeFileSync(f,s);console.log('已寫入 b7arena、b7stream');
