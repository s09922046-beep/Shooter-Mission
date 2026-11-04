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
| `node tools/harness.js vshift <每關種子數> <輸出前綴> [檔案] [FX設定]` | 視野壓力測試(v0.9):固定種子生成大量一般小關,輸出地表高度統計與每大關地形最低段落的對照圖 |

檔案參數省略時測試 repo 根目錄的 `index.html`。Chrome 預設路徑:Windows `C:\Program Files\Google\Chrome\Application\chrome.exe`、macOS `/Applications/Google Chrome.app`、Linux `/usr/bin/google-chrome`;不在預設位置時,用環境變數 `CHROME` 指定。

改版時若新增需要驗證的行為,直接在 `harness.js` 加子指令,不另寫一次性腳本。
