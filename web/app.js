const CONFIG = {
  registryUrl: "../stories/stories.json",
  endingAudioUrl: "../audio/piano_ending.ogg",
  threeModuleUrl: "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
  storySubmissionUrl: "https://www.threads.com/@sequence_decipher/post/DaGLBlDk2wv?xmt=AQG0faSW_PjmGVgk2x5q2ppXS1BGRpCsoXumdnXMM85-yMo9jGTk7gnrmvRXsdDiRMbN402n&slof=1",
  progressStorageKey: "glimmer_archive_progress_v1",
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
他是作者的外公，西元 1936 年出生於江西，2025 年 12 月 18 日逝世於台灣。

他用盡一生的流離與汗水，在戰場、鞋廠、在鋼鐵廠、在計程車上，
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
  archiveThree: $("#archiveThree"),
  storyScreen: $("#storyScreen"),
  endingScreen: $("#endingScreen"),
  archiveTitle: $("#archiveTitle"),
  archiveSubtitle: $("#archiveSubtitle"),
  archiveHint: $("#archiveHint"),
  archiveStatus: $("#archiveStatus"),
  archiveError: $("#archiveError"),
  memoryOrb: $("#memoryOrb"),
  startRandomButton: $("#startRandomButton"),
  experienceCount: $("#experienceCount"),
  experienceList: $("#experienceList"),
  storyStage: $("#storyStage"),
  panelFrame: $("#panelFrame"),
  panelImage: $("#panelImage"),
  wipeTrace: $("#wipeTrace"),
  panelPlaceholder: $("#panelPlaceholder"),
  sceneCounter: $("#sceneCounter"),
  sceneProgressFill: $("#sceneProgressFill"),
  chapterLabel: $("#chapterLabel"),
  storyText: $("#storyText"),
  interactionPrompt: $("#interactionPrompt"),
  holdMeter: $("#holdMeter"),
  holdFill: $("#holdFill"),
  endingCopy: $("#endingCopy"),
  returnArchiveButton: $("#returnArchiveButton"),
  writeStoryButton: $("#writeStoryButton"),
};

const state = {
  library: [],
  storyCache: new Map(),
  progress: { version: 1, records: {}, order: [] },
  story: null,
  storyMeta: null,
  sceneIndex: -1,
  currentScene: null,
  locked: false,
  typing: false,
  typingToken: 0,
  holdStart: 0,
  holdFrame: 0,
  wipeStart: null,
  mode: "archive",
  archiveThree: null,
};

init();

async function init() {
  if (URL_PARAMS.has("resetProgress")) {
    localStorage.removeItem(CONFIG.progressStorageKey);
  }

  try {
    state.progress = loadProgress();
    state.library = await loadStoryRegistry();
    renderArchive();
  } catch (error) {
    nodes.archiveStatus.textContent = "";
    nodes.archiveHint.textContent = "";
    nodes.archiveError.textContent = "故事庫讀取失敗。請用本機伺服器開啟 D:\\微光\\web。";
    console.error(error);
    return;
  }

  if (QA_MODE) {
    buildQaBadge();
    document.addEventListener("keydown", onQaKeyDown);
  }

  nodes.memoryOrb.addEventListener("click", startRandomStory);
  nodes.startRandomButton.addEventListener("click", startRandomStory);
  nodes.archiveScreen.addEventListener("pointermove", onArchivePointerMove);
  nodes.returnArchiveButton.addEventListener("click", returnToArchive);
  nodes.writeStoryButton.addEventListener("click", openStorySubmission);
  nodes.experienceList.addEventListener("click", onExperienceClick);
  nodes.storyStage.addEventListener("pointerdown", onStoryPointerDown);
  nodes.storyStage.addEventListener("pointermove", onStoryPointerMove);
  nodes.storyStage.addEventListener("pointerup", onStoryPointerUp);
  nodes.storyStage.addEventListener("pointercancel", onStoryPointerUp);
  initArchiveThree();
}

