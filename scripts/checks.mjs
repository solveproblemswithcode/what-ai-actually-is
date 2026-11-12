// Behaviour checks: keyboard, swipe, wheel drag, deep links, menu, sources, reduced motion, no-WebGL fallback.
import { chromium } from "playwright-core";

// The test server is plain http, so the browser warns that one https-only header is ignored. That warning is filtered out.
const base = process.env.URL || "http://localhost:4173/";
const out = "/tmp/wai-shots";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
let failed = 0;
const check = (name, ok, extra = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
};
const h1 = (page) => page.locator("h1").innerText();

// Desktop: keyboard, deep link, wheel drag, sources, scroll.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/untrustworthy/.test(m.text()) && errors.push(m.text()));
  await page.goto(base + "?tier=low#chapter-1", { waitUntil: "networkidle" });
  check("deep link #chapter-1 opens chapter 1", (await h1(page)).startsWith("It gets predictably"));
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(950);
  check("arrow key goes forward", (await h1(page)).startsWith("So capital"));
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(950);
  check("arrow key goes back", (await h1(page)).startsWith("It gets predictably"));
  check("the scaling chart is shown with the slider", (await page.locator(".scaling svg").count()) === 1);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 120);
  // Software rendering in the test browser is slow, so input can arrive late. Leave room for the cooldown.
  await page.waitForTimeout(2200);
  check("scroll goes forward", (await h1(page)).startsWith("So capital"));
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(2500);
  check("on the wheel step", (await h1(page)).startsWith("A cycle"), await h1(page));
  // Drag around the wheel centre (the scene sits right of centre on desktop).
  const cx = 1440 * 0.7, cy = 450, r = 230;
  await page.mouse.move(cx + r, cy);
  await page.mouse.down();
  for (let i = 1; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 2.4;
    await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    await page.waitForTimeout(12);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
  const spinText = await page.locator(".spin-count").innerText();
  check("dragging the wheel counts turns", /turn/.test(spinText), spinText);
  check("drag did not change step", (await h1(page)).startsWith("A cycle"));
  await page.getByRole("button", { name: "Sources" }).click();
  const links = await page.locator("dialog a").evaluateAll((as) => as.map((a) => a.href));
  check("sources panel lists links", links.length >= 4, links.join(" "));
  await page.screenshot({ path: `${out}/check-sources-desktop.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("sources panel closes with Escape", !(await page.locator("dialog").evaluate((d) => d.open)));
  await page.setViewportSize({ width: 900, height: 420 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/check-landscape-phone.png` });
  check("no console errors (desktop)", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// Phone: swipe, slider does not swipe, chapter menu, tap sizes.
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const swipe = async (x1, y1, x2, y2) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y: y1 }] });
    for (let i = 1; i <= 6; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x1 + ((x2 - x1) * i) / 6, y: y1 + ((y2 - y1) * i) / 6 }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(1000);
  };
  await page.goto(base + "?tier=low", { waitUntil: "networkidle" });
  await swipe(190, 500, 190, 300);
  check("swipe up goes forward", (await h1(page)).startsWith("First, the basics"));
  await swipe(190, 500, 190, 300);
  check("swipe up again reaches chapter 1", (await h1(page)).startsWith("It gets predictably"));
  const box = await page.getByLabel("Compute", { exact: true }).boundingBox();
  await swipe(box.x + 30, box.y + box.height / 2, box.x + 250, box.y + box.height / 2);
  check("dragging the slider does not change step", (await h1(page)).startsWith("It gets predictably"));
  await swipe(300, 300, 100, 300);
  check("swipe left goes forward", (await h1(page)).startsWith("So capital"));
  await swipe(190, 300, 190, 500);
  check("swipe down goes back", (await h1(page)).startsWith("It gets predictably"));
  await page.getByRole("button", { name: /Chapters/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/check-menu-mobile.png` });
  await page.getByRole("button", { name: "Intro" }).click();
  await page.waitForTimeout(600);
  check("chapter menu jumps to intro", (await h1(page)).startsWith("What is AI"));
  check("address shows #chapter-0", (await page.evaluate(() => location.hash)) === "#chapter-0");
  await page.goto(base + "?tier=low#chapter-1", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("button:not(:disabled), input, a")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ t: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30), r: el.getBoundingClientRect() }))
      .filter((x) => x.r.width < 44 || x.r.height < 44)
      .map((x) => `${x.t} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`),
  );
  check("tap targets are at least 44px", small.length === 0, small.join(", "));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check("no sideways overflow at 375px", !overflow);
  await ctx.close();
}

// Chapter 2: play the guessing game to the end, with the keyboard only.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/untrustworthy/.test(m.text()) && errors.push(m.text()));
  await page.goto(base + "?tier=low#chapter-2", { waitUntil: "networkidle" });
  check("deep link #chapter-2 opens chapter 2", (await h1(page)).startsWith("It is not a program"));
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(950);
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(950);
  check("on the game step", (await h1(page)).startsWith("It learns by guessing"));
  const status = () => page.locator(".game-status").innerText();
  const blank = () => page.locator(".blank").innerText();
  const btn = page.locator(".game-button");
  const tap = async () => {
    await btn.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => !document.querySelector(".game-button").disabled, null, { timeout: 6000 });
    await page.waitForTimeout(150);
  };
  await tap();
  check("first guess is wrong", (await blank()) === "banana" && /Wrong/.test(await status()), await status());
  await tap();
  check("second guess is wrong", (await blank()) === "seven");
  await tap();
  check("third guess is right", (await blank()) === "mat" && /Right/.test(await status()), await status());
  check("words sit on the network", (await page.locator(".net-word").count()) === 3 && (await page.locator(".net-word.right").innerText()) === "mat");
  await tap();
  check("sentence 2 starts wrong", (await blank()) === "loud");
  await tap();
  check("sentence 2 corrected", (await blank()) === "wet");
  await tap();
  check("sentence 3 right first try", (await blank()) === "east" && /first try/.test(await status()), await status());
  check("space on a button does not change step", (await h1(page)).startsWith("It learns by guessing"));
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(950);
  check("last step of chapter 2", (await h1(page)).startsWith("Then repeat"));
  check("no console errors (chapter 2)", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// Chapters 3 and 4 on a phone: fragments and languages.
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/untrustworthy/.test(m.text()) && errors.push(m.text()));
  await page.goto(base + "?tier=low#chapter-3", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  check("chapter 3 shows ten fragments", (await page.locator(".frag").count()) === 10);
  const off = await page.locator(".frag").evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()).filter((r) => r.left < 0 || r.right > innerWidth || r.top < 50 || r.width < 43.5).length,
  );
  check("fragments are on screen and big enough to tap", off === 0, `${off} off`);
  await page.getByRole("button", { name: /Read fragment 1:/ }).tap();
  check("tapping a fragment shows its line", (await page.locator(".reader-text").innerText()).includes("garlic"));
  await page.getByRole("button", { name: /Read fragment 9/ }).tap();
  check("a translated fragment shows its meaning", (await page.locator(".reader-gloss").innerText()).includes("tea"));
  check("tapping fragments does not change step", (await h1(page)).startsWith("What does it learn from"));
  await page.goto(base + "?tier=low#chapter-4", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(1500);
  for (const [name, answer] of [["English", "large"], ["Français", "grand"], ["中文", "大"]]) {
    await page.getByRole("button", { name, exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector(".lang-button").disabled, null, { timeout: 6000 });
    await page.waitForTimeout(200);
    const shown = await page.locator(".lang-answer").allInnerTexts();
    check(`${name} answers ${answer}`, shown.includes(answer), shown.join(","));
  }
  check("the middle is labelled", (await page.locator(".concept-label").count()) === 1);
  check("all three done message", /Three languages/.test(await page.locator(".game-status").innerText()));
  const clipped = await page.locator(".lang-card, .concept-label").evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()).filter((r) => r.left < 0 || r.right > innerWidth).length,
  );
  check("language cards fit the screen", clipped === 0, `${clipped} clipped`);
  check("no console errors (chapters 3 and 4)", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// Chapters 5 and 6 on a phone: the emergency scene and the shortcut switch.
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/untrustworthy/.test(m.text()) && errors.push(m.text()));
  const onScreen = (sel) =>
    page.locator(sel).evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).every((r) => r.left >= 0 && r.right <= innerWidth && r.top >= 44),
    );
  await page.goto(base + "?tier=low#chapter-5", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  check("chapter 5 shows four emotion words", (await page.locator(".emotion-label").count()) === 4 && (await onScreen(".emotion-label")));
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.locator(".bubble.reply").waitFor({ timeout: 8000 });
  check("the emergency scene plays to the reply", (await page.locator(".bubble.reply").innerText()).includes("emergency services"));
  check("bubbles fit the screen", await onScreen(".bubble, .alarm-state"));
  check("the illustration caveat is shown", (await page.locator(".fineprint").innerText()).includes("illustration"));
  await page.goto(base + "?tier=low#chapter-6", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(1800);
  const sw = page.getByRole("switch");
  check("the switch starts ON and only one figure is damaged", (await sw.getAttribute("aria-checked")) === "true" && (await page.locator(".body-label.bad").count()) === 2);
  await sw.tap();
  check("switching OFF damages the second figure", (await sw.getAttribute("aria-checked")) === "false" && (await page.locator(".body-label.bad").count()) === 4);
  check("OFF explains what happens", /damage spreads/.test(await page.locator(".game-status").innerText()));
  await sw.focus();
  await page.keyboard.press("Space");
  check("the switch works from the keyboard", (await sw.getAttribute("aria-checked")) === "true" && (await page.locator(".body-label.bad").count()) === 2);
  check("space on the switch does not change step", (await h1(page)).startsWith("Then they added"));
  await page.waitForTimeout(400); // freshly shown words are placed on the next frame
  check("figure words fit the screen", await onScreen(".body-label, .story-card"));
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(900);
  check("the two stories are shown", (await page.locator(".story-card").count()) === 2 && (await onScreen(".story-card")));
  check("the hypothesis caveat is shown", (await page.locator(".fineprint").innerText()).includes("hypothesis"));
  check("no console errors (chapters 5 and 6)", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// Chapters 7 and 8 on a phone: the renamed jobs, the visitor's sentence, the ending.
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  const outside = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/untrustworthy/.test(m.text()) && errors.push(m.text()));
  page.on("request", (r) => !r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:") && outside.push(r.url()));
  const onScreen = (sel) =>
    page.locator(sel).evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).every((r) => r.left >= 0 && r.right <= innerWidth && r.top >= 44),
    );
  await page.goto(base + "?tier=low#chapter-7", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  check("chapter 7 shows the radar with every kind of work", (await page.locator(".radar-label").count()) === 22);
  check("radar labels shown on a phone fit the screen", await onScreen(".radar-label.key:not(.human)"));
  check("the radar has a legend", (await page.locator(".radar-legend").innerText()).includes("could do in theory"));
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(1800);
  const warm = await page.locator(".radar-label.warm").allInnerTexts();
  // On a phone these three names are in the text, and their spokes glow; the labels themselves are hidden for room.
  check("the bottom left three are marked", (await page.locator(".radar-label.warm").count()) === 3 && /Grounds maintenance/.test(await page.locator(".body").innerText()));
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(1500);
  const renamed = await page.locator(".rename-now").allInnerTexts();
  check("the three jobs are renamed", renamed.join(",") === "Gardening,Hospitality,Care" && (await onScreen(".rename")), renamed.join(","));
  await page.goto(base + "?tier=low#chapter-8", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(900);
  check("the last step asks the question", (await h1(page)).startsWith("What story do you want"));
  await page.getByLabel("Your sentence").fill("Tell the truth kindly.");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  check("the sentence is kept on screen", (await page.locator(".story-kept").innerText()).includes("Tell the truth kindly."));
  check("typing does not change step", (await h1(page)).startsWith("What story do you want"));
  check("the sentence is stored in the browser", (await page.evaluate(() => localStorage.getItem("wai-story"))) === "Tell the truth kindly.");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Chapters/ }).tap();
  await page.getByRole("button", { name: "8. The stories we tell" }).tap();
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await page.waitForTimeout(700);
  check("the sentence survives a reload", (await page.locator(".story-kept").innerText()).includes("Tell the truth kindly."));
  // The test server is plain http, where browsers hide the clipboard, so stand in for it (and for the share menu).
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t) => { window.__copied = t; } }, configurable: true });
  });
  await page.getByRole("button", { name: "Share", exact: true }).tap();
  await page.waitForTimeout(300);
  const copied = await page.evaluate(() => window.__copied || "");
  check("Share copies the site address when there is no share menu", copied.includes(base) && (await page.getByRole("button", { name: "Link copied" }).count()) === 1, copied);
  const talk = await page.getByRole("link", { name: "Watch the original talk" }).getAttribute("href");
  check("talk link points to the video", talk === "https://youtu.be/aBUniZHgCnE", talk);
  const clipped = await page.locator(".end-buttons > *, .story-form > *, .controls > *").evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()).filter((r) => r.right > innerWidth || r.bottom > innerHeight || (r.height < 43.5 && r.height > 6)).length,
  );
  check("ending buttons fit and are big enough", clipped === 0, `${clipped} off`);
  await page.getByRole("button", { name: "Start again" }).tap();
  await page.waitForTimeout(600);
  check("Start again returns to the intro", (await h1(page)).startsWith("What is AI"));
  const credit = await page.locator(".credit-line a").getAttribute("href");
  check("the intro credits the talk and links it", credit === "https://youtu.be/aBUniZHgCnE" && (await page.locator(".credit-line").innerText()).includes("Chloe Lubinski"));
  check("nothing is requested from other sites", outside.length === 0, outside.join(" "));
  check("no console errors (chapters 7 and 8)", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// Reduced motion and no-WebGL fallback.
for (const [label, query] of [["reduced", "reduced&tier=low"], ["fallback", "fallback"]]) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}?${query}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/check-${label}-wheel.png` });
  check(`${label} mode reaches the wheel step without errors`, (await h1(page)).startsWith("A cycle") && errors.length === 0, errors.join(" | "));
  for (const hash of ["#chapter-2", "#chapter-3", "#chapter-4", "#chapter-5", "#chapter-6", "#chapter-7", "#chapter-8"]) {
    await page.goto(`${base}?${query}${hash}`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/check-${label}-${hash.slice(1)}-${i + 1}.png` });
      const nextButton = page.getByRole("button", { name: "Next", exact: true });
      if (!(await nextButton.count())) break;
      await nextButton.click();
    }
    check(`${label} mode walks through ${hash.slice(1)} without errors`, errors.length === 0, errors.join(" | "));
  }
  if (label === "fallback") check("fallback has no canvas", (await page.locator("canvas").count()) === 0);
  await ctx.close();
}

await browser.close();
console.log(failed ? `${failed} check(s) failed` : "all checks passed");
process.exit(failed ? 1 : 0);
