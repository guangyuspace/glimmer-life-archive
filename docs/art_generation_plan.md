# 微光 Web MVP 美術生成規劃

## 核心問題

原本的分鏡像是各自獨立生成，導致外公在不同畫面裡不像同一個人慢慢變老。新版美術流程要先建立「同一個主角」的角色聖經，再生成分鏡。

## 美術方向

- 形式：直式 9:16 互動繪本分鏡，適合手機網頁。
- 風格：手繪電影感、淡墨線稿、低飽和水彩、少量暖金色微光。
- 色彩：戰火與病榻偏冷灰，家庭記憶偏暖金，結尾回到近乎全黑。
- 臉部策略：不追求真人照片精準複製，追求「同一位東亞男性」在不同年齡的連續性。
- 生成策略：先生成角色參考圖，再用同一張參考圖做每一張分鏡的角色約束。

## 主角角色聖經

固定特徵：

- 江西出生的東亞男性。
- 眉骨略明顯，眉尾微下垂。
- 鼻梁偏寬，鼻頭圓鈍。
- 右耳略外張。
- 左眉尾附近有一顆很淡的小痣。
- 嘴唇偏薄，沉默時嘴角自然下壓。
- 少年時眼睛明亮，晚年眼皮鬆、眼神變慢，但骨相不變。

年齡階段：

- 嬰兒：圓臉，五官只保留眉眼與耳型暗示。
- 12 到 13 歲：瘦小、眼睛亮、軍服過大。
- 20 到 30 歲：下顎變清楚，軍醫時期乾淨、緊繃。
- 50 到 60 歲：臉開始鬆，眼神變柔，家庭段落最溫暖。
- 70 到 89 歲：皺紋加深，眼窩下陷，手部老繭明顯。

## 生成流程

1. 先生成 `character_reference_grandfather.png`。
2. 再生成 `age_sheet_grandfather.png`，包含少年、青年、中年、晚年四個頭像。
3. 每張 panel 都用同一份角色參考圖作為 reference。
4. 每張 prompt 都重複固定特徵，不只寫「same person」。
5. 每次生成後先做臉部 QA：眉骨、鼻梁、右耳、左眉尾淡痣、嘴形是否一致。

## 目前參考圖

- `D:\微光\art\reference\character_reference_grandfather.png`
- `D:\微光\art\reference\age_sheet_grandfather.png`

