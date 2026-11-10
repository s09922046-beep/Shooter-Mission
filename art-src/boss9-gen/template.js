// 9 王版型底圖(11/10),輸出 art-src/boss9-body-template.png 與 boss9-arena-template.png
// 本體:遊戲座標 ×6,1536x1024,畫布左上角 = 遊戲 (300,-25)。
//   洋紅=空白;橘線=可以畫的範圍(x>=356 且 y<=140,往上、往右延伸出畫面);白虛線=本體碰撞判定 150x120(第 1 節授權碰到扣血,要整塊填滿,左緣與下緣貼齊);
//   青線=畫面上緣與右緣;紅框=核心 60x60(紅色複眼群);黃圈=左下、右下肉質砲囊(兩側齊射發射點 366,116 與 486,116);綠虛線=左繩梯第 21 欄(只供對照,不畫)
// 場景:遊戲座標 ×3,1536x1024(畫面 512x288 對應上方 1536x864)。整張都是太空(坑洞看得到甲板下方),遊戲另畫甲板、平台、繩梯與小星點。
//   深灰藍=要畫太空的範圍;淺灰=左右牆;青線=甲板表面 y=224;白虛線=平台與繩梯(含翻轉後鏡像位置);橘虛線=魔王所在;淺藍虛線=視覺焦點(行星與星雲)
const {chromium}=require('D:/Claude code/Projects/Shooter-Mission/tools/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await br.newPage();
const d=await pg.evaluate(()=>{const out={};
 {const S=6,OX=300,OY=-25,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#ff00ff';x.fillRect(0,0,1536,1024);
  const R=(X,Y,w,h)=>[(X-OX)*S,(Y-OY)*S,w*S,h*S];
  x.strokeStyle='#ff8a00';x.lineWidth=10;x.strokeRect((356-OX)*S-5,-10,1536,(140-OY)*S+5+10);
  x.strokeStyle='#00ffff';x.lineWidth=6;x.beginPath();x.moveTo(0,(0-OY)*S);x.lineTo(1536,(0-OY)*S);x.moveTo((512-OX)*S,0);x.lineTo((512-OX)*S,1024);x.stroke();
  x.setLineDash([24,14]);x.strokeStyle='#ffffff';x.lineWidth=6;x.strokeRect(...R(356,20,150,120));
  x.strokeStyle='#3fff6a';x.strokeRect(...R(336,32,16,144));x.setLineDash([]);
  x.strokeStyle='#ff0000';x.lineWidth=8;x.strokeRect(...R(386,50,60,60));
  x.strokeStyle='#ffff00';x.lineWidth=6;for(const X of [366,486]){x.beginPath();x.arc((X-OX)*S,(116-OY)*S,7*S,0,2*Math.PI);x.stroke();}
  out.body=c.toDataURL().split(',')[1];}
 {const S=3,TS=16,c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#283040';x.fillRect(0,0,1536,1024);   // 深灰藍=整張都要畫太空(甲板下方也是,坑洞看得到)
  x.fillStyle='#909090';x.fillRect(0,0,TS*S,1024);x.fillRect(496*S,0,TS*S,1024);
  x.fillStyle='#00ffff';x.fillRect(TS*S,224*S-3,480*S,6);
  const dash=(X,Y,w,h,col,lw)=>{x.setLineDash([18,10]);x.strokeStyle=col;x.lineWidth=lw||6;x.strokeRect(X*S,Y*S,w*S,h*S);x.setLineDash([]);};
  for(const m of [0,1]){const f=(c0,c1)=>m?[31-c1,31-c0]:[c0,c1];   // 平台與繩梯,翻轉後左右鏡像
    for(const [c0,c1,r] of [[4,10,10],[14,20,8],[23,28,11]]){const [a,b]=f(c0,c1);dash(a*TS,r*TS,(b-a+1)*TS,6,'#ffffff',4);}
    for(const [cx,r0,r1] of [[12,2,13],[21,2,10]]){const [a]=f(cx,cx);dash(a*TS,r0*TS,TS,(r1-r0+1)*TS,'#ffffff',4);}}
  dash(356,0,156,140,'#ff8a00',8);
  dash(24,8,300,100,'#7ad0ff',8);
  out.arena=c.toDataURL().split(',')[1];}
 return out;});
const fs=require('fs');fs.writeFileSync(__dirname+'/../boss9-body-template.png',Buffer.from(d.body,'base64'));fs.writeFileSync(__dirname+'/../boss9-arena-template.png',Buffer.from(d.arena,'base64'));await br.close();})();