async function initArchiveThree() {
  if (!nodes.archiveThree || !window.WebGLRenderingContext) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  let THREE;
  try {
    THREE = await import(CONFIG.threeModuleUrl);
  } catch (error) {
    console.warn("Three.js archive layer disabled.", error);
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas: nodes.archiveThree,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.z = 14;

  const archiveGroup = new THREE.Group();
  scene.add(archiveGroup);

  const pointCount = 260;
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);
  for (let i = 0; i < pointCount; i += 1) {
    const radius = 3.4 + Math.random() * 8.5;
    const angle = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 13;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius - 5;

    const warm = Math.random() > 0.55;
    colors[i * 3] = warm ? 1.0 : 0.42;
    colors[i * 3 + 1] = warm ? 0.76 : 0.78;
    colors[i * 3 + 2] = warm ? 0.42 : 1.0;
  }

  const particles = new THREE.BufferGeometry();
  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  archiveGroup.add(new THREE.Points(
    particles,
    new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  ));

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9bd78,
    transparent: true,
    opacity: 0.075,
    wireframe: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rings = [];
  [0.58, 0.84, 1.12].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008, 8, 96), ringMaterial);
    ring.position.y = 0.45;
    ring.rotation.x = 1.08 + index * 0.26;
    ring.rotation.y = index * 0.42;
    archiveGroup.add(ring);
    rings.push(ring);
  });

  state.archiveThree = {
    renderer,
    scene,
    camera,
    archiveGroup,
    rings,
    pointer: { x: 0, y: 0 },
    pulse: 0,
    frame: 0,
  };
  window.__glimmerThreeReady = true;
  window.__glimmerThreeFrames = 0;
  window.__glimmerThreePointer = { x: 0, y: 0 };

  resizeArchiveThree();
  window.addEventListener("resize", resizeArchiveThree);
  animateArchiveThree();
}

function resizeArchiveThree() {
  const layer = state.archiveThree;
  if (!layer) return;

  const width = nodes.archiveThree.clientWidth || window.innerWidth;
  const height = nodes.archiveThree.clientHeight || window.innerHeight;
  layer.renderer.setSize(width, height, false);
  layer.camera.aspect = width / Math.max(1, height);
  layer.camera.updateProjectionMatrix();
}

function animateArchiveThree(now = 0) {
  const layer = state.archiveThree;
  if (!layer) return;

  const time = now * 0.001;
  layer.archiveGroup.rotation.y = time * 0.045 + layer.pointer.x * 0.08;
  layer.archiveGroup.rotation.x = layer.pointer.y * 0.035;
  layer.camera.position.x += (layer.pointer.x * 0.42 - layer.camera.position.x) * 0.035;
  layer.camera.position.y += (-layer.pointer.y * 0.22 - layer.camera.position.y) * 0.035;
  layer.camera.lookAt(0, 0, 0);

  const pulse = layer.pulse;
  layer.rings.forEach((ring, index) => {
    ring.rotation.z += 0.0018 + index * 0.0008;
    const scale = 1 + Math.sin(time * 1.4 + index) * 0.02 + pulse * 0.13;
    ring.scale.setScalar(scale);
  });
  layer.pulse *= 0.92;

  layer.renderer.render(layer.scene, layer.camera);
  window.__glimmerThreeFrames += 1;
  layer.frame = requestAnimationFrame(animateArchiveThree);
}

function onArchivePointerMove(event) {
  const layer = state.archiveThree;
  if (!layer || state.mode !== "archive") return;

  const rect = nodes.archiveScreen.getBoundingClientRect();
  layer.pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
  layer.pointer.y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
  window.__glimmerThreePointer = { x: layer.pointer.x, y: layer.pointer.y };
}

function pulseArchiveThree() {
  if (state.archiveThree) {
    state.archiveThree.pulse = 1;
  }
}

async function loadStoryRegistry() {
  const response = await fetch(CONFIG.registryUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Cannot load story registry: ${response.status}`);
  }

  const registry = await response.json();
  if (!registry || !Array.isArray(registry.stories) || registry.stories.length === 0) {
    throw new Error("stories.json needs a non-empty stories array.");
  }

  registry.stories.forEach((story, index) => {
    if (!story.id || !story.path) {
      throw new Error(`stories.json item ${index + 1} needs id and path.`);
    }
  });

  return registry.stories;
}

async function loadStory(meta) {
  if (state.storyCache.has(meta.id)) {
    return state.storyCache.get(meta.id);
  }

  const response = await fetch(meta.path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Cannot load story ${meta.id}: ${response.status}`);
  }

  const story = await response.json();
  if (!story || !Array.isArray(story.scenes) || story.scenes.length === 0) {
    throw new Error(`${meta.id} needs a non-empty scenes array.`);
  }

  state.storyCache.set(meta.id, story);
  return story;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(CONFIG.progressStorageKey);
    if (!raw) return { version: 1, records: {}, order: [] };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { version: 1, records: {}, order: [] };
    }

    return {
      version: 1,
      records: parsed.records && typeof parsed.records === "object" ? parsed.records : {},
      order: Array.isArray(parsed.order) ? parsed.order : Object.keys(parsed.records || {}),
    };
  } catch (_error) {
    return { version: 1, records: {}, order: [] };
  }
}

function saveProgress() {
  localStorage.setItem(CONFIG.progressStorageKey, JSON.stringify(state.progress));
}

