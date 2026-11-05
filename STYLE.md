# Marked to Market house style

The rules every piece on this site follows. `assets/mtm.css` and `assets/mtm.js` implement them; this file says what they are and why. A new piece should need only its own figure styles on top.

## The idea

Marking to market means writing the honest number on a position, whatever you thought of it when you put it on. The visual system is built from that: a **stamp** that marks the position under scrutiny, a **constant colour code** for the position and the book it's measured against, and a **ticker rule** that dates and sources every figure the way a desk dates a mark.

## Ten rules

1. **One system, versioned here.** Link `../assets/mtm.css` and `../assets/mtm.js`. Don't redefine tokens, fonts or the figure anatomy inside a piece.
2. **Static-first figures.** Charts are HTML and inline SVG in the markup, with real widths and coordinates. Script only animates and annotates. A figure must read correctly with JavaScript off, in reader mode and in an archive crawl.
3. **The title states the finding; the subtitle states the facts.** The title is a full sentence a reader could quote ("Florida was the only close race the network priced at zero"). The subtitle carries measure, units, scope and cutoff. If the finding isn't worth asserting, the chart isn't worth drawing.
4. **Colour is semantic and constant.** `--pos` (orange) is the position in question. `--book` (blue) is the funded book or the comparison. `--band` (gray) is a reference level. Never use orange for a second series. Both colours pass colourblind-separation and 3:1 contrast checks against their surfaces in light and dark.
5. **At most one stamp per figure,** on the thing the figure exists to interrogate. Short, factual, uppercase: *Marked at zero*, *Never re-marked*, *Below the wave*. Two stamps is decoration.
6. **Annotate on the plot; pin on tap.** The key fact is written on the chart itself. Detail goes in `data-note` attributes: mtm.js turns them into hover tips on desktop and tap-to-pin notes everywhere, and makes them keyboard-reachable.
7. **Every figure is citable.** `id="fig-N"`, a kicker with its number, and a ticker rule: source on the left (linking the refs), as-of date and a `¶ fig N` permalink on the right.
8. **References preview in place.** Superscripts stay ordinary links to the sources list. mtm.js adds a preview card on hover or tap (a bottom sheet on phones), so a reader can check a source without leaving the sentence.
9. **Every piece ships a share card.** 1200 × 630: kicker, headline, a one-sentence brief of the argument (about 20 words), the headline figure in miniature, the stamp, the wordmark. Add an entry to `tools/cards.json` and run `node tools/render-cards.js`. Wire it with `og:image`, `og:image:alt` and `twitter:card`.
10. **Bespoke form, fixed furniture.** A piece may invent any chart form its argument needs. Type, palette, stamp, kicker and ticker never change.

## Figure anatomy

```html
<div class="wide">
<figure id="fig-1" data-anim>
  <p class="kick"><span><b>Fig 1</b> · Series name</span><span>Scope · period</span></p>
  <p class="ftitle">The finding, as a sentence</p>
  <p class="fsub">Measure, units, scope. Tap a row for detail.</p>
  <!-- the chart: static markup; data-note on anything worth explaining -->
  <figcaption>Method notes and caveats.</figcaption>
  <div class="ticker"><span>Source: … (<a href="#r7">ref 7</a>)</span>
    <span class="asof">As of Nov 2, 2026 · <a href="#fig-1">¶ fig 1</a></span></div>
</figure>
</div>
```

- `data-anim` opts into the entrance animation. mtm.js only animates figures that start below the fold; anything on screen at load is already complete. Write animation CSS as `.pre .thing{…start state…}`.
- The stamp in HTML: `<span class="stamp">Marked at zero</span>`. In SVG: a `rect.stamp-box` plus `text.stamp-txt`, rotated −1.2°.
- Wide SVG diagrams sit in a horizontally scrolling wrapper with a `min-width` (about 700px) and a "scroll sideways" hint on phones, so labels stay readable instead of shrinking to 5px.

## Type

IBM Plex Sans Condensed (display, 700), Source Serif 4 (body), IBM Plex Mono (numbers, labels, kickers, tickers). Numbers that line up use `font-variant-numeric: tabular-nums` (`.num`).

## Share cards

`tools/render-cards.js` renders every entry in `tools/cards.json` with Playwright, using the fonts vendored in `tools/fonts` (SIL Open Font License), so it works offline. Headlines step down in size automatically if they would overflow. The brief is a claim, not a topic: say what the piece argues.
