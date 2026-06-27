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

const storyPath = path.join(rootDir, "stories", "story_001", "story_001.json");
const story = JSON.parse(await readFile(storyPath, "utf8"));

if (!Array.isArray(story.scenes)) {
  fail("story_001.json must contain a scenes array");
} else {
  if (story.scenes.length !== 18) {
    fail(`expected 18 scenes, got ${story.scenes.length}`);
  }

  story.scenes.forEach((scene, index) => {
    const sceneNumber = index + 1;
    if (!scene.text || typeof scene.text !== "string") {
      fail(`scene ${sceneNumber} is missing text`);
    }
    if (!validInteractions.has(scene.interaction)) {
      fail(`scene ${sceneNumber} has invalid interaction: ${scene.interaction}`);
    }
    if (!scene.image || !scene.image.endsWith(`panel_${String(sceneNumber).padStart(3, "0")}.png`)) {
      fail(`scene ${sceneNumber} image does not match panel number`);
    }
  });

  const last = story.scenes[story.scenes.length - 1];
  if (!last?.ending) {
    fail("last scene must have ending=true");
  }
}

for (let i = 1; i <= 18; i += 1) {
  const fileName = `panel_${String(i).padStart(3, "0")}.png`;
  const v2Path = path.join(rootDir, "art", "panels_v2", fileName);
  const originalPath = path.join(rootDir, "stories", "story_001", fileName);

  if (!(await exists(v2Path))) {
    fail(`missing v2 panel: ${v2Path}`);
  }
  if (!(await exists(originalPath))) {
    fail(`missing fallback panel: ${originalPath}`);
  }
}

await checkHttp("http://127.0.0.1:5173/web/");
await checkHttp("http://127.0.0.1:5173/web/?qa=1");
await checkHttp("http://127.0.0.1:5173/stories/story_001/story_001.json");
await checkHttp("http://127.0.0.1:5173/art/panels_v2/panel_018.png");

if (failures.length > 0) {
  console.error("QA check failed:");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("QA check passed:");
console.log(`- story scenes: ${story.scenes.length}`);
console.log("- v2 panels: 18");
console.log("- fallback panels: 18");
notes.forEach((message) => console.log(`- ${message}`));
