# 微光新版分鏡候選圖

這個資料夾保存新版 Web MVP 使用的 18 張分鏡候選圖。

Web 播放器目前會優先讀取：

```text
D:\微光\art\panels_v2\panel_001.png
```

如果某張新版圖不存在，才會退回舊版：

```text
D:\微光\stories\story_001\panel_001.png
```

## 目前狀態

- `panel_001.png` 到 `panel_018.png` 已全部生成。
- 角色基準來自 `D:\微光\art\reference\character_reference_grandfather.png` 與 `age_sheet_grandfather.png`。
- 這批圖是候選版，下一步應進行完整手機瀏覽器 QA。

## QA 重點

- 主角從少年、青年、中年、晚年是否像同一人自然老化。
- 每張圖是否沒有文字、浮水印、UI 或奇怪符號。
- `panel_018.png` 的手部是否自然，因為它直接接 3 秒黑屏。
- 手機直式畫面中主體是否清楚，不被下方文字區搶走。