function getRecord(storyId) {
  return state.progress.records[storyId] || null;
}

function markExperienced(storyId) {
  const now = new Date().toISOString();
  const existing = getRecord(storyId);

  if (!existing) {
    state.progress.records[storyId] = {
      firstPlayedAt: now,
      lastPlayedAt: now,
      completedAt: null,
      playCount: 1,
    };
    state.progress.order.unshift(storyId);
  } else {
    existing.lastPlayedAt = now;
    existing.playCount = Number(existing.playCount || 0) + 1;
  }

  saveProgress();
}

function markCompleted(storyId) {
  const record = getRecord(storyId);
  if (!record) return;

  record.completedAt = new Date().toISOString();
  saveProgress();
}

function renderArchive() {
  nodes.archiveTitle.textContent = "微光";
  nodes.archiveSubtitle.textContent = "每一次開始，都會走進一段未曾參與的人生。";
  nodes.archiveError.textContent = "";
  renderArchiveStatus();
  renderExperiences();
}

function renderArchiveStatus() {
  const total = state.library.length;
  const experienced = state.library.filter((story) => getRecord(story.id)).length;
  const remaining = total - experienced;

  nodes.experienceCount.textContent = String(experienced);
  nodes.archiveStatus.textContent = `尚有 ${remaining} 段未參與`;

  if (remaining <= 0) {
    nodes.startRandomButton.disabled = true;
    nodes.memoryOrb.disabled = true;
    nodes.startRandomButton.textContent = "暫無新的故事";
    nodes.archiveHint.textContent = "已參與的故事會保留在經歷中，可直接重播。";
  } else {
    nodes.startRandomButton.disabled = false;
    nodes.memoryOrb.disabled = false;
    nodes.startRandomButton.textContent = "開始";
    nodes.archiveHint.textContent = "系統會從未參與的故事中隨機抽選。";
  }
}

function renderExperiences() {
  const experiencedIds = state.progress.order.filter((id) => getRecord(id));
  nodes.experienceList.textContent = "";

  if (experiencedIds.length === 0) {
    const empty = document.createElement("p");
    empty.className = "experience-empty";
    empty.textContent = "尚未留下經歷";
    nodes.experienceList.appendChild(empty);
    return;
  }

  experiencedIds.forEach((storyId) => {
    const meta = state.library.find((story) => story.id === storyId);
    if (!meta) return;

    const record = getRecord(storyId);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "experience-card";
    card.dataset.storyId = storyId;
    card.innerHTML = `
      <span class="experience-card-main">
        <strong>${escapeHtml(meta.title || storyId)}</strong>
        <small>${escapeHtml(meta.period || meta.protagonist || "")}</small>
      </span>
      <span class="experience-card-status">${record.completedAt ? "已完成" : "已參與"}</span>
    `;
    nodes.experienceList.appendChild(card);
  });
}

function onExperienceClick(event) {
  const card = event.target.closest("[data-story-id]");
  if (!card) return;

  const meta = state.library.find((story) => story.id === card.dataset.storyId);
  if (meta) {
    beginStory(meta);
  }
}

