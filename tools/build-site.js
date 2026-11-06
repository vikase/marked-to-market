#!/usr/bin/env node
/* Marked to Market site build. Run from the repo root: node tools/build-site.js
   1. Finds every piece (a folder whose index.html has og:type "article").
   2. Writes the share row and the subscribe box between
        <!-- mtm:follow -->  and  <!-- /mtm:follow -->
      in each piece, and the subscribe form and site share row into subscribe/index.html.
   3. Writes feed.xml (RSS 2.0), newest first, from each piece's meta tags.
   Everything it writes is plain HTML: the links work with JavaScript off.
   Settings live in tools/site.json; the email provider's form address goes there, once. */
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const site = JSON.parse(fs.readFileSync(path.join(__dirname, "site.json"), "utf8"));

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const enc = encodeURIComponent;
function meta(html, prop) {
  const re = new RegExp(`<meta\\s+(?:property|name)="${prop.replace(/[:.]/g, "\\$&")}"\\s+content="([^"]*)"`, "i");
  const m = html.match(re);
  return m ? unesc(m[1]) : "";
}

/* ---------- share links ---------- */
const NETWORKS = {
  x:        { label: "X",        href: (u, t) => `https://x.com/intent/post?text=${enc(t)}&url=${enc(u)}` },
  linkedin: { label: "LinkedIn", href: (u)    => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}` },
  facebook: { label: "Facebook", href: (u)    => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  whatsapp: { label: "WhatsApp", href: (u, t) => `https://wa.me/?text=${enc(t + " " + u)}` },
  bluesky:  { label: "Bluesky",  href: (u, t) => `https://bsky.app/intent/compose?text=${enc(t + " " + u)}` },
  threads:  { label: "Threads",  href: (u, t) => `https://www.threads.net/intent/post?text=${enc(t + " " + u)}` },
  reddit:   { label: "Reddit",   href: (u, t) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(t)}` },
  email:    { label: "Email",    href: (u, t, d) => `mailto:?subject=${enc(t)}&body=${enc((d ? d + "\n\n" : "") + u)}` }
};

function shareRow(url, title, desc, label) {
  const items = site.share.map(k => {
    const n = NETWORKS[k];
    const ext = k === "email" ? "" : ' target="_blank" rel="noopener"';
    return `<li><a href="${esc(n.href(url, title, desc))}"${ext}>${n.label}</a></li>`;
  }).join("");
  return `<div class="share" role="group" aria-label="${esc(label)}">` +
    `<span class="share-k">${esc(label)}</span><ul>` +
    `<li hidden><button type="button" class="share-native" data-url="${esc(url)}" data-title="${esc(title)}">Share…</button></li>` +
    items +
    `<li hidden><button type="button" class="share-copy" data-url="${esc(url)}">Copy link</button></li>` +
    `</ul></div>`;
}

/* ---------- subscribe form ---------- */
let formN = 0;
function subscribeForm(rel) {
  const s = site.subscribe || {};
  const id = `sub-email-${++formN}`;
  const extra = Object.entries(s.extra || {}).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join("");
  const live = !!s.action;
  const attrs = live ? `action="${esc(s.action)}" method="post" target="_blank"` : `action="#" data-pending`;
  return `<form class="sub" ${attrs}>` +
    `<label class="vh" for="${id}">Email address</label>` +
    `<input id="${id}" type="email" name="${esc(s.field || "email")}" placeholder="you@example.com" required autocomplete="email" inputmode="email">` +
    extra +
    `<button type="submit">Subscribe</button>` +
    `</form>` +
    `<p class="sub-alt">Free. One click to leave. Or follow by <a href="${rel}feed.xml">RSS</a>.</p>`;
}

function followBlock(url, title, desc, rel) {
  return `<!-- mtm:follow -->\n` +
    `<aside class="follow col" aria-label="Share and subscribe">\n` +
    shareRow(url, title, desc, "Share this piece") + "\n" +
    `<div class="subbox" id="subscribe">` +
    `<p class="eyebrow">Get the next mark</p>` +
    `<p class="subh">New pieces by email</p>` +
    `<p class="subp">One email when a piece goes up, and one when a published piece is re-marked because the facts moved. Nothing else.</p>` +
    subscribeForm(rel) +
    `</div>\n</aside>\n<!-- /mtm:follow -->`;
}

function replaceBlock(html, block, file) {
  const re = /<!-- mtm:follow -->[\s\S]*?<!-- \/mtm:follow -->/;
  if (!re.test(html)) throw new Error(`${file}: no <!-- mtm:follow --> marker. Add the two marker comments where the block should go.`);
  return html.replace(re, block);
}

/* ---------- pieces ---------- */
const pieces = [];
for (const d of fs.readdirSync(root, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith(".") || ["assets", "tools", "subscribe", "node_modules"].includes(d.name)) continue;
  const file = path.join(root, d.name, "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  if (meta(html, "og:type") !== "article") continue;
  const p = {
    slug: d.name,
    url: meta(html, "og:url") || site.base + d.name + "/",
    title: meta(html, "og:title"),
    desc: meta(html, "og:description") || meta(html, "description"),
    date: meta(html, "article:published_time")
  };
  if (!p.date) throw new Error(`${d.name}: add <meta property="article:published_time" content="YYYY-MM-DD"> to the head.`);
  html = replaceBlock(html, followBlock(p.url, p.title, p.desc, "../"), d.name);
  fs.writeFileSync(file, html);
  pieces.push(p);
}
pieces.sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));

/* ---------- subscribe page ---------- */
const subFile = path.join(root, "subscribe", "index.html");
if (fs.existsSync(subFile)) {
  let html = fs.readFileSync(subFile, "utf8");
  html = html.replace(/<!-- mtm:form -->[\s\S]*?<!-- \/mtm:form -->/, `<!-- mtm:form -->${subscribeForm("../")}<!-- /mtm:form -->`);
  html = html.replace(/<!-- mtm:share-site -->[\s\S]*?<!-- \/mtm:share-site -->/,
    `<!-- mtm:share-site -->${shareRow(site.base, site.title + ": " + "essays on politics, money and power by " + site.author, site.description, "Share the site")}<!-- /mtm:share-site -->`);
  fs.writeFileSync(subFile, html);
}

/* ---------- feed.xml ---------- */
const rfc822 = d => new Date(d.length === 10 ? d + "T12:00:00-05:00" : d).toUTCString();
const x = s => esc(s).replace(/&quot;/g, '"');
const items = pieces.map(p => `  <item>
    <title>${x(p.title)}</title>
    <link>${x(p.url)}</link>
    <guid isPermaLink="true">${x(p.url)}</guid>
    <pubDate>${rfc822(p.date)}</pubDate>
    <dc:creator>${x(site.author)}</dc:creator>
    <description>${x(p.desc)}</description>
  </item>`).join("\n");
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${x(site.title)}</title>
  <link>${x(site.base)}</link>
  <atom:link href="${x(site.base)}feed.xml" rel="self" type="application/rss+xml"/>
  <description>${x(site.description)}</description>
  <language>en-us</language>
  <lastBuildDate>${pieces.length ? rfc822(pieces[0].date) : new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>
`;
fs.writeFileSync(path.join(root, "feed.xml"), feed);

console.log(`Built ${pieces.length} piece(s): ${pieces.map(p => p.slug).join(", ")}`);
console.log(site.subscribe && site.subscribe.action ? `Sign-up form posts to ${site.subscribe.action}` : "Sign-up form not connected yet: set subscribe.action in tools/site.json");
