// Renders 1200x630 share cards for every entry in tools/cards.json.
// Usage, from the repo root:  node tools/render-cards.js
// Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
// Anatomy (see STYLE.md): kicker, headline, one-sentence brief (20 words max), the headline
// figure in miniature, the stamp, and the wordmark. Light theme only: feeds render on white.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
// The house fonts are vendored in tools/fonts (SIL Open Font License) and embedded,
// so cards render identically offline.
function fontFaces() {
  const f = (family, weight, file) => {
    const b64 = fs.readFileSync(path.join(__dirname, "fonts", file)).toString("base64");
    return `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
  };
  return [
    f("IBM Plex Sans Condensed", 700, "ibm-plex-sans-condensed-latin-700-normal.woff2"),
    f("IBM Plex Mono", 400, "ibm-plex-mono-latin-400-normal.woff2"),
    f("IBM Plex Mono", 500, "ibm-plex-mono-latin-500-normal.woff2"),
    f("IBM Plex Mono", 600, "ibm-plex-mono-latin-600-normal.woff2"),
    f("Source Serif 4", 400, "source-serif-4-latin-400-normal.woff2"),
  ].join("\n");
}
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, "cards.json"), "utf8"));

const css = `
${fontFaces()}
:root{--bg:#f5f6f8;--paper:#fff;--ink:#15181d;--ink-2:#4a5160;--ink-3:#7c8494;--rule:#d9dde4;--rule-2:#eef0f3;
  --pos:#e05f2b;--pos-soft:#fbe9e1;--book:#2a78d6;--book-soft:#e4eefb;
  --display:"IBM Plex Sans Condensed",sans-serif;--body:"Source Serif 4",Georgia,serif;--mono:"IBM Plex Mono",monospace}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;background:var(--bg)}
.card{position:absolute;inset:28px;background:var(--paper);border:1px solid var(--rule);border-radius:8px;
  padding:52px 60px 40px;display:grid;grid-template-columns:1fr 430px;grid-template-rows:auto 1fr auto;gap:0 56px}
.card.solo{grid-template-columns:1fr}
.kick{grid-column:1/-1;font-family:var(--mono);font-size:17px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);
  display:flex;justify-content:space-between;align-items:center}
.stamp{font-family:var(--mono);font-weight:600;font-size:16px;letter-spacing:.14em;text-transform:uppercase;color:var(--pos);
  border:2.5px solid var(--pos);border-radius:3px;padding:6px 12px 4px;transform:rotate(-1.5deg);background:var(--pos-soft)}
.text{display:flex;flex-direction:column;justify-content:center;gap:22px;min-width:0}
h1{font-family:var(--display);font-weight:700;font-size:68px;line-height:1.0;letter-spacing:-.01em;color:var(--ink);text-wrap:balance}
.solo h1{font-size:96px}
.pos{color:var(--pos)}
.dek{font-family:var(--body);font-size:27px;line-height:1.32;color:var(--ink-2);max-width:30ch}
.solo .dek{max-width:44ch}
.solo .foot .wm{visibility:hidden}
.text{overflow:hidden}
.fig{display:flex;flex-direction:column;justify-content:center}
.mini{display:grid;grid-template-columns:92px 1fr 78px;gap:13px 12px;align-items:center;font-family:var(--mono);font-size:17px;color:var(--ink-2)}
.mini i{display:block;height:22px;background:var(--rule-2);border-radius:3px;position:relative}
.mini i::after{content:"";position:absolute;inset:0 auto 0 0;width:var(--w);background:var(--book);border-radius:0 3px 3px 0}
.mini i.zero{background:var(--pos-soft);outline:2px dashed var(--pos)}
.mini i.zero::after{display:none}
.mini b{font-weight:500;text-align:right;color:var(--ink)}
.mini .pos{font-weight:600;color:var(--pos)}
.mcap{font-family:var(--mono);font-size:14px;color:var(--ink-3);margin-top:18px;border-top:1px solid var(--rule);padding-top:10px}
.flow{display:flex;flex-direction:column;gap:0;align-items:stretch}
.flow .n{font-family:var(--display);font-weight:700;font-size:23px;color:var(--ink);border:2px solid var(--rule);border-radius:5px;
  padding:12px 16px;background:var(--paper)}
.flow .n.acc{border-color:var(--book);background:var(--book-soft)}
.flow .n.pos{border-color:var(--pos);background:var(--pos-soft);color:var(--ink)}
.flow .a{height:22px;width:2px;background:var(--ink-3);margin-left:26px;position:relative}
.flow .a::after{content:"";position:absolute;left:-5px;bottom:-2px;border:6px solid transparent;border-top-color:var(--ink-3)}
.foot{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--rule);padding-top:16px;
  font-family:var(--mono);font-size:17px;color:var(--ink-3)}
.wm{font-family:var(--display);font-weight:700;font-size:26px;color:var(--ink)}
.wm span{color:var(--pos)}
`;

function page(c) {
  const solo = !c.figure;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="card${solo ? " solo" : ""}">
  <div class="kick"><span>${c.kicker}</span><span class="stamp">${c.stamp}</span></div>
  <div class="text"><h1>${c.title}</h1><p class="dek">${c.dek}</p></div>
  ${solo ? "" : `<div class="fig">${c.figure}</div>`}
  <div class="foot"><span class="wm">Marked to <span>Market</span></span><span>Vikas Erraballi · vikase.github.io/marked-to-market</span></div>
</div></body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const c of cards) {
    const words = c.dek.split(/\s+/).length;
    if (words > 26) console.warn(`! ${c.out}: brief is ${words} words; keep it near 20.`);
    await p.setContent(page(c), { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    // Fit: step the headline down until the text column stops overflowing.
    await p.evaluate(() => {
      const t = document.querySelector(".text"), h = document.querySelector("h1");
      let size = parseFloat(getComputedStyle(h).fontSize);
      while (t.scrollHeight > t.clientHeight + 1 && size > 40) { size -= 2; h.style.fontSize = size + "px"; }
    });
    await p.screenshot({ path: path.join(root, c.out) });
    console.log("wrote", c.out);
  }
  await browser.close();
})();
