// Renders the 1200x630 preview image that X and other sites show for a link.
// It is a screenshot of the two figures from chapter 6, with the site title in place of the chapter text.
import { chromium } from "playwright-core";
const base = process.env.URL || "http://localhost:4173/";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
await page.goto(`${base}?tier=high#chapter-6`, { waitUntil: "networkidle" });
for (let i = 0; i < 3; i++) {
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForTimeout(1200);
}
await page.waitForTimeout(3500);
await page.addStyleTag({
  content: `
    .topbar, .chapters, .controls, .fineprint, .kicker, .body-label { display: none !important; }
    .panel { width: 520px !important; padding-left: 70px !important; }
    .panel h1 { font-size: 76px !important; line-height: 1.02 !important; }
    .panel .body { font-size: 25px !important; margin-top: 22px !important; max-width: 430px !important; }
    .copy::after { content: "An interactive explainer by @earlythesis"; display: block; margin-top: 26px; font-size: 17px; letter-spacing: 0.04em; color: #8fb8ff; }
    .story-card { font-size: 19px !important; max-width: 230px !important; }
  `,
});
await page.evaluate(() => {
  document.querySelector(".panel h1").textContent = "What AI Actually Is";
  document.querySelector(".panel .body").textContent = "Not a program, and not a mind like ours. Discover it in less than 10 minutes.";
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/out/og.png" });
await browser.close();
console.log("wrote og.png");
