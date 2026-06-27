const CONFIG = {
  storyUrl: "../stories/story_001/story_001.json",
  endingAudioUrl: "../audio/piano_ending.ogg",
  v2PanelBasePath: "../art/panels_v2/",
  typewriterCharactersPerSecond: 28,
  holdSeconds: 1.5,
  wipeDistance: 140,
  imageFadeMs: 260,
  endingBlackSeconds: 3,
  endingTextFadeMs: 7500,
};

const URL_PARAMS = new URLSearchParams(window.location.search);
const QA_MODE = URL_PARAMS.has("qa") || URL_PARAMS.has("debug");

if (QA_MODE) {
  Object.assign(CONFIG, {
    typewriterCharactersPerSecond: 900,
    holdSeconds: 0.25,
    wipeDistance: 36,
    imageFadeMs: 40,
    endingBlackSeconds: 0.5,
    endingTextFadeMs: 900,
  });
}

const ENDING_TEXT = `你剛剛度過的，
是真實存在的微光。
他叫【外公的名字】，西元 1936 年出生於江西，2025 年 12 月 18 日逝世於台灣。

他用盡一生的流離與汗水，在鞋廠、在鋼鐵廠、在計程車上，
為他的兒女、以及在 1995 年被他抱在懷裡滿月的大外孫，
撐起了一片長達數十年的無雨晴空。

歷史書上的一行字，往往是某個人波瀾壯闊的一生。
謝謝你，走過我外公的人生。

如果此刻，你想起了誰，請別把那份想念留到太晚。
去靠近他，去陪他吃一頓飯，
去握住那雙曾經牽過你的手。
每一段來得及的陪伴，
都是生命裡還亮著的微光。`;

const $ = (selector) => document.querySelector(selector);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const nodes = {
  archiveScreen: $("#archiveScreen"),
  storyScreen: $("#storyScreen"),
  endingScreen: $("#endingScreen"),
  archiveTitle: $("#archiveTitle"),
  archiveHint: $("#archiveHint"),
  archiveError: $("#archiveError"),
  memoryOrb: $("#memoryOrb"),
  storyStage: $("#storyStage"),
  panelFrame: $("#panelFrame"),
  panelImage: $("#panelImage"),
  panelPlaceholder: $("#panelPlaceholder"),
  chapterLabel: $("#chapterLabel"),
  storyText: $("#storyText"),
  interactionPrompt: $("#interactionPrompt"),
  holdMeter: $("#holdMeter"),
  holdFill: $("#holdFill"),
  endingCopy: $("#endingCopy"),
  writeStoryButton: $("#writeStoryButton"),
};

const state = {
  story: null,
  sceneIndex: -1,
  currentScene: null,
  locked: false,
  typing: false,
  typingToken: 0,
  holdStart: 0,
  holdFrame: 0,
  wipeStart: null,
  mode: "archive",
};

init();

async function init() {
  try {
    state.story = await loadStory();
    nodes.archiveTitle.textContent = `微光：${state.story.title || "撐傘的人"}`;
  } catch (error) {
    nodes.archiveHint.textContent = "";
    nodes.archiveError.textContent = "故事資料讀取失敗。請用本機伺服器開啟 D:\\微光\\web。";
    console.error(error);
    return;
  }

  if (QA_MODE) {
    buildQaBadge();
    document.addEventListener("keydown", onQaKeyDown);
  }

  nodes.memoryOrb.addEventListener("click", startStory);
  nodes.storyStage.addEventListener("pointerdown", onStoryPointerDown);
  nodes.storyStage.addEventListener("pointermove", onStoryPointerMove);
  nodes.storyStage.addEventListener("pointerup", onStoryPointerUp);
  nodes.storyStage.addEventListener("pointercancel", onStoryPointerUp);
}

