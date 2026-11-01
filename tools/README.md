# tools

開發用的無頭瀏覽器測試工具,遊戲執行時不會載入這個資料夾。

需要 Node 18 以上、`playwright` 套件與 Chrome。在 repo 根目錄執行:

| 指令 | 用途 |
|---|---|
| `node tools/harness.js smoke` | 50 小關 × 三種武器各跑一段,檢查執行錯誤 |
| `node tools/harness.js special` | 特攻功能檢查(一般關清空與回充、各魔王扣血、6 王選單、7 王、4 王隱身、登場禁用) |
| `node tools/harness.js bench <舊檔> <新檔> [輪數]` | 繪圖時間相對比較(沙盒數字,不能代替測試機) |
| `node tools/harness.js shot <大關> <小關> <幀數> <輸出.png> [特攻 0/1]` | 截一張遊戲畫面 |
| `node tools/harness.js sheet <小關> <low/high> <輸出.png> [檔案] [FX設定]` | 10 大關同一小關拼成 5×2 對照圖(每格 512×288);FX 設定如 `q=high`,用於預覽期切換方案;`seed=N` 固定亂數,新舊版可用同一批地圖對照 |
| `node tools/harness.js vshift <每關種子數> <輸出前綴> [檔案] [FX設定]` | 視野壓力測試(v0.9):固定種子生成大量一般小關,輸出地表高度統計與每大關地形最低段落的對照圖 |

檔案參數省略時測試 repo 根目錄的 `index.html`。Chrome 不在 `/usr/bin/google-chrome` 時,用環境變數 `CHROME` 指定。

改版時若新增需要驗證的行為,直接在 `harness.js` 加子指令,不另寫一次性腳本。
