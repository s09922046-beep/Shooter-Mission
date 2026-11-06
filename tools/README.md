# tools

開發用的無頭瀏覽器測試工具,遊戲執行時不會載入這個資料夾。

需要 Node 18 以上、`playwright` 套件與 Chrome。第一次使用先在 `tools/` 裡執行 `npm install` 安裝 playwright(裝在 `tools/node_modules/`,不提交)。測試指令在 repo 根目錄執行:

| 指令 | 用途 |
|---|---|
| `node tools/harness.js smoke` | 50 小關 × 三種武器各跑一段,檢查執行錯誤 |
| `node tools/harness.js special` | 特攻功能檢查(一般關清空與回充、各魔王扣血、6 王選單、7 王、4 王隱身、登場禁用) |
| `node tools/harness.js bench <舊檔> <新檔> [輪數]` | 繪圖時間相對比較(沙盒數字,不能代替測試機) |
| `node tools/harness.js shot <大關> <小關> <幀數> <輸出.png> [特攻 0/1]` | 截一張遊戲畫面(截圖前先把可見地面烘完,v0.10 修正:只跑 `update` 時地面快取來不及烘焙) |
| `node tools/harness.js sheet <小關> <low/high> <輸出.png> [檔案] [FX設定]` | 10 大關同一小關拼成 5×2 對照圖(每格 512×288);FX 設定如 `q=high`,用於預覽期切換方案;`seed=N` 固定亂數,新舊版可用同一批地圖對照 |
| `node tools/harness.js vine [種子數]` | 繩梯攀爬測試(v0.11):每條可攀欄段按鍵模擬,從底爬到頂、站上頂端、再爬回底部;一般小關固定種子,王關與 10 王第三型態另測 |
| `node tools/harness.js edraw <舊檔> <新檔> [次數]` | 雜兵繪製量測(v0.12):第 1~10 關各 16 隻(v0.13 加第 2、6 關,v0.14 加第 3、7 關,v0.15 加第 4、8 關,v0.16 加第 10 關)敵人排進畫面,量 `drawEnemies` 每次耗時(含鏡頭發光登記)與首次精靈烘焙時間;沙盒相對比較用 |
| `node tools/harness.js eface [檔案]` | 飛行兵與蜂懸停於主角正上方 600 幀,統計 `e.face` 翻轉次數與畫面朝向翻轉次數(v0.13,第 1、2、5、6、9 關;v0.14 加第 3、7 關;v0.15 加第 4、8 關;v0.16 加第 10 關) |
| `node tools/harness.js espr [檔案]` | 第 1~10 關各 1~4 小關跑 900 幀、魔王關 3600 幀(含召喚),統計畫面上找不到精靈的敵人(v0.16.1 移除 eRects 方塊備援後,缺精靈的敵人不會畫出來) |
| `node tools/harness.js boss [檔案]` | 魔王共用工具(v0.17):每隻魔王檢查登場鎖主角與血條填充、判定框在繪製前後不變、閃白與燒紅邊計時、核心狀態、死亡演出到傳送門、重挑縮短;另測四種預警樣式與 RotSprite;印出 bossRender 每次耗時(沙盒相對值) |
| `node tools/harness.js bshot <輸出.png> <warn/burn/hit/die/intro> [大關] [幀數] [檔案]` | 魔王共用工具截圖(v0.17):warn 四種預警各兩個進度,burn 燒紅邊,hit 閃白,die 死亡第 n 幀,intro 登場第 n 幀 |
| `node tools/harness.js strand <舊檔> <新檔> [輸出前綴]` | 藤蔓觸手與倒影(v0.18):舊新版同種子、同按鍵跑 3 王、10 王第 1~3 型態各 1800 幀,每 30 幀比對邏輯狀態(證明行為不變);檢查 3 王觸手可攀時外觀必定長滿、3 王倒影常駐、10 王第三型態倒影關閉;印出 stTiles、bRefl 耗時(沙盒相對值);給輸出前綴時另存 slam、retract、b10、b10p3 四張截圖 |
| `node tools/harness.js bpose <輸出.png> [大關] [檔案]` | 魔王姿勢截圖(v0.20):依 harness.js 內 BPOSE 表的情境(姿勢、朝向、核心狀態、受擊閃白)裁下魔王周圍拼圖;目前有 8 王 |
| `node tools/harness.js bseq <輸出.png> [大關] <登場幀列> <死亡幀列> [x,y,w,h] [檔案]` | 魔王登場與死亡逐幀截圖(v0.20):登場幀號為時間軸 t(0~299),死亡幀號為死亡後第 n 幀,逗號分隔;裁指定區域放大 3 倍 |
| `node tools/harness.js bclimb [大關] [欄] [l/r] [檔案]` | 王關爬繩梯到頂再往左或右跳,回報落腳處;8 王另測站在右上平台往上射命匣(v0.20) |
| `node tools/harness.js bjump [大關] [欄,欄...] [檔案]` | 王關站在地面某欄跳起並按住上,回報跳躍最高點與能否抓住繩梯(v0.20) |
| `node tools/harness.js b8ray <輸出.png> [檔案]` | 8 王死亡射線各階段截圖(預兆、預警、竄出),並印出射線判定框與預警幀數(v0.20) |
| `node tools/harness.js b8fx <輸出.png> [檔案]` | 8 王召喚、時間停滯、扇形彈特效截圖,並印出骷髏數、環狀彈數、停滯後彈速、扇形彈數與彈速(對照舊版程式)(v0.20) |
| `node tools/harness.js vshift <每關種子數> <輸出前綴> [檔案] [FX設定]` | 視野壓力測試(v0.9):固定種子生成大量一般小關,輸出地表高度統計與每大關地形最低段落的對照圖 |

檔案參數省略時測試 repo 根目錄的 `index.html`。Chrome 預設路徑:Windows `C:\Program Files\Google\Chrome\Application\chrome.exe`、macOS `/Applications/Google Chrome.app`、Linux `/usr/bin/google-chrome`;不在預設位置時,用環境變數 `CHROME` 指定。

改版時若新增需要驗證的行為,直接在 `harness.js` 加子指令,不另寫一次性腳本。
