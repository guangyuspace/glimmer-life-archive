import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const webDir = path.dirname(__filename);
const rootDir = path.resolve(webDir, "..");
const validInteractions = new Set(["tap", "hold", "wipe"]);
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readPngSize(filePath) {
  const buffer = await readFile(filePath);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function resolveWebPath(webRelativePath) {
  return path.resolve(webDir, webRelativePath);
}

function joinAssetPath(basePath, fileName) {
  return path.resolve(webDir, `${basePath.replace(/\/?$/, "/")}${fileName}`);
}

async function checkHttp(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      fail(`${url} returned HTTP ${response.status}`);
      return;
    }
    notes.push(`${url} OK`);
  } catch (error) {
    fail(`${url} failed: ${error.message}`);
  }
}

const indexHtml = await readFile(path.join(webDir, "index.html"), "utf8");
if (!indexHtml.includes("./app.js")) {
  fail("index.html must load ./app.js");
}
if (!indexHtml.includes("留下你的故事")) {
  fail("ending story button must say 留下你的故事");
}
if (!indexHtml.includes("archive-art")) {
  fail("index.html must include the archive art background layer");
}
if (!indexHtml.includes("archiveThree")) {
  fail("index.html must include the Three.js archive canvas");
}
if (!indexHtml.includes("archiveWriteStoryButton")) {
  fail("index.html must include the archive story submission button");
}
if (!indexHtml.includes("scene-progress")) {
  fail("index.html must include the story scene progress UI");
}
if (!indexHtml.includes("wipeTrace")) {
  fail("index.html must include the wipe interaction visual layer");
}

const stylesCss = await readFile(path.join(webDir, "styles.css"), "utf8");
if (!stylesCss.includes("../art/ui/archive_opening.png")) {
  fail("styles.css must reference the archive opening art");
}
if (!stylesCss.includes(".archive-three")) {
  fail("styles.css must style the Three.js archive canvas");
}
if (!stylesCss.includes(".scene-progress")) {
  fail("styles.css must style the story progress UI");
}
if (!stylesCss.includes(".wipe-trace")) {
  fail("styles.css must style the wipe interaction trace");
}
if (!stylesCss.includes("aspect-ratio: 9 / 16")) {
  fail("styles.css must keep the story panel in a 9:16 portrait frame");
}
if (!stylesCss.includes("object-fit: contain")) {
  fail("styles.css must use object-fit: contain so panels are not cropped");
}

const appJs = await readFile(path.join(webDir, "app.js"), "utf8");
if (!appJs.includes("threeModuleUrl")) {
  fail("app.js must configure the Three.js module URL");
}
if (!appJs.includes("initArchiveThree")) {
  fail("app.js must initialize the Three.js archive layer");
}
if (!appJs.includes("updateSceneProgress")) {
  fail("app.js must update story progress UI");
}
if (!appJs.includes("updateWipeTrace")) {
  fail("app.js must update wipe interaction feedback");
}
if (!appJs.includes("他是作者的外公")) {
  fail("app.js must contain the revised ending text");
}
if (!appJs.includes("storySubmissionUrl")) {
  fail("app.js must expose a story submission URL setting");
}
if (!appJs.includes("https://www.threads.com/@sequence_decipher/post/DaGLBlDk2wv?xmt=AQG0faSW_PjmGVgk2x5q2ppXS1BGRpCsoXumdnXMM85-yMo9jGTk7gnrmvRXsdDiRMbN402n&slof=1")) {
  fail("app.js must wire the Threads story submission URL");
}
if (!appJs.includes("openStorySubmission")) {
  fail("app.js must wire the story submission button");
}
if (!appJs.includes("archiveWriteStoryButton.addEventListener(\"click\", openStorySubmission)")) {
  fail("archive story submission button must open the Threads URL");
}

const registry = await readJson(path.join(rootDir, "stories", "stories.json"));
if (!registry || !Array.isArray(registry.stories) || registry.stories.length === 0) {
  fail("stories.json must contain a non-empty stories array");
}

let totalSceneCount = 0;

for (const meta of registry.stories || []) {
  if (!meta.id || !meta.path) {
    fail("every story registry entry needs id and path");
    continue;
  }

  const storyPath = resolveWebPath(meta.path);
  if (!(await exists(storyPath))) {
    fail(`missing story json for ${meta.id}: ${storyPath}`);
    continue;
  }

  const story = await readJson(storyPath);
  if (!Array.isArray(story.scenes) || story.scenes.length === 0) {
    fail(`${meta.id} must contain a non-empty scenes array`);
    continue;
  }

  totalSceneCount += story.scenes.length;

  story.scenes.forEach((scene, index) => {
    const sceneNumber = index + 1;
    const expectedPanel = `panel_${String(sceneNumber).padStart(3, "0")}.png`;
    if (!scene.text || typeof scene.text !== "string") {
      fail(`${meta.id} scene ${sceneNumber} is missing text`);
    }
    if (!validInteractions.has(scene.interaction)) {
      fail(`${meta.id} scene ${sceneNumber} has invalid interaction: ${scene.interaction}`);
    }
    if (!scene.image || !scene.image.endsWith(expectedPanel)) {
      fail(`${meta.id} scene ${sceneNumber} image does not match ${expectedPanel}`);
    }
  });

  const last = story.scenes[story.scenes.length - 1];
  if (!last?.ending) {
    fail(`${meta.id} last scene must have ending=true`);
  }

  for (let i = 1; i <= story.scenes.length; i += 1) {
    const fileName = `panel_${String(i).padStart(3, "0")}.png`;
    if (meta.panelBasePath) {
      const panelPath = joinAssetPath(meta.panelBasePath, fileName);
      if (!(await exists(panelPath))) {
        fail(`missing v2 panel for ${meta.id}: ${fileName}`);
      } else {
        const size = await readPngSize(panelPath);
        if (size.height <= size.width) {
          fail(`v2 panel must be portrait for ${meta.id}: ${fileName} is ${size.width}x${size.height}`);
        }
      }
    }
    if (meta.fallbackPanelBasePath && !(await exists(joinAssetPath(meta.fallbackPanelBasePath, fileName)))) {
      fail(`missing fallback panel for ${meta.id}: ${fileName}`);
    }
  }
}

await checkHttp("http://127.0.0.1:5173/web/");
await checkHttp("http://127.0.0.1:5173/web/?qa=1");
await checkHttp("http://127.0.0.1:5173/web/?qa=1&resetProgress=1");
await checkHttp("http://127.0.0.1:5173/stories/stories.json");
await checkHttp("http://127.0.0.1:5173/stories/story_001/story_001.json");
await checkHttp("http://127.0.0.1:5173/art/panels_v2/panel_018.png");
await checkHttp("http://127.0.0.1:5173/art/ui/archive_opening.png");

if (failures.length > 0) {
  console.error("Registry QA check failed:");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Registry QA check passed:");
console.log(`- story registry entries: ${registry.stories.length}`);
console.log(`- total scenes: ${totalSceneCount}`);
notes.forEach((message) => console.log(`- ${message}`));
