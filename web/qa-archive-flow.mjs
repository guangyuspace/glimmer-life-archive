import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const webDir = path.dirname(__filename);
const appSource = await readFile(path.join(webDir, "app.js"), "utf8");

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  toggle(value, force) {
    const shouldAdd = force === undefined ? !this.values.has(value) : Boolean(force);
    if (shouldAdd) {
      this.add(value);
    } else {
      this.remove(value);
    }
    return shouldAdd;
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.children = [];
    this.dataset = {};
    this.className = "";
    this._textContent = "";
    this.innerHTML = "";
    this.disabled = false;
    this.scrollTop = 0;
    this.classList = new FakeClassList();
    this.style = {
      setProperty: (name, value) => {
        this.style[name] = value;
      },
      removeProperty: (name) => {
        delete this.style[name];
      },
    };
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener() {}

  removeAttribute(name) {
    delete this[name];
  }

  closest(selector) {
    if (selector === "[data-story-id]" && this.dataset.storyId) return this;
    return null;
  }
}

const ids = [
  "archiveScreen",
  "archiveThree",
  "storyScreen",
  "endingScreen",
  "archiveTitle",
  "archiveSubtitle",
  "archiveHint",
  "archiveStatus",
  "archiveError",
  "memoryOrb",
  "startRandomButton",
  "experienceCount",
  "experienceList",
  "storyStage",
  "panelFrame",
  "panelImage",
  "wipeTrace",
  "panelPlaceholder",
  "sceneCounter",
  "sceneProgressFill",
  "chapterLabel",
  "storyText",
  "interactionPrompt",
  "holdMeter",
  "holdFill",
  "endingCopy",
  "returnArchiveButton",
  "writeStoryButton",
];

const elements = Object.fromEntries(ids.map((id) => [`#${id}`, new FakeElement(id)]));
const storage = new Map();

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function story(id) {
  return {
    id,
    title: `故事 ${id}`,
    period: "測試年代",
    path: `../stories/${id}/${id}.json`,
    panelBasePath: "../art/panels_v2/",
    fallbackPanelBasePath: `../stories/${id}/`,
  };
}

const registry = { stories: [story("story_A"), story("story_B"), story("story_C")] };
const tinyStory = {
  scenes: [
    {
      image: "res://stories/story_001/panel_001.png",
      text: "測試",
      interaction: "tap",
      ending: true,
    },
  ],
};

const fakeMath = Object.create(Math);
fakeMath.random = () => 0;

const context = {
  console,
  Math: fakeMath,
  Date,
  performance: { now: () => Date.now() },
  setTimeout,
  clearTimeout,
  requestAnimationFrame: (callback) => setTimeout(() => callback(Date.now()), 0),
  cancelAnimationFrame: clearTimeout,
  URLSearchParams,
  window: { location: { search: "?qa=1" } },
  document: {
    body: new FakeElement("body"),
    querySelector: (selector) => elements[selector] || new FakeElement(selector),
    createElement: (tagName) => new FakeElement(tagName),
    addEventListener() {},
  },
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
  fetch: async (url) => ({
    ok: true,
    status: 200,
    json: async () => (String(url).includes("stories.json") ? registry : tinyStory),
  }),
  Image: class {
    set src(value) {
      this._src = value;
      setTimeout(() => this.onload?.(), 0);
    }
  },
  Audio: class {
    constructor(src) {
      this.src = src;
      this.volume = 1;
    }

    async play() {}
  },
};

vm.runInNewContext(
  `${appSource}\nglobalThis.__qa = { state, nodes, startRandomStory, returnToArchive, onExperienceClick, getRecord, markCompleted, renderArchive };`,
  context,
);

await wait(5);
assert.equal(context.__qa.state.library.length, 3);
assert.equal(elements["#archiveStatus"].textContent, "尚有 3 段未參與");

for (const expectedId of ["story_A", "story_B", "story_C"]) {
  context.__qa.startRandomStory();
  await wait(10);
  assert.equal(context.__qa.state.storyMeta.id, expectedId);
  assert.ok(context.__qa.getRecord(expectedId));
  context.__qa.returnToArchive();
}

assert.equal(elements["#archiveStatus"].textContent, "尚有 0 段未參與");
assert.equal(elements["#startRandomButton"].disabled, true);
assert.equal(elements["#memoryOrb"].disabled, true);
assert.equal(elements["#experienceList"].children.length, 3);

const replayCard = elements["#experienceList"].children[0];
const replayId = replayCard.dataset.storyId;
const beforeReplay = context.__qa.getRecord(replayId).playCount;
context.__qa.onExperienceClick({ target: replayCard });
await wait(10);

assert.equal(context.__qa.state.mode, "story");
assert.equal(context.__qa.state.storyMeta.id, replayId);
assert.equal(context.__qa.getRecord(replayId).playCount, beforeReplay + 1);

context.__qa.markCompleted(replayId);
context.__qa.returnToArchive();
assert.match(elements["#experienceList"].children[0].innerHTML, /已完成/);

console.log("Archive flow QA passed:");
console.log("- random start selects only unplayed stories");
console.log("- played stories are excluded after participation");
console.log("- played stories remain in experiences and can be replayed");
console.log("- completion status persists in experiences");