這兩張已作為新版 panel 生成的主角基準。正式 panel 不要直接覆蓋舊版 `stories/story_001/panel_*.png`，先輸出到 `D:\微光\art\panels_v2\` 做 QA，通過後再接入 Web 故事資料。

## 目前新版分鏡

- `D:\微光\art\panels_v2\panel_001.png` 到 `panel_018.png` 已全部生成。
- Web 版已優先讀取 `art/panels_v2`，缺圖才回退到舊版 `stories/story_001`。
- 下一步是手機瀏覽器完整播放 QA，不是繼續盲目重抽。

## 共用 Prompt 前綴

Use the same fictional East Asian male protagonist from the provided character reference, consistent facial structure across all ages: slightly prominent brow ridge, gently downturned eyebrow tails, broad nose bridge with rounded nose tip, slightly protruding right ear, very faint small mole near the outer end of the left eyebrow, thin lips with a naturally downturned resting mouth. Vertical 9:16 cinematic illustrated picture book panel, hand drawn ink linework, muted watercolor wash, subtle warm golden glimmer, quiet emotional realism, no text, no speech bubbles, no UI, no photorealism.

## Negative Prompt

different face, different ethnicity, celebrity likeness, modern fashion in historical scenes, extra fingers, distorted hands, unreadable face, exaggerated anime eyes, glossy 3D render, text, watermark, logo, speech bubble, random protagonist replacement.

## Panel 生成提示詞

### panel_001

Infant version of the protagonist in a dim rural Jiangxi room, an empty cradle space implying his absent mother, grandmother's hands barely visible near the bedding, wartime dusk outside a small window, lonely and tender, keep the facial hints from the protagonist reference in baby form.

### panel_002

Sick child version of the protagonist with fever on a simple bed, a Japanese military medic in uniform gently offering medicine and a small candy, villagers in the background trading eggs and grain, moral ambiguity in wartime, quiet tension rather than action.

### panel_003

Young protagonist remembering the candy years later, split emotional composition with a small candy glowing in his palm and distant village smoke behind him, expression confused and thoughtful, same face as the child grown slightly older.

### panel_004

Twelve year old protagonist in an oversized military uniform operating a heavy machine gun, older soldiers helping carry the weapon, battlefield chaos around him, his bright eyes and small body emphasized, same fixed facial markers.

### panel_005

The young protagonist frozen in shock as a taller comrade falls beside him, mud and smoke, no gore emphasis, the boy's face clearly visible with the same brow, nose, ear, and mouth structure.

### panel_006

Retreat road full of abandoned aid trucks, empty weapons, scattered supplies, exhausted soldiers moving away, the small protagonist in oversized uniform looking lost among adult silhouettes.

### panel_007

Rainy black night, feverish young protagonist sleeping beside wild graves on muddy ground, morning gray light beginning at the horizon, his face dirty but recognizable, a moment of survival and loneliness.

### panel_008

Young adult protagonist in military medical training, wearing simple military school clothing, holding a medical book and looking uncertain but determined, same protagonist now with clearer jawline.

### panel_009

Matsu island storm at night, young military doctor protagonist holding a surgical knife in a makeshift operating room, wind and rain outside, patient on bed, pressure and courage, face consistent with reference.

### panel_010

After the emergency surgery, young doctor protagonist exhausted but relieved under weak lamp light, medical tools nearby, subtle warm glimmer on his hand, same face and thin lips.

### panel_011

Military camp scene, protagonist as deputy company commander looking at an empty dog bowl, a cold mess table in the distance implying the conflict with his commander, restrained grief and anger, no graphic depiction.

### panel_012

1987 return to Jiangxi, middle aged to older protagonist meeting his white haired brother after forty years, both embracing and crying near an old family home, protagonist's aging face still matching the reference.

### panel_013

1995 warm family room, sixty year old protagonist holding a one month old grandson on his birthday, soft golden light, his face gentle and proud, facial structure consistent with younger panels.

### panel_014

Older protagonist walking two small children to kindergarten, one child in each hand, ordinary Taiwanese street morning, quiet happiness, his posture protective and slightly tired.

### panel_015

2003 SARS era, older protagonist holding a telephone, hearing his brother is critically ill across the strait, room dim, travel documents or calendar nearby, sorrow and helplessness, same elderly face.

### panel_016

Late life memory fading, elderly protagonist sitting in a chair with fragmented household objects around him, wife and adult son caring for him softly, composition slightly blurred but his face remains recognizable.

### panel_017

Care institution farewell, very old protagonist in a wheelchair, adult son standing nearby with tired shoulders, no blame, only exhaustion and love, hands emphasized with age spots and calluses.

### panel_018

Final hospital bedside close-up of the protagonist's old hand slowly relaxing, the same hand that once held a machine gun, surgical knife, taxi steering wheel, and grandchild, black surrounding space, minimal warm glimmer, solemn and tender.

## 美術 QA 表

| 檢查項目 | 通過標準 |
|---|---|
| 主角臉部 | 眉骨、鼻梁、右耳、左眉尾淡痣、薄唇至少三項可辨識 |
| 年齡連續性 | 每一階段像同一人自然老化，不像換演員 |
| 服裝年代 | 軍服、醫療場景、家庭場景符合大致年代 |
| 手部 | 晚年手部不可畸形，panel_018 必須重抽到自然 |
| 情緒 | 不做誇張表情，維持安靜、克制、真實 |
| 版面 | 9:16，可在手機上看清主體 |
