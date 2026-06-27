# CODEX_HANDOFF

## Project Goal

《微光》要從 Godot MVP 轉為可在瀏覽器執行的互動繪本網頁遊戲。核心需求：可擴充任意故事、開始時隨機進入未參與故事、參與過故事保留在經歷中可重播、UI 更精緻且手機直式可用。

## Current Phase

- Phase: Web MVP rebuild
- Status: Multi-story registry, experience replay flow, mobile portrait story layout, generated archive art, Three.js archive animation, improved story interaction UI, and GitHub Pages deployment are implemented.

## Deployment

- Repository: `https://github.com/guangyuspace/glimmer-life-archive`
- Public URL: `https://guangyuspace.github.io/glimmer-life-archive/`
- Pages source: `main` branch, `/`
- Initial deploy commit: `151084d6c1b4a3c3f974755db962300b3dde7571`

## Latest Completed Work

- 新增 `web/index.html`、`web/styles.css`、`web/main.js`。
- Web 版讀取既有 `stories/story_001/story_001.json`。
- Web 版支援生命檔案館、分鏡淡入淡出、打字機文字、tap、hold、wipe、3 秒黑屏結尾、結尾文字與「寫下你的故事」按鈕。
- 新增 `docs/art_generation_plan.md`，定義同一主角跨年齡生成流程與 18 張 panel prompt。
- 生成並保存新版外公角色參考圖與年齡表。
- 生成並保存新版候選分鏡 `panel_001.png` 到 `panel_003.png`。
- Web 播放器已改為優先讀取 `art/panels_v2`，缺圖時自動回退到舊版 `stories/story_001`。
- 生成並保存新版候選分鏡 `panel_004.png` 到 `panel_018.png`。
- `art/panels_v2` 現在共 18 張新版候選分鏡，Web 版會完整使用新版圖。
- 新增 Web QA 模式 `?qa=1`，可加速打字機、hold、黑屏與結尾淡入。
- 新增 `web/qa-check.mjs` 自動檢查故事資料、圖片與本機路徑。
- 新增 `docs/qa_report_web_mvp.md` 紀錄 QA 狀態與人工檢查清單。
- 修正手機直式版面：故事圖改為完整顯示，不再使用會裁切主體的 cover 模式。
- 下方文字區改為自適應高度，避免擠壓圖片。
- 新增 `stories/stories.json` 作為可擴充故事庫。
- 新增 `web/app.js` 作為正式 Web 入口，支援隨機未參與故事、localStorage 經歷紀錄、經歷重播。
- 開場 UI 改為記憶球、開始鈕、經歷列表與剩餘故事狀態。
- 結尾新增「回到檔案館」按鈕，讓玩家完成故事後能回到經歷列表重播。
- 新增 `web/qa-check-registry.mjs` 驗證故事庫、故事資料、v2 圖、fallback 圖與 HTTP 路徑。
- 修正故事播放版面為 9:16 直式手機 frame，前景圖使用完整顯示，並用同圖霧化背景填滿空間，避免被框裁切的觀感。
- `web/qa-check-registry.mjs` 追加檢查：CSS 必須保留 9:16 與 `object-fit: contain`，v2 panel 必須是直式圖。
- 生成開場生命檔案館背景並接到 Archive UI：`art/ui/archive_opening.png`。
- 新增 `web/qa-archive-flow.mjs`，用 fake DOM 執行正式 `app.js`，驗證隨機未參與故事、已參與排除、經歷重播、完成狀態保存。
- 新增 Three.js 開場動態層：`archiveThree` canvas 會載入 Three module，渲染漂浮記憶光點與低亮度軌道；WebGL/CDN 失敗時退回靜態背景。
- 重新設計故事播放互動 UI：新增幕數進度列、hold 面板光暈、wipe 擦拭軌跡、互動提示 ready 狀態。
- 新增 `web/qa-three-render.mjs`，用 headless Edge/CDP 驗證 Three canvas 非空、動畫 frame 增加、pointermove 有反應，並輸出手機/桌面 archive 截圖與手機 story 截圖。
- 更新結尾文案，主角描述改為「作者的外公」，並將 CTA 文案改為「留下你的故事」。
- 新增 `CONFIG.storySubmissionUrl` 與 `openStorySubmission()`，`留下你的故事` 會開新分頁到 `https://www.threads.com/@sequence_decipher/post/DaGLBlDk2wv?xmt=AQG0faSW_PjmGVgk2x5q2ppXS1BGRpCsoXumdnXMM85-yMo9jGTk7gnrmvRXsdDiRMbN402n&slof=1`。
- 新增 GitHub Pages 根入口 `index.html` 與 `.nojekyll`，根網址會跳到 `web/`。
- 建立公開 GitHub repo `guangyuspace/glimmer-life-archive`，啟用 GitHub Pages。

## Important Modified Files

