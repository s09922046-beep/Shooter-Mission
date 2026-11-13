// 子彈光暈與火焰剪影預覽頁產生器(11/14):複製 index.html 並注入 inject.js 與控制列 → preview/glow-burn.html(不提交)
// 用法:node art-src/glow-burn/preview.js [輸出檔 b=光暈方案 f=火焰方案](後三個參數只供 harness 截圖:指定預設方案)
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'inject.js'),'utf8');
const out=process.argv[2]||path.join(root,'preview/glow-burn.html'),b=+(process.argv[3]||2),f=+(process.argv[4]||2);
const W=[1,2,3,4,5,6,7,8,9,10].map(w=>`<option value="${w}"${w===3?' selected':''}>第 ${w} 大關</option>`).join('');
const S=[1,2,3,4,5].map(n=>`<option value="${n}"${n===2?' selected':''}>${n===5?'魔王':'第 '+n+' 小關'}</option>`).join('');
const bar=`
<div id="pv" style="position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0f18ee;color:#cfe;font:13px 'Microsoft JhengHei',sans-serif;padding:6px 8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
 <b>子彈光暈與火焰剪影預覽(工作版)</b>
 <select id="pvW">${W}</select><select id="pvS">${S}</select><button id="pvRe">重來</button>
 <span>| 武器:</span><button data-wp="smg">衝鋒槍</button><button data-wp="shot">散彈</button><button data-wp="flame">火焰</button>
 <button data-l="1">Lv1</button><button data-l="2">Lv2</button><button data-l="3">Lv3</button><button data-l="4">Lv4</button>
 <div style="width:100%;height:0"></div>
 <span>子彈光暈(鍵 0~4):</span><button data-b="0">0 現行 v0.33</button><button data-b="1">1 v0.32 方框</button><button data-b="2">2 像素光暈</button><button data-b="3">3 平滑光暈</button><button data-b="4">4 無光暈</button>
 <div style="width:100%;height:0"></div>
 <span>火焰(Shift+0~9):</span><button data-f="0">0 現行 v0.34</button><button data-f="1">1 整個回 v0.28</button><button data-f="2">2 火團+錐內全剪影</button><button data-f="3">3 火團加寬</button>
 <span>| 2 再加:</span><button data-f="4">4 剪影上層</button><button data-f="5">5 尾段整層半透明 0.55</button><button data-f="6">6 尾段整層半透明 0.35</button><button data-f="7">7 外框上層</button><button data-f="8">8 = 5+7</button><button data-f="9">9 尾段火團縮小</button>
 <div style="width:100%;height:0"></div>
 <button id="pvAuto"></button><button id="pvInv"></button><span>速度:</span><button data-sp="1">正常</button><button data-sp="4">1/4</button><button id="pvQ">畫質切換</button>
 <span id="pvSt" style="color:#8ab"></span>
 <div style="width:100%;color:#9ab;font-size:12px">方向鍵移動、X 跳;自動開火開著時不用按射擊鍵。F4 收起控制列。光暈方案敵我子彈共用,可到第 10 大關或魔王看密集彈幕。火焰傷害範圍(判定錐)四案都一樣,只差畫法。</div>
</div>
<script>
window.PVDEF={b:${b},f:${f}};
${js}
</script>
`;
s=s.replace('</body>',bar+'</body>');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,s);console.log('已存',out);
