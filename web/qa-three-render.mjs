import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const webDir = path.dirname(__filename);
const rootDir = path.resolve(webDir, "..");
const docsDir = path.join(rootDir, "docs");
const url = "http://127.0.0.1:5173/web/?qa=1&resetProgress=1";
const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

const browserPath = edgeCandidates.find(existsSync);
assert.ok(browserPath, "Headless Edge/Chrome was not found in a standard location.");
assert.equal(typeof WebSocket, "function", "Node WebSocket support is required for CDP QA.");

const port = 9344 + Math.floor(Math.random() * 300);
const profileDir = path.join(rootDir, "tmp", `edge-three-profile-${process.pid}`);
let messageId = 1;

await rm(profileDir, { recursive: true, force: true });
await mkdir(profileDir, { recursive: true });
await mkdir(docsDir, { recursive: true });

const browser = spawn(browserPath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--disable-background-networking",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  url,
], { stdio: "ignore" });

let socket;

try {
  const page = await waitForPage(port);
  socket = await openCdp(page.webSocketDebuggerUrl);

  await cdp(socket, "Page.enable");
  await cdp(socket, "Runtime.enable");
  await cdp(socket, "Page.bringToFront");
  await cdp(socket, "Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });

  await waitForExpression(socket, "window.__glimmerThreeReady === true", 12000);
  await waitForExpression(socket, "window.__glimmerThreeFrames > 8", 12000);

  const canvasStats = await evaluate(socket, `(() => {
    const canvas = document.getElementById("archiveThree");
    const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
    if (!canvas || !gl) return { ok: false };
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let lit = 0;
    let sum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = pixels[i] + pixels[i + 1] + pixels[i + 2] + pixels[i + 3];
      if (brightness > 0) lit += 1;
      sum += brightness;
    }
    return { ok: true, width: canvas.width, height: canvas.height, lit, sum, frames: window.__glimmerThreeFrames };
  })()`);

  assert.equal(canvasStats.ok, true, "archiveThree canvas must expose WebGL.");
  assert.ok(canvasStats.width >= 300 && canvasStats.height >= 600, "archiveThree canvas must fill a mobile viewport.");
  assert.ok(canvasStats.lit > 100, `archiveThree canvas looks blank; lit pixels=${canvasStats.lit}.`);
  assert.ok(canvasStats.frames > 8, `archiveThree animation did not advance enough frames: ${canvasStats.frames}.`);

  const pointer = await evaluate(socket, `(() => {
    const screen = document.getElementById("archiveScreen");
    screen.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 310, clientY: 180 }));
    return window.__glimmerThreePointer;
  })()`);
  assert.ok(Math.abs(pointer.x) > 0.2 || Math.abs(pointer.y) > 0.2, "archive Three layer must react to pointer movement.");

  await screenshot(socket, 390, 844, path.join(docsDir, "qa_three_mobile.png"));
  await screenshot(socket, 1280, 800, path.join(docsDir, "qa_three_desktop.png"));

  await cdp(socket, "Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await evaluate(socket, `document.getElementById("startRandomButton").click()`);
  await waitForExpression(socket, `!document.getElementById("storyScreen").classList.contains("hidden")`, 8000);
  await waitForExpression(socket, `document.getElementById("panelImage").complete === true`, 8000);
  await waitForExpression(socket, `document.getElementById("interactionPrompt").textContent.length > 0`, 8000);

  const storyUi = await evaluate(socket, `(() => {
    const counter = document.getElementById("sceneCounter")?.textContent || "";
    const fill = document.getElementById("sceneProgressFill");
    const width = fill ? parseFloat(getComputedStyle(fill).width) : 0;
    const prompt = document.getElementById("interactionPrompt")?.textContent || "";
    return { counter, width, prompt };
  })()`);
  assert.match(storyUi.counter, /^1 \/ 18$/, "story scene counter must show current scene progress.");
  assert.ok(storyUi.width > 0, "story progress fill must be visible.");
  assert.ok(storyUi.prompt.length > 0, "story interaction prompt must render.");
  await screenshot(socket, 390, 844, path.join(docsDir, "qa_story_mobile.png"));

  console.log("Three render QA passed:");
  console.log(`- canvas: ${canvasStats.width}x${canvasStats.height}, lit pixels=${canvasStats.lit}`);
  console.log(`- animation frames observed: ${canvasStats.frames}`);
  console.log("- pointer movement updates Three.js state");
  console.log("- story progress UI renders after start");
  console.log("- screenshots: docs/qa_three_mobile.png, docs/qa_three_desktop.png, docs/qa_story_mobile.png");
} finally {
  socket?.close();
  browser.kill();
  await waitForExit(browser);
  await removeProfile(profileDir);
}

async function waitForPage(remotePort) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${remotePort}/json/list`);
      const pages = await response.json();
      const page = pages.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch (_error) {
      await delay(160);
    }
  }
  throw new Error("Timed out waiting for headless browser CDP page.");
}

function openCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(ws), { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
}

function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = messageId++;
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      ws.removeEventListener("message", onMessage);
      if (message.error) {
        reject(new Error(`${method} failed: ${message.error.message}`));
      } else {
        resolve(message.result || {});
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(ws, expression) {
  const result = await cdp(ws, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed.");
  }
  return result.result.value;
}

async function waitForExpression(ws, expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(ws, expression)) return;
    await delay(180);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

async function screenshot(ws, width, height, outPath) {
  await cdp(ws, "Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await delay(500);
  const shot = await cdp(ws, "Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(outPath, Buffer.from(shot.data, "base64"));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(child) {
  if (child.exitCode !== null || child.killed) {
    return delay(350);
  }

  return new Promise((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(resolve, 1500);
  });
}

async function removeProfile(dir) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error.code !== "EBUSY") throw error;
      await delay(250 + attempt * 150);
    }
  }
}