function startRandomStory() {
  if (state.mode !== "archive") return;
  pulseArchiveThree();

  const candidates = state.library.filter((story) => !getRecord(story.id));
  if (candidates.length === 0) {
    renderArchiveStatus();
    return;
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  beginStory(selected);
}

async function beginStory(meta) {
  if (state.mode !== "archive") return;

  try {
    state.storyMeta = meta;
    state.story = await loadStory(meta);
    markExperienced(meta.id);
    renderArchive();
    state.mode = "story";
    nodes.archiveScreen.classList.add("hidden");
    nodes.endingScreen.classList.add("hidden");
    nodes.storyScreen.classList.remove("hidden");
    showScene(0);
  } catch (error) {
    nodes.archiveError.textContent = `故事讀取失敗：${meta.title || meta.id}`;
    console.error(error);
  }
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

  nodes.chapterLabel.textContent = scene.chapter || state.storyMeta?.title || "";
  nodes.storyText.textContent = "";
  nodes.storyText.scrollTop = 0;
  nodes.interactionPrompt.textContent = "";
  setPromptReady(false);
  updateSceneProgress(index);
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
      nodes.panelFrame.style.setProperty("--panel-image", `url("${src}")`);
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
  nodes.panelFrame.style.removeProperty("--panel-image");
  nodes.panelPlaceholder.classList.remove("is-hidden");
}

function normalizeAssetPath(assetPath) {
  return assetPath.replace(/^res:\/\//, "../");
}

function joinAssetPath(basePath, fileName) {
  if (!basePath || !fileName) return "";
  return `${basePath.replace(/\/?$/, "/")}${fileName}`;
}

function getPanelCandidates(originalPath) {
  const normalized = normalizeAssetPath(String(originalPath || ""));
  const fileName = normalized.split("/").pop();
  const candidates = [];

  if (fileName && /^panel_\d+\.png$/i.test(fileName)) {
    candidates.push(joinAssetPath(state.storyMeta?.panelBasePath, fileName));
    candidates.push(joinAssetPath(state.storyMeta?.fallbackPanelBasePath, fileName));
  }

  candidates.push(normalized);
  return [...new Set(candidates.filter(Boolean))];
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
    setPromptReady(true);
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
  setPromptReady(true);
}

function stopTyping() {
  state.typingToken += 1;
  state.typing = false;
}

function updatePrompt() {
  const interaction = state.currentScene?.interaction || "tap";
  setPromptReady(false);
  if (interaction === "hold") {
    nodes.interactionPrompt.textContent = "按住，直到這一刻過去";
  } else if (interaction === "wipe") {
    nodes.interactionPrompt.textContent = "輕輕擦去眼前的模糊";
  } else {
    nodes.interactionPrompt.textContent = "輕觸，讓故事繼續";
  }
}

function setPromptReady(isReady) {
  nodes.interactionPrompt.classList.toggle("is-ready", Boolean(isReady));
}

function updateSceneProgress(index) {
  const total = state.story?.scenes?.length || 1;
  const current = Math.min(total, Math.max(1, index + 1));
  nodes.sceneCounter.textContent = `${current} / ${total}`;
  nodes.sceneProgressFill.style.width = `${(current / total) * 100}%`;
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
    updateWipeTrace(event.clientX, event.clientY, 0);
  } else {
    completeInteraction();
  }
}

function onStoryPointerMove(event) {
  if (state.mode !== "story" || state.locked || !state.wipeStart) return;

  const dx = event.clientX - state.wipeStart.x;
  const dy = event.clientY - state.wipeStart.y;
  const distance = Math.hypot(dx, dy);
  updateWipeTrace(event.clientX, event.clientY, Math.atan2(dy, dx));
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
  nodes.panelFrame.classList.add("is-holding");
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
  nodes.panelFrame.classList.remove("is-holding");
  nodes.wipeTrace.classList.remove("is-visible");
  nodes.holdMeter.classList.remove("is-visible");
  nodes.holdFill.style.width = "0%";
}

function updateWipeTrace(clientX, clientY, angle) {
  const rect = nodes.panelFrame.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
  const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
  nodes.wipeTrace.style.setProperty("--wipe-x", `${Math.max(0, Math.min(100, x))}%`);
  nodes.wipeTrace.style.setProperty("--wipe-y", `${Math.max(0, Math.min(100, y))}%`);
  nodes.wipeTrace.style.setProperty("--wipe-angle", `${angle}rad`);
  nodes.wipeTrace.classList.add("is-visible");
}

function completeInteraction() {
  if (state.locked) return;
  setPromptReady(false);

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
  nodes.qaBadge.textContent = `QA ${state.storyMeta?.id || ""} ${current}/${total} ${interaction}`;
}

function onQaKeyDown(event) {
  if (event.key === "Enter" && state.mode === "archive") {
    startRandomStory();
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

  if (state.storyMeta?.id) {
    markCompleted(state.storyMeta.id);
  }

  state.mode = "ending";
  state.locked = true;
  stopTyping();
  resetInteraction();

  nodes.storyScreen.classList.add("hidden");
  nodes.endingScreen.classList.remove("hidden");
  nodes.endingCopy.textContent = ENDING_TEXT;
  nodes.endingCopy.classList.remove("is-visible");
  nodes.returnArchiveButton.classList.remove("is-visible");
  nodes.writeStoryButton.classList.remove("is-visible");

  tryPlayEndingAudio();

  await wait(CONFIG.endingBlackSeconds * 1000);
  nodes.endingCopy.classList.add("is-visible");
  await wait(CONFIG.endingTextFadeMs + 500);
  nodes.returnArchiveButton.classList.add("is-visible");
  nodes.writeStoryButton.classList.add("is-visible");
}

function returnToArchive() {
  stopTyping();
  resetInteraction();
  state.mode = "archive";
  state.story = null;
  state.storyMeta = null;
  state.sceneIndex = -1;
  state.currentScene = null;
  nodes.storyScreen.classList.add("hidden");
  nodes.endingScreen.classList.add("hidden");
  nodes.archiveScreen.classList.remove("hidden");
  renderArchive();
}

function openStorySubmission() {
  if (!CONFIG.storySubmissionUrl) return;
  window.open(CONFIG.storySubmissionUrl, "_blank", "noopener,noreferrer");
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