- `D:\微光\web\index.html`
- `D:\微光\web\styles.css`
- `D:\微光\web\app.js`
- `D:\微光\web\main.js`
- `D:\微光\web\qa-check.mjs`
- `D:\微光\web\qa-check-registry.mjs`
- `D:\微光\web\qa-archive-flow.mjs`
- `D:\微光\web\qa-three-render.mjs`
- `D:\微光\web\README.md`
- `D:\微光\stories\stories.json`
- `D:\微光\docs\art_generation_plan.md`
- `D:\微光\docs\qa_report_web_mvp.md`
- `D:\微光\art\reference\character_reference_grandfather.png`
- `D:\微光\art\reference\age_sheet_grandfather.png`
- `D:\微光\art\reference\README.md`
- `D:\微光\art\panels_v2\panel_001.png`
- `D:\微光\art\panels_v2\panel_002.png`
- `D:\微光\art\panels_v2\panel_003.png`
- `D:\微光\art\panels_v2\panel_004.png` through `panel_018.png`
- `D:\微光\art\panels_v2\README.md`
- `D:\微光\art\ui\archive_opening.png`
- `D:\微光\docs\qa_archive_mobile.png`
- `D:\微光\docs\qa_three_mobile.png`
- `D:\微光\docs\qa_three_desktop.png`
- `D:\微光\docs\qa_story_mobile.png`
- `D:\微光\CODEX_HANDOFF.md`
- `D:\微光\scripts\TypewriterText.gd`

## Verification

- Command: `node --check D:\微光\web\main.js`
- Result: Passed.
- Command: `Invoke-WebRequest http://127.0.0.1:5173/web/`
- Result: HTTP 200.
- Command: `Invoke-WebRequest http://127.0.0.1:5173/stories/story_001/story_001.json`
- Result: HTTP 200.
- Command: `Invoke-WebRequest http://127.0.0.1:5173/stories/story_001/panel_001.png`
- Result: HTTP 200.
- Command: `node --check D:\微光\web\main.js`
- Result: Passed after v2 panel integration.
- Command: `Invoke-WebRequest http://127.0.0.1:5173/web/`
- Result: HTTP 200 after v2 panel generation.
- Command: `Invoke-WebRequest http://127.0.0.1:5173/art/panels_v2/panel_018.png`
- Result: HTTP 200.
- Command: Count files in `D:\微光\art\panels_v2\panel_*.png`
- Result: `panel_count=18`.
- Command: `node D:\微光\web\qa-check.mjs`
- Result: Passed. Story scenes, v2 panels, fallback panels, and local HTTP paths are valid.
- Command: `node --check D:\微光\web\app.js`
- Result: Passed.
- Command: `node D:\微光\web\qa-check-registry.mjs`
- Result: Passed. Registry entries, total scenes, story JSON, v2 portrait panels, fallback panels, mobile portrait CSS requirements, and HTTP paths are valid.
- Command: `Invoke-WebRequest http://127.0.0.1:5173/web/?qa=1&resetProgress=1`
- Result: HTTP 200.
- Command: `node --check D:\微光\web\qa-check-registry.mjs`
- Result: Passed.
- Command: `node --check D:\微光\web\qa-archive-flow.mjs`
- Result: Passed.
- Command: `node D:\微光\web\qa-check-registry.mjs`
- Result: Passed. Registry entries, total scenes, story JSON, v2 portrait panels, fallback panels, mobile portrait CSS requirements, archive opening art, and HTTP paths are valid.
- Command: `node D:\微光\web\qa-archive-flow.mjs`
- Result: Passed. Random start selects only unplayed stories; played stories are excluded and retained in experiences; experience replay increments play count; completion status persists.
- Command: `node --check D:\微光\web\qa-three-render.mjs`
- Result: Passed.
- Command: `node D:\微光\web\qa-three-render.mjs`
- Result: Passed. Three canvas was nonblank, animation frames advanced, pointer movement updated Three.js state, story progress UI rendered after start, and screenshots were written to `docs/qa_three_mobile.png`, `docs/qa_three_desktop.png`, `docs/qa_story_mobile.png`.
- Command: Headless Edge screenshot `390x844` to `D:\微光\docs\qa_archive_mobile.png`
- Result: Passed. Archive background, title, orb, start button, status, and experience panel render without obvious overlap.
- Command: `gh api repos/guangyuspace/glimmer-life-archive/pages/builds/latest`
- Result: Passed. GitHub Pages build `1067166868` status was `built`, commit `151084d6c1b4a3c3f974755db962300b3dde7571`.
- Command: `Invoke-WebRequest https://guangyuspace.github.io/glimmer-life-archive/`
- Result: HTTP 200.
- Command: `Invoke-WebRequest https://guangyuspace.github.io/glimmer-life-archive/web/?qa=1&resetProgress=1`
- Result: HTTP 200.
- Command: `Invoke-WebRequest https://guangyuspace.github.io/glimmer-life-archive/stories/stories.json`
- Result: HTTP 200.
- Command: `Invoke-WebRequest https://guangyuspace.github.io/glimmer-life-archive/art/ui/archive_opening.png`
- Result: HTTP 200.
- Browser automation: Playwright was previously blocked, but headless Edge/CDP QA now works for archive/story visual smoke checks.

## Known Risks

- The current Web panel images are v2 candidates and still benefit from human story-by-story visual QA on a real phone.
- Random/exclude/replay behavior is covered by `qa-archive-flow.mjs`; manual browser interaction QA is still recommended for actual DOM/touch behavior.
- `piano_ending.ogg` is optional and may not exist yet.
- Browser autoplay may block ending audio depending on user gesture policy.
- Three.js is loaded from a pinned jsDelivr URL; if the CDN or WebGL is unavailable, the page falls back to the static archive art.
- Manual browser smoke test is still recommended for real touch feel and full story playback, although headless Edge now covers archive/story visual smoke checks.

## Next Safest Task

Run manual interaction QA on `https://guangyuspace.github.io/glimmer-life-archive/`: complete the story, confirm ending copy, click `留下你的故事` opens Threads, test tap/hold/wipe on a real phone, and review all 18 panels for emotional/art continuity.
