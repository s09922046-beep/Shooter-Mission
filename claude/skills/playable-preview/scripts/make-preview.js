#!/usr/bin/env node
// 產生「可操作預覽頁」:複製來源網頁,注入方案程式與一條控制列,輸出成另一個檔案(來源檔不動)。
// 用法:node make-preview.js <來源.html> <variants.js> <輸出.html> [額外控制列.html]
// variants.js 的約定:
//   window.__PV={names:['現行','A …','B …'],mode:0};   // names[0] 一律是現行做法,當對照組
//   之後以覆寫函式等方式,依 __PV.mode 切換行為;可選 __PV.onChange=i=>{…}(切換時呼叫一次)
// 額外控制列(可省略):一段 HTML(可含 <script>),放專案專屬的按鈕,例如跳到某個畫面、無敵、慢動作。
const fs=require('fs'),path=require('path');
const [src,vjs,out,extra]=process.argv.slice(2);
if(!src||!vjs||!out){console.log('用法:node make-preview.js <來源.html> <variants.js> <輸出.html> [額外控制列.html]');process.exit(1);}
if(path.resolve(src)===path.resolve(out)){console.log('輸出檔不可與來源檔相同');process.exit(1);}
let s=fs.readFileSync(src,'utf8');
const bar=`
<div id="pvBar" style="position:fixed;left:0;top:0;right:0;z-index:2147483647;background:#0b0f18f0;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:5px 8px;display:flex;flex-wrap:wrap;gap:5px;align-items:center">
 <b>預覽頁(未定案)</b><span>方案(F6/F7 切換,F4 收起控制列):</span><span id="pvM"></span>
 ${extra?fs.readFileSync(extra,'utf8'):''}
</div>
<div id="pvTag" style="position:fixed;right:6px;bottom:6px;z-index:2147483647;background:#0b0f18d0;color:#ffd23a;font:14px 'Microsoft JhengHei',sans-serif;padding:3px 8px"></div>
<script>
${fs.readFileSync(vjs,'utf8')}
</script>
<script>
(()=>{if(!window.__PV||!Array.isArray(window.__PV.names)){document.getElementById('pvTag').textContent='variants.js 沒有設定 window.__PV';return;}
  const bar=document.getElementById('pvBar'),m=document.getElementById('pvM'),tag=document.getElementById('pvTag');
  function ref(){m.innerHTML=__PV.names.map((n,i)=>'<button data-pv="'+i+'" style="'+(i===__PV.mode?'background:#ffd23a;color:#000':'')+'">'+n+'</button>').join('');tag.textContent='方案:'+__PV.names[__PV.mode];}
  window.pvSet=function(i){const n=__PV.names.length;__PV.mode=((i%n)+n)%n;if(__PV.onChange)__PV.onChange(__PV.mode);ref();};
  bar.addEventListener('click',e=>{const b=e.target.closest('button[data-pv]');if(!b)return;b.blur();pvSet(+b.dataset.pv);});
  addEventListener('keydown',e=>{if(e.code==='F4'){e.preventDefault();bar.style.display=bar.style.display==='none'?'flex':'none';}
    else if(e.code==='F6'){e.preventDefault();pvSet(__PV.mode-1);}else if(e.code==='F7'){e.preventDefault();pvSet(__PV.mode+1);}});
  __PV.mode=__PV.mode||0;ref();
})();
</script>
`;
const i=s.toLowerCase().lastIndexOf('</body>');
s=i<0?s+bar:s.slice(0,i)+bar+s.slice(i);
fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,s);
console.log('已存',path.resolve(out));
