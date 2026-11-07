// 10 王第 1、2 段黑曜石地面與平台、鏡面倒影的靜態小樣(只在本腳本內覆蓋繪製,不改 index.html)
// 用法:node art-src/boss10-gen/floor.js <輸出.png>
// 拼 2x2:現況、A 鏡面拋光、B 截面層理、C 青色裂紋;魔王與主角是現行暫用外觀,場景圖尚未生成(地平線為暫用色塊)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
const path=require('path');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const pg=await br.newPage({viewport:{width:1024,height:576}});
await pg.goto('file:///'+path.resolve(__dirname,'../../index.html').replace(/\\/g,'/'));
const d=await pg.evaluate(()=>{
  const go=()=>{resetRun();G.world=10;G.sub=5;startLevel();G.modal=null;G.state='play';for(let i=0;i<320;i++){P.inv=999;P.lives=5;update();}
    ebul.length=0;hazs.length=0;items.length=0;P.x=150;P.y=224-14;P.vx=0;P.vy=0;P.climb=false;boss.x=300;boss.cd=9999;G.shake=0;};
  const h=(x,y,s)=>{let n=(x*374761393+y*668265263+s*982451653)|0;n=(n^(n>>>13))*1274126177|0;return ((n^(n>>>16))>>>0)/4294967296;};
  const F=(x,y,w,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,hh);};
  const orig=drawTiles,sky0=LIT[9].sky,R=B10.refl,R0=Object.assign({},R);
  // 暫用地平線:冷灰藍廢墟剪影(只為了讓倒影有東西可映,實際由生成圖取代)
  const horizon=()=>{for(let x=16;x<496;x+=1){const t=h(x>>3,0,7),hh=t<0.25?0:Math.round(6+t*26*(0.5+0.5*Math.sin(x*0.02)));
      if(hh)F(x,224-hh,1,hh,t>0.8?'#4a4e66':'#3c4058');}
    for(const [x,w] of [[120,10],[352,14]]){F(x,196,2,28,'#2ad0c8');}};
  const floor=(v)=>{
    // 地面(第 14 列起,x 16~496)
    for(let y=224;y<288;y++){const d=y-224;let c;
      if(v==='A')c=d===0?'#9a98bc':d===1?'#4a4866':'#0c0b14';
      else{c=d===0?'#9a98bc':d===1?'#4a4866':(((d+ (d>18?2:0))>>3)&1)?'#121020':'#0c0b16';
        if(d>30)c=((d>>2)&1)?'#16132a':'#100e1e';}
      F(16,y,480,1,c);}
    if(v!=='A')for(let i=0;i<14;i++){const x=16+Math.floor(h(i,1,3)*460),y=240+Math.floor(h(i,2,3)*40),r=4+Math.floor(h(i,3,3)*6);  // 貝殼狀斷口弧紋
      ctx.strokeStyle=v==='C'?'#1c1a30':'#1e1b34';ctx.beginPath();ctx.arc(x+.5,y+.5,r,3.6,5.8);ctx.stroke();}
    if(v==='A')for(let i=0;i<5;i++){const x=40+i*98+Math.floor(h(i,4,3)*30);for(let k=0;k<40;k++)F(x+k*0.6|0,232+k,2,1,'rgba(150,150,200,0.06)');} // 斜向長反光
    if(v==='C')for(let i=0;i<6;i++){let x=30+Math.floor(h(i,5,3)*440),y=226;ctx.fillStyle='#1d6c6a';                                     // 青色裂紋
      while(y<288){ctx.fillRect(x,y,1,1);y++;if(h(i,y,6)<0.35)x+=h(i,y,8)<0.5?-1:1;}}
    // 平台(第 9 列,6 列高)
    for(const [x0,x1] of [[96,208],[304,416]]){F(x0,144,x1-x0,6,'#0c0b14');F(x0,144,x1-x0,1,'#9a98bc');F(x0,145,x1-x0,1,'#4a4866');
      F(x0,149,x1-x0,1,'#26233c');F(x0,144,1,6,'#4a4866');F(x1-1,144,1,6,'#1a1828');
      if(v==='C'){ctx.fillStyle='#2a9a96';for(let k=0;k<3;k++)ctx.fillRect(x0+20+k*31,146+(k&1),1,2);}}};
  const shots=[];const grab=()=>{shots.push(document.querySelector("canvas").toDataURL());};
  for(const v of ['now','A','B','C']){
    if(v==='now'){LIT[9].sky=sky0;Object.assign(R,R0);drawTiles=orig;}
    else{LIT[9].sky=['#05060e','#262844'];Object.assign(R,{a:0.55,h:64,amp:0,tint:'#141430',tk:0.3});
      drawTiles=function(){orig();horizon();floor(v);};}
    LT.key=0;go();for(let i=0;i<40;i++)render();grab();}
  return shots;});
const fs=require('fs'),out=process.argv[2];
const sheet=await pg.evaluate(async(d)=>{const Z=2,L=['現況(第 10 關材質、倒影 0.4、純黑天空)','A 鏡面拋光','B 截面層理(貝殼狀斷口弧紋)','C 截面層理加青色裂紋'];
  const o=document.createElement('canvas');o.width=512*Z*2+8;o.height=(288*Z+26)*2;const x=o.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,o.width,o.height);x.imageSmoothingEnabled=false;
  for(let i=0;i<4;i++){const im=new Image();im.src=d[i];await im.decode();const c=i%2,r=i>>1;x.drawImage(im,c*(512*Z+8),r*(288*Z+26)+26,512*Z,288*Z);
    x.fillStyle='#fff';x.font='18px sans-serif';x.fillText(L[i],c*(512*Z+8)+6,r*(288*Z+26)+19);}
  return o.toDataURL().split(',')[1];},d);
fs.writeFileSync(out,Buffer.from(sheet,'base64'));console.log('已存',out);await br.close();})();
