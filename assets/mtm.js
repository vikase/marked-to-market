/* Marked to Market house script. Progressive enhancement only: every figure and note
   is readable with this file missing. It adds
   1. entrance animation for figures below the fold ([data-anim] gets .pre until seen),
   2. tap-to-pin notes and desktop hover tips on any [data-note] inside a figure,
   3. reference previews for sup.fn links (card on desktop, bottom sheet on phones). */
(function(){
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* 1. animation */
  var figs = document.querySelectorAll("[data-anim]");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.remove("pre"); e.target.classList.add("in"); io.unobserve(e.target); } });
    }, {threshold: .25});
    figs.forEach(function(f){
      if (f.getBoundingClientRect().top > window.innerHeight * .9) { f.classList.add("pre"); io.observe(f); }
      else f.classList.add("in");
    });
  } else figs.forEach(function(f){ f.classList.add("in"); });

  /* 2. figure notes */
  var tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; document.body.appendChild(tip);
  function pinFor(fig){
    var p = fig.querySelector(".pin");
    if (!p) {
      p = document.createElement("p"); p.className = "pin"; p.hidden = true; p.setAttribute("aria-live", "polite");
      var t = fig.querySelector(".ticker"); fig.insertBefore(p, t || null);
    }
    return p;
  }
  document.querySelectorAll("figure [data-note]").forEach(function(el){
    if (!/^(BUTTON|A)$/.test(el.tagName)) { el.setAttribute("tabindex", "0"); el.setAttribute("role", "button"); }
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.getAttribute("data-note"));
  });
  function toggle(el){
    var fig = el.closest("figure"), p = pinFor(fig), n = el.getAttribute("data-note");
    if (!p.hidden && p.textContent === n) { p.hidden = true; return; }
    p.textContent = n; p.hidden = false; tip.hidden = true;
  }
  document.addEventListener("click", function(e){ var el = e.target.closest && e.target.closest("figure [data-note]"); if (el) toggle(el); });
  document.addEventListener("keydown", function(e){
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("figure [data-note]")) { e.preventDefault(); toggle(e.target); }
  });
  if (fine) {
    document.addEventListener("mousemove", function(e){
      var el = e.target.closest && e.target.closest("figure [data-note]");
      if (!el) { tip.hidden = true; return; }
      tip.textContent = el.getAttribute("data-note"); tip.hidden = false;
      var X = e.clientX + 14, Y = e.clientY + 14;
      if (X + 270 > window.innerWidth) X = e.clientX - 270;
      tip.style.left = X + "px"; tip.style.top = Y + "px";
    });
  }

  /* 3. reference previews */
  var refs = document.querySelectorAll("sup.fn a[href^='#']");
  if (!refs.length) return;
  var card = document.createElement("div"); card.className = "refcard"; card.hidden = true;
  card.setAttribute("role", "dialog"); card.setAttribute("aria-label", "Source");
  document.body.appendChild(card);
  var open = null, pinned = false, hideT = null;
  function close(){ card.hidden = true; pinned = false; if (open) open.setAttribute("aria-expanded", "false"); open = null; }
  function show(a, pin){
    var li = document.querySelector(a.getAttribute("href"));
    if (!li) return;
    clearTimeout(hideT);
    if (open && open !== a) open.setAttribute("aria-expanded", "false");
    var n = a.textContent.trim();
    card.innerHTML = '<div class="rk"><span>Source ' + n + '</span><span><a href="' + a.getAttribute("href") + '">all sources</a> <button class="x" type="button" aria-label="Close">×</button></span></div>' + li.innerHTML;
    card.hidden = false; open = a; if (pin) pinned = true; a.setAttribute("aria-expanded", "true");
    if (getComputedStyle(card).position !== "fixed") {
      var r = a.getBoundingClientRect(), w = card.offsetWidth;
      var left = Math.min(Math.max(16, r.left + window.scrollX - w / 2), document.documentElement.clientWidth - w - 16 + window.scrollX);
      var top = r.bottom + window.scrollY + 8;
      if (r.bottom + card.offsetHeight + 16 > window.innerHeight) top = r.top + window.scrollY - card.offsetHeight - 8;
      card.style.left = left + "px"; card.style.top = top + "px";
    }
    if (pin) card.querySelector(".x").focus({preventScroll: true});
  }
  refs.forEach(function(a){
    a.setAttribute("aria-expanded", "false");
    a.addEventListener("click", function(e){ e.preventDefault(); if (open === a && !card.hidden && pinned) close(); else show(a, true); });
    if (fine) {
      a.addEventListener("mouseenter", function(){ show(a, false); });
      a.addEventListener("mouseleave", function(){ hideT = setTimeout(function(){ if (!pinned && !card.matches(":hover") && !card.contains(document.activeElement)) close(); }, 260); });
    }
  });
  card.addEventListener("mouseleave", function(){ if (fine && !pinned) hideT = setTimeout(close, 260); });
  card.addEventListener("mouseenter", function(){ clearTimeout(hideT); });
  card.addEventListener("click", function(e){
    if (e.target.closest(".x")) { var a = open; close(); if (a) a.focus(); }
    else if (e.target.closest(".rk a")) close();
  });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && open) { var a = open; close(); a.focus(); } });
  document.addEventListener("click", function(e){ if (open && !card.contains(e.target) && !e.target.closest("sup.fn")) close(); });
})();

/* 4. share and subscribe extras (the plain links in .share work without this) */
(function(){
  "use strict";
  document.querySelectorAll(".share-copy").forEach(function(b){
    if (!(navigator.clipboard && window.isSecureContext)) return;
    b.parentNode.hidden = false;
    b.addEventListener("click", function(){
      navigator.clipboard.writeText(b.getAttribute("data-url")).then(function(){
        b.textContent = "Link copied"; b.classList.add("done");
        setTimeout(function(){ b.textContent = "Copy link"; b.classList.remove("done"); }, 2200);
      });
    });
  });
  /* The phone share sheet: shown only where the device offers one and the pointer is coarse. */
  var coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  document.querySelectorAll(".share-native").forEach(function(b){
    if (!navigator.share || !coarse) return;
    b.parentNode.hidden = false;
    b.addEventListener("click", function(){
      navigator.share({title: b.getAttribute("data-title"), url: b.getAttribute("data-url")}).catch(function(){});
    });
  });
  /* Until an email provider is connected, say so instead of posting nowhere. */
  document.querySelectorAll("form.sub[data-pending]").forEach(function(f){
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var m = f.parentNode.querySelector(".sub-msg");
      if (!m) { m = document.createElement("p"); m.className = "sub-msg"; m.setAttribute("aria-live", "polite"); f.after(m); }
      m.textContent = "Email sign-up opens shortly. Until then, the RSS feed below carries every new piece.";
    });
  });
})();
