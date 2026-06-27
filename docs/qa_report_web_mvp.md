# QA Report: 微光 Web MVP

## Build / Context

- Target: `D:\微光\web`
- URL: `http://127.0.0.1:5173/web/`
- QA URL: `http://127.0.0.1:5173/web/?qa=1`
- Mobile archive screenshot: `D:\微光\docs\qa_archive_mobile.png`
- Three mobile archive screenshot: `D:\微光\docs\qa_three_mobile.png`
- Three desktop archive screenshot: `D:\微光\docs\qa_three_desktop.png`
- Mobile story screenshot: `D:\微光\docs\qa_story_mobile.png`
- Story registry: `D:\微光\stories\stories.json`
- Story: `D:\微光\stories\story_001\story_001.json`
- Art: `D:\微光\art\panels_v2\panel_001.png` to `panel_018.png`
- Opening art: `D:\微光\art\ui\archive_opening.png`

## Automated Checks

- `node --check D:\微光\web\app.js`: passed.
- `node --check D:\微光\web\qa-check-registry.mjs`: passed.
- `node --check D:\微光\web\qa-archive-flow.mjs`: passed.
- `node --check D:\微光\web\qa-three-render.mjs`: passed.
- `node D:\微光\web\qa-check-registry.mjs`: passed.
- `node D:\微光\web\qa-archive-flow.mjs`: passed.
- `node D:\微光\web\qa-three-render.mjs`: passed.
- Headless Edge mobile screenshot at 390x844: passed; archive background, title, orb, start button, status, and experience panel render without obvious overlap.
- Headless Edge Three.js QA at 390x844: passed; WebGL canvas was nonblank, animation frames advanced, pointer movement updated Three state, and mobile/desktop screenshots were generated.
- Headless Edge story UI QA: passed; starting the story renders scene progress, prompt text, and mobile story screenshot.
- Ending copy updated to identify the protagonist as the author's grandfather.
- Ending CTA button text updated to `留下你的故事`; Threads URL points to `https://www.threads.net/@seruence_decipher`.
- Mobile portrait layout updated so story panels use full-image containment instead of crop-to-fill.
- Story panel CSS now uses a 9:16 portrait frame with `object-fit: contain` foreground art and a soft blurred background fill.

Automated QA confirms:

- Story contains 18 scenes.
- Story registry contains 1 entry and is extensible.
- Opening archive background exists and is reachable over the local server.
- Three.js archive canvas layer is present, styled, and initialized with graceful fallback.
- Story scene progress UI and wipe trace layer are present.
- Every scene has valid `tap`, `hold`, or `wipe` interaction.
- Last scene has `ending=true`.
- 18 v2 panels exist.
- 18 v2 panels are portrait images.
- 18 fallback panels exist.
- Local server can load:
  - `/web/`
  - `/web/?qa=1`
  - `/web/?qa=1&resetProgress=1`
  - `/stories/stories.json`
  - `/stories/story_001/story_001.json`
  - `/art/panels_v2/panel_018.png`
  - `/art/ui/archive_opening.png`
- Archive flow model confirms:
  - random start selects only unplayed stories
  - played stories are excluded after participation
  - played stories remain in experiences and can be replayed
  - completion status persists in experiences
- Three render QA confirms:
  - `archiveThree` canvas renders nonblank pixels
  - animation frames advance
  - pointer movement updates Three.js state
  - story progress UI renders after `開始`

## Manual QA Checklist

Use `http://127.0.0.1:5173/web/?qa=1` for fast testing.

- Archive opens with the memory orb and no visible error text.
- Archive opening art appears behind the orb without harming text/button readability.
- Three.js memory particles animate subtly behind the archive UI.
- Click/tap memory orb or `開始` starts a random unplayed story.
- Started stories appear in the experience list.
- Stories in the experience list can be clicked to replay.
- Previously played stories are not selected by random start again.
- Panels 1 to 18 load from the v2 art set.
- Tap scenes advance only after typewriter text is complete, unless the first tap is used to skip text.
- Hold scenes advance after a short hold in QA mode.
- Wipe scenes advance after a short drag in QA mode.
- Wipe scenes show a visible trace while dragging.
- Final scene transitions to black screen.
- Ending text fades in.
- `回到檔案館` button appears and returns to the archive.
- `留下你的故事` button appears and opens the Threads story submission URL.

## Visual QA Checklist

- 外公從少年、青年、中年到晚年像同一個人自然老化。
- `panel_013` 的 60 歲抱滿月情緒是否足夠明亮。
- `panel_016` 的失智表現是否溫柔、不恐怖化。
- `panel_018` 的手部是否自然，並能接住黑屏結尾。
- 手機直式畫面中，圖片主體是否被文字區遮掉。
- 手機直式畫面中，圖片是否完整顯示，沒有被框裁掉。

## Findings

- No automated blocking issues found.
- Multi-story registry path and first story entry passed automated checks.
- Browser automation was previously blocked by the Windows sandbox, so visual QA still requires manual browser review.

## Release Readiness

Ready for manual visual QA, not yet ready for public release.
