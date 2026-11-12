// Clicks through the site in a headless browser and saves screenshots to /tmp/wai-shots.
// Run it through scripts/shots.sh. CHAPTERS=3,4 limits it to those chapters.
import { chromium } from "playwright-core";
import fs from "fs";

const base = process.env.URL || "http://localhost:4173/";
const query = process.argv[2] || "";
const only = (process.env.CHAPTERS || "").split(",").filter(Boolean).map(Number);
const out = "/tmp/wai-shots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const views = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
};

for (const [name, opts] of Object.entries(views)) {
  if (process.env.ONLY && process.env.ONLY !== name) continue;
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const tag = query ? `${name}-${query.replace(/\W+/g, "_")}` : name;
  const shot = async (label, wait = 2600) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${tag}-${label}.png` });
  };
  const next = () => page.getByRole("button", { name: "Next", exact: true }).click();
  const press = (label) => page.getByRole("button", { name: label, exact: true }).click();
  const open = async (n) => {
    await page.goto(`${base}${query ? "?" + query : ""}#chapter-${n}`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
  };

  const chapters = {
    0: async () => {
      await shot("0-intro", 3500);
      await page.getByRole("button", { name: "Begin", exact: true }).click();
      await shot("0-2-basics", 4200);
    },
    1: async () => {
      await shot("1-1-compute-low");
      await page.getByLabel("Compute", { exact: true }).fill("1");
      await shot("1-1-compute-high");
      await next();
      await shot("1-2-money");
      await next();
      await shot("1-3-wheel", 3200);
      for (let i = 0; i < 4; i++) {
        await press("Spin the wheel");
        await page.waitForTimeout(900);
      }
      await shot("1-3-wheel-spun", 3000);
      await next();
      await shot("1-4-fast", 3200);
    },
    2: async () => {
      await shot("2-1-flow", 2600);
      await shot("2-1-flow-cracking", 6500);
      await next();
      await shot("2-2-collapse", 900);
      await shot("2-2-net", 3200);
      await next();
      await shot("2-3-game-idle", 2200);
      await press("Let it guess");
      await shot("2-3-game-wrong", 1900);
      await press("Correct it");
      await shot("2-3-game-correcting", 500);
      await shot("2-3-game-wrong2", 2400);
      await press("Correct it");
      await shot("2-3-game-right", 3000);
      await next();
      await shot("2-4-fast", 3000);
    },
    3: async () => {
      await shot("3-1-stream", 3500);
      await page.getByRole("button", { name: /Read fragment 3/ }).click();
      await shot("3-1-fragment", 900);
      await page.getByRole("button", { name: /Read fragment 5/ }).click();
      await shot("3-1-fragment-arabic", 900);
      await next();
      await shot("3-2-warm", 3200);
      await next();
      await shot("3-3-closing", 3200);
    },
    4: async () => {
      await shot("4-1-inside", 3500);
      await next();
      await shot("4-2-beams-idle", 3200);
      await press("English");
      await shot("4-2-beam-in", 500);
      await shot("4-2-beam-core", 700);
      await shot("4-2-beam-done", 1800);
      await press("中文");
      await shot("4-2-beam-chinese", 3000);
      await press("Français");
      await shot("4-2-beam-all-three", 3000);
      await next();
      await shot("4-3-all", 3200);
      await next();
      await shot("4-4-concept", 3200);
    },
    5: async () => {
      await shot("5-1-emotions", 3200);
      await next();
      await shot("5-2-alarm-message", 1500);
      await shot("5-2-alarm-spread", 2200);
      await shot("5-2-alarm-reply", 2000);
      await next();
      await shot("5-3-state", 3000);
      await next();
      await shot("5-4-steer", 3000);
    },
    6: async () => {
      await shot("6-1-figure", 3500);
      await next();
      await shot("6-2-rot-start", 2400);
      await shot("6-2-rot-done", 4500);
      await next();
      await shot("6-3-pair-on", 4000);
      await page.getByRole("switch").click();
      await shot("6-3-pair-off-spreading", 1300);
      await shot("6-3-pair-off", 4500);
      await page.getByRole("switch").click();
      await shot("6-3-pair-on-again", 2500);
      await next();
      await shot("6-4-story", 3500);
    },
    7: async () => {
      await shot("7-1-bars", 3300);
      await next();
      await shot("7-2-bottom-three", 3000);
      await next();
      await shot("7-3-garden-growing", 2600);
      await shot("7-3-garden", 4200);
      await next();
      await shot("7-4-together", 3600);
    },
    8: async () => {
      await shot("8-1-stream", 3400);
      await next();
      await shot("8-2-whole", 3600);
      await next();
      await shot("8-3-ending", 3200);
      await page.getByLabel("Your sentence").fill("Be patient with each other, and with the truth.");
      await press("Add it");
      await shot("8-3-sentence-rising", 1300);
      await shot("8-3-sentence-kept", 3200);
    },
  };

  for (const [n, run] of Object.entries(chapters)) {
    if (only.length && !only.includes(Number(n))) continue;
    await open(n);
    await run();
  }
  console.log(name, "errors:", errors.length ? errors : "none");
  await ctx.close();
}
await browser.close();
