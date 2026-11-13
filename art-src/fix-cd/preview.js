// 抓蟲 c、d 預覽頁產生器(11/13):複製 index.html 並注入 inject.js 與控制列 → preview/fix-cd.html(不提交)
// 用法:node art-src/fix-cd/preview.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'inject.js'),'utf8');
const bar=`
<div id="pv" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18ee;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>抓蟲 c、d 預覽(工作版)</b>
 <span>第 10 關小關:</span><button data-s="1">1</button><button data-s="2">2</button><button data-s="3">3</button><button data-s="4">4</button>
 <span>| 配色(可疊加):</span><button data-c="A">A 背景退後</button><button data-c="B">B 地面前推</button><button data-c="C">C 深色外緣</button>
 <span>| 火焰:</span><button data-f="0">0 現行</button><button data-f="1">1 火團流</button><button data-f="2">2 撕裂舌焰</button><button data-f="3">3 短噴流加舔焰</button>
 <span>等級:</span><button data-l="1">Lv1</button><button data-l="2">Lv2</button><button data-l="3">Lv3</button><button data-l="4">Lv4</button>
 <button id="pvAuto"></button><button id="pvInv"></button><span>速度:</span><button data-sp="1">正常</button><button data-sp="4">1/4</button><button id="pvQ">畫質切換</button>
 <span id="pvSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">方向鍵移動、↑ 往上或斜上噴、X 跳。自動噴火開著時不用按射擊鍵。配色只作用在第 10 關一般小關;火焰各等級顏色照現行(Lv1 橘、Lv3 藍、Lv4 白藍),火焰判定範圍不變。</div>
</div>
<script>
${js}
</script>
`;
s=s.replace('</body>',bar+'</body>');
fs.mkdirSync(path.join(root,'preview'),{recursive:true});fs.writeFileSync(path.join(root,'preview/fix-cd.html'),s);console.log('已存 preview/fix-cd.html');
