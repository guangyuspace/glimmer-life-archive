# 微光 Web MVP

這是《微光》的網頁版 MVP。故事播放由故事庫 registry 驅動，第一個故事是《撐傘的人》。

- 故事庫：`D:\微光\stories\stories.json`
- 第一個故事：`D:\微光\stories\story_001\story_001.json`
- 圖片：`D:\微光\stories\story_001\panel_001.png` 到 `panel_018.png`
- 開場背景：`D:\微光\art\ui\archive_opening.png`

## 本機啟動

在 `D:\微光` 執行：

```powershell
py -3 -m http.server 5173 --bind 127.0.0.1
```

然後打開：

```text
http://127.0.0.1:5173/web/
```

## 目前流程

啟動後會進入生命檔案館。玩家按「開始」後，系統會從 `stories.json` 中隨機挑選一個尚未參與過的故事。

已參與過的故事會保存在瀏覽器 `localStorage`，不會再被隨機抽到，並會出現在「經歷」列表中供玩家重播。

故事播放時會依序顯示分鏡、打字機文字，以及 `tap`、`hold`、`wipe` 三種互動。最後一幕完成後進入 3 秒黑屏結尾，浮現結尾文字與「寫下你的故事」按鈕。

開場畫面使用 `art/ui/archive_opening.png` 作為生命檔案館背景，CSS 會套暗色遮罩，保留中央記憶球與下方經歷列表的可讀性。

開場也會動態載入 Three.js module，渲染漂浮記憶光點與記憶球周圍的低亮度軌道。若 CDN 或 WebGL 不可用，會自動退回靜態背景，不阻斷故事流程。

## 新增故事

新增故事時建立自己的資料夾與 JSON，例如：

```text
D:\微光\stories\story_002\story_002.json
```

再追加到：

```text
D:\微光\stories\stories.json
```

每筆故事至少需要：

```json
{
  "id": "story_002",
  "title": "故事標題",
  "path": "../stories/story_002/story_002.json",
  "panelBasePath": "../art/story_002_panels/",
  "fallbackPanelBasePath": "../stories/story_002/"
}
```

## 新版美術接法

播放器會優先讀取：

```text
D:\微光\art\panels_v2\panel_001.png
```

如果新版圖不存在，會自動退回：

```text
D:\微光\stories\story_001\panel_001.png
```

因此可以一張一張替換新版分鏡，不需要等 18 張全部完成才測試。

## QA 模式

快速測試網址：

```text
http://127.0.0.1:5173/web/?qa=1
```

QA 模式會加快打字機、縮短 hold、縮短黑屏與結尾淡入。正式網址不帶 `?qa=1` 時不受影響。

鍵盤快捷：

- `Enter`：在生命檔案館開始故事；故事中跳過文字或進下一幕
- `Space`：跳過文字或進下一幕
- `ArrowRight`：直接跳到下一幕
- `E`：直接進結尾

自動檢查：

```powershell
node D:\微光\web\qa-check-registry.mjs
node D:\微光\web\qa-archive-flow.mjs
node D:\微光\web\qa-three-render.mjs
```

## 手機直式顯示

故事圖片使用 9:16 直式 frame 與完整顯示模式，不會為了填滿框而裁切主體。載入成功時，同一張圖會作為低透明霧化背景填滿視覺空間，前景圖仍維持 `object-fit: contain`。

手機高度不足時，下方文字區會壓縮並可捲動，圖片仍維持完整可見。

故事播放 UI 會顯示目前幕數進度。Hold 互動會顯示蓄力條與面板光暈，wipe 互動會顯示擦拭軌跡。

## 後續部署

這份 Web MVP 是靜態網站。之後可以部署到 GitHub Pages、Netlify、Vercel 或一般靜態主機。部署時需要一起上傳 `web/`、`stories/`、`art/`、`audio/`。
