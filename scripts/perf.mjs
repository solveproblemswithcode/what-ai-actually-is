// Rough start-up numbers on a slowed-down CPU (4x), which is close to a mid-range phone.
import { chromium } from "playwright-core";
const base = process.env.URL || "http://localhost:4173/";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const tier of ["low", "mid", "high"]) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let bytes = 0;
  page.on("response", async (r) => {
    const len = Number(r.headers()["content-length"] || 0);
    bytes += len;
  });
  await page.goto(`${base}?tier=${tier}`, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => ({
    text: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0),
    world: Math.round(performance.getEntriesByName("wai-world")[0]?.duration ?? 0),
    particles: document.querySelector("canvas") ? "ok" : "none",
  }));
  console.log(`${tier}: text visible after ${m.text} ms, particle shapes built in ${m.world} ms, ${Math.round(bytes / 1024)} KB transferred`);
  await ctx.close();
}
await browser.close();