async function loadStory() {
  const response = await fetch(CONFIG.storyUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Cannot load story: ${response.status}`);
  }

  const story = await response.json();
  if (!story || !Array.isArray(story.scenes) || story.scenes.length === 0) {
    throw new Error("Story JSON needs a non-empty scenes array.");
  }

  return story;
}

function startStory() {
  if (state.mode !== "archive") return;

  state.mode = "story";
  nodes.archiveScreen.classList.add("hidden");
  nodes.storyScreen.classList.remove("hidden");
  showScene(0);
}

async function showScene(index) {
  if (index < 0 || index >= state.story.scenes.length) {
    startEnding();
    return;
  }

  const scene = state.story.scenes[index];
  state.sceneIndex = index;
  state.currentScene = scene;
  state.locked = true;
  resetInteraction();
  stopTyping();

  nodes.chapterLabel.textContent = scene.chapter || "";
  nodes.storyText.textContent = "";
  nodes.storyText.scrollTop = 0;
  nodes.interactionPrompt.textContent = "";
  updateQaBadge();

  await transitionImage(getPanelCandidates(scene.image || ""));
  state.locked = false;
  startTypewriter(String(scene.text || ""));
  updatePrompt();
}

async function transitionImage(srcCandidates) {
  nodes.panelFrame.classList.add("is-fading");
  await wait(CONFIG.imageFadeMs);

  await setImage(srcCandidates);

  nodes.panelFrame.classList.remove("is-fading");
  await wait(CONFIG.imageFadeMs);
}

async function setImage(srcCandidates) {
  const candidates = Array.isArray(srcCandidates) ? srcCandidates : [srcCandidates];
  for (const src of candidates) {
    if (!src) continue;
    const loaded = await trySetImage(src);
    if (loaded) return;
  }

  showPlaceholder();
}

function trySetImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      nodes.panelImage.src = src;
      nodes.panelPlaceholder.classList.add("is-hidden");
      resolve(true);
    };
    image.onerror = () => {
      resolve(false);
    };
    image.src = src;
  });
}

function showPlaceholder() {
  nodes.panelImage.removeAttribute("src");
  nodes.panelPlaceholder.classList.remove("is-hidden");
}

function normalizeAssetPath(path) {
  return path.replace(/^res:\/\//, "../");
}

function getPanelCandidates(originalPath) {
  const normalized = normalizeAssetPath(originalPath);
  const match = normalized.match(/panel_\d+\.png$/);
  if (!match) {
    return [normalized];
  }

  return [`${CONFIG.v2PanelBasePath}${match[0]}`, normalized];
}

async function startTypewriter(text) {
  const token = ++state.typingToken;
  state.typing = true;
  nodes.storyText.textContent = "";

  for (let i = 0; i < text.length; i += 1) {
    if (token !== state.typingToken) {
      return;
    }

    nodes.storyText.textContent = text.slice(0, i + 1);
    await wait(characterDelay(text[i]));
  }

  if (token === state.typingToken) {
    state.typing = false;
  }
}

function characterDelay(character) {
  const base = 1000 / CONFIG.typewriterCharactersPerSecond;
  if ("，、,".includes(character)) return base + 80;
  if ("。！？；.!?;".includes(character)) return base + 180;
  if (character === "\n") return base + 150;
  return base;
}

function skipTypewriter() {
  state.typingToken += 1;
  state.typing = false;
  nodes.storyText.textContent = String(state.currentScene?.text || "");
  nodes.storyText.scrollTop = 0;
}

function stopTyping() {
  state.typingToken += 1;
  state.typing = false;
}

function updatePrompt() {
  const interaction = state.currentScene?.interaction || "tap";
  if (interaction === "hold") {
    nodes.interactionPrompt.textContent = "按住，直到這一刻過去";
  } else if (interaction === "wipe") {
    nodes.interactionPrompt.textContent = "輕輕擦去眼前的模糊";
  } else {
    nodes.interactionPrompt.textContent = "輕觸，讓故事繼續";
  }
}

function onStoryPointerDown(event) {
  if (state.mode !== "story" || state.locked || !state.currentScene) return;
  event.preventDefault();

  if (state.typing) {
    skipTypewriter();
    return;
  }

  const interaction = state.currentScene.interaction || "tap";
  if (interaction === "tap") {
    completeInteraction();
  } else if (interaction === "hold") {
    startHold();
  } else if (interaction === "wipe") {
    state.wipeStart = { x: event.clientX, y: event.clientY };
  } else {
    completeInteraction();
  }
}

function onStoryPointerMove(event) {
  if (state.mode !== "story" || state.locked || !state.wipeStart) return;

  const dx = event.clientX - state.wipeStart.x;
  const dy = event.clientY - state.wipeStart.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= CONFIG.wipeDistance) {
    resetInteraction();
    completeInteraction();
  }
}

function onStoryPointerUp() {
  resetInteraction();
}

function startHold() {
  state.holdStart = performance.now();
  nodes.holdMeter.classList.add("is-visible");
  nodes.holdFill.style.width = "0%";
  cancelAnimationFrame(state.holdFrame);
  state.holdFrame = requestAnimationFrame(tickHold);
}

function tickHold(now) {
  if (!state.holdStart || state.locked) return;

  const progress = Math.min(1, (now - state.holdStart) / (CONFIG.holdSeconds * 1000));
  nodes.holdFill.style.width = `${progress * 100}%`;

  if (progress >= 1) {
    resetInteraction();
    completeInteraction();
    return;
  }

  state.holdFrame = requestAnimationFrame(tickHold);
}

function resetInteraction() {
  state.wipeStart = null;
  state.holdStart = 0;
  cancelAnimationFrame(state.holdFrame);
  nodes.holdMeter.classList.remove("is-visible");
  nodes.holdFill.style.width = "0%";
}

function completeInteraction() {
  if (state.locked) return;

  if (state.currentScene?.ending === true) {
    startEnding();
    return;
  }

  showScene(state.sceneIndex + 1);
}

function buildQaBadge() {
  const badge = document.createElement("div");
  badge.id = "qaBadge";
  badge.className = "qa-badge";
  badge.textContent = "QA";
  document.body.appendChild(badge);
  nodes.qaBadge = badge;
}

function updateQaBadge() {
  if (!QA_MODE || !nodes.qaBadge || !state.story) return;

  const total = state.story.scenes.length;
  const current = Math.max(0, state.sceneIndex + 1);
  const interaction = state.currentScene?.interaction || "tap";
  nodes.qaBadge.textContent = `QA ${current}/${total} ${interaction}`;
}

function onQaKeyDown(event) {
  if (event.key === "Enter" && state.mode === "archive") {
    startStory();
    return;
  }

  if (state.mode !== "story") return;

  if (event.key === "ArrowRight") {
    stopTyping();
    resetInteraction();
    showScene(state.sceneIndex + 1);
  } else if (event.key === "e" || event.key === "E") {
    startEnding();
  } else if (event.key === " " || event.key === "Enter") {
    if (state.typing) {
      skipTypewriter();
    } else {
      completeInteraction();
    }
  }
}

async function startEnding() {
  if (state.mode === "ending") return;

  state.mode = "ending";
  state.locked = true;
  stopTyping();
  resetInteraction();

  nodes.storyScreen.classList.add("hidden");
  nodes.endingScreen.classList.remove("hidden");
  nodes.endingCopy.textContent = ENDING_TEXT;
  nodes.endingCopy.classList.remove("is-visible");
  nodes.writeStoryButton.classList.remove("is-visible");

  tryPlayEndingAudio();

  await wait(CONFIG.endingBlackSeconds * 1000);
  nodes.endingCopy.classList.add("is-visible");
  await wait(CONFIG.endingTextFadeMs + 500);
  nodes.writeStoryButton.classList.add("is-visible");
}

async function tryPlayEndingAudio() {
  try {
    const response = await fetch(CONFIG.endingAudioUrl, { method: "HEAD", cache: "no-store" });
    if (!response.ok) return;

    const audio = new Audio(CONFIG.endingAudioUrl);
    audio.volume = 0.56;
    await audio.play();
  } catch (_error) {
    // Browsers may block autoplay or the file may not exist in the MVP.
  }
}
