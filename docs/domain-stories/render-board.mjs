// render-board: draw every story in Egon.io and put them on one picture, board.png.
// Usage (from the repo root, after `npm ci` in web/): node docs/domain-stories/render-board.mjs
// Each local .egn is imported into https://egon.io/app through its file input, so a story
// changed in a branch renders before it is pushed. Run it in the same PR as a story edit.

import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../web/package.json"));
const { chromium } = require("playwright");

const stories = readdirSync(here)
  .filter((f) => /^\d\d-.+\.egn$/.test(f))
  .sort();
const titleOf = (egn) =>
  readFileSync(join(here, egn.replace(/\.egn$/, ".story")), "utf8")
    .match(/^title:\s*Varde (\d+): (.+)$/m)
    .slice(1);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 3600, height: 2200 } });
const shots = [];
for (const egn of stories) {
  await page.goto("https://egon.io/app");
  await page.locator('input[type="file"]').first().setInputFiles(join(here, egn));
  await page.waitForTimeout(2000);
  // Hide the palette and the "Import successful" banner, then set the view so the
  // whole diagram fills the canvas, centred, whatever zoom the import left behind.
  await page.addStyleTag({ content: ".cdk-overlay-container, .djs-palette { display: none !important; }" });
  const pad = 30;
  const clip = await page.evaluate(([pad, FOOTER]) => {
    const vp = document.querySelector("g.viewport");
    const area = vp.ownerSVGElement.getBoundingClientRect();
    // The union of the story's shapes and arrows (the viewport also holds far larger
    // helper layers), in the viewport's own coordinates.
    const m = vp.getScreenCTM();
    const rects = [...vp.querySelectorAll('g.djs-element[data-element-id^="shape"], g.djs-element[data-element-id^="connection"]')]
      .map((g) => g.getBoundingClientRect())
      .filter((r) => r.width > 0);
    const x0 = Math.min(...rects.map((r) => r.left));
    const y0 = Math.min(...rects.map((r) => r.top));
    const x1 = Math.max(...rects.map((r) => r.right));
    const y1 = Math.max(...rects.map((r) => r.bottom));
    const b = { x: (x0 - m.e) / m.a, y: (y0 - m.f) / m.d, width: (x1 - x0) / m.a, height: (y1 - y0) / m.d };
    const z = Math.min((area.width - 2 * pad) / b.width, (area.height - 2 * pad - FOOTER) / b.height, 2);
    const tx = (area.width - b.width * z) / 2 - b.x * z;
    const ty = (area.height - FOOTER - b.height * z) / 2 - b.y * z;
    vp.setAttribute("transform", `matrix(${z} 0 0 ${z} ${tx} ${ty})`);
    const w = b.width * z + 2 * pad;
    const h = b.height * z + 2 * pad;
    return { x: area.x + (area.width - w) / 2, y: area.y + (area.height - FOOTER - h) / 2, width: w, height: h };
  }, [pad, 70]); // 70: keep clear of the Egon.io footer
  const png = await page.screenshot({ clip });
  const [number, title] = titleOf(egn);
  shots.push({ number, title: title[0].toUpperCase() + title.slice(1), src: `data:image/png;base64,${png.toString("base64")}` });
}

// The overview (story 0) across the top, the rest three to a row below.
const [overview, ...rest] = shots;
const cell = (s, cls) =>
  `<figure class="${cls}"><figcaption>${s.number}&nbsp; ${s.title}</figcaption><div><img src="${s.src}" alt=""></div></figure>`;
await page.setViewportSize({ width: 3600, height: 1000 });
await page.setContent(`<!doctype html><style>
  body { margin: 0; padding: 40px; background: #fff; font: 600 40px "Segoe UI", system-ui, sans-serif; width: 3520px; }
  figure { margin: 0; }
  figcaption { margin-bottom: 20px; }
  .top div { height: 1650px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 40px; padding-top: 40px; border-top: 3px solid #ccc; }
  .grid div { height: 700px; border: 2px solid #ddd; }
  div { display: flex; align-items: center; justify-content: center; }
  img { width: 100%; height: 100%; object-fit: contain; }
</style>${cell(overview, "top")}<section class="grid">${rest.map((s) => cell(s, "cell")).join("")}</section>`);
await page.screenshot({ path: join(here, "board.png"), fullPage: true });
await browser.close();
console.log(`board.png: ${shots.length} stories`);
