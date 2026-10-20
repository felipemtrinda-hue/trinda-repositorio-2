/* Família Nardi — interações */
(function () {
  "use strict";

  var doc = document.documentElement;
  var scriptSrc = document.currentScript && document.currentScript.src;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.add("js");

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* Títulos: palavras em máscara --------------------------------------- */
  if (!reduce) {
    document.querySelectorAll(".headline.fx").forEach(function (h) {
      var i = 0, frag = document.createDocumentFragment();
      Array.prototype.slice.call(h.childNodes).forEach(function (node) {
        var isEm = node.nodeType === 1 && node.tagName === "EM";
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var outer = document.createElement("span"), inner = document.createElement("span");
          outer.className = "hw";
          inner.style.setProperty("--i", i++);
          if (isEm) { var em = document.createElement("em"); em.textContent = part; inner.appendChild(em); }
          else inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
      });
      h.setAttribute("aria-label", h.textContent);
      h.textContent = "";
      h.appendChild(frag);
      h.classList.add("split");
    });
  }

  /* Entrada dos elementos ----------------------------------------------- */
  var fx = document.querySelectorAll(".fx");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    fx.forEach(function (el) { io.observe(el); });
  } else {
    fx.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Barra de navegação --------------------------------------------------- */
  var nav = document.querySelector(".nav");
  var progressBar = document.querySelector(".nav__progress");

  /* Menu mobile ---------------------------------------------------------- */
  var btn = document.querySelector(".menu-btn");
  var sheet = document.getElementById("menu");
  function setMenu(open) {
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    sheet.classList.toggle("is-open", open);
    sheet.setAttribute("aria-hidden", String(!open));
    sheet.inert = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) sheet.style.top = Math.max(0, nav.getBoundingClientRect().bottom) + "px";
    if (open) { var a = sheet.querySelector("a"); if (a) setTimeout(function () { a.focus({ preventScroll: true }); }, 200); }
  }
  if (btn && sheet) {
    sheet.inert = true;
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    sheet.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.classList.contains("is-open")) { setMenu(false); btn.focus(); }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* Link ativo ----------------------------------------------------------- */
  var links = document.querySelectorAll(".nav__links a[href^='#']");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* Manifesto: palavras que acendem -------------------------------------- */
  var words = [];
  var wordsEl = document.querySelector("[data-words]");
  if (wordsEl) {
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(wordsEl.childNodes).forEach(function (node) {
      var serif = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement("span");
        s.className = serif ? "w w--serif" : "w";
        s.textContent = part;
        frag.appendChild(s);
        words.push(s);
      });
    });
    wordsEl.textContent = "";
    wordsEl.appendChild(frag);
  }

  /* Paleta da história fixada -------------------------------------------- */
  var story = document.querySelector(".story");
  var storySticky = story && story.querySelector(".story__sticky");
  var steps = story ? story.querySelectorAll(".step") : [];
  var dots = story ? story.querySelectorAll(".story__dots i") : [];
  var storyBag = story && story.querySelector(".story__bag");
  var palette = [[20, 17, 15], [23, 28, 107], [142, 34, 51]]; // preto café → azul → bordô
  function mix(a, b, t) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }); }
  function storyColor(p) {
    var seg = p * 3;
    var t1 = clamp((seg - 0.85) / 0.4, 0, 1);
    var t2 = clamp((seg - 1.85) / 0.4, 0, 1);
    return mix(mix(palette[0], palette[1], t1), palette[2], t2);
  }

  var progressEls = document.querySelectorAll("[data-progress]");

  /* Jornada: altura da seção = distância horizontal a percorrer --------- */
  var journey = document.querySelector(".journey");
  var journeyTrack = journey && journey.querySelector(".journey__track");
  var journeyBar = journey && journey.querySelector(".journey__bar");
  var journeyDistance = 0, journeyActive = false;
  var desktop = window.matchMedia("(min-width: 861px)");
  function measureJourney() {
    if (!journey) return;
    journeyActive = desktop.matches && !reduce;
    if (!journeyActive) { journey.style.height = ""; journeyTrack.style.removeProperty("--jx"); return; }
    var pin = journey.querySelector(".journey__pin");
    var trackRight = journeyTrack.offsetLeft + journeyTrack.scrollWidth;
    journeyDistance = Math.max(0, trackRight - pin.clientWidth);
    journey.style.height = (window.innerHeight + journeyDistance) + "px";
  }
  measureJourney();
  window.addEventListener("resize", measureJourney);
  window.addEventListener("load", measureJourney);
  var tiles = document.querySelectorAll("[data-glow]");

  /* Loop de rolagem ------------------------------------------------------ */
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = doc.scrollHeight - vh;
    if (nav) nav.classList.toggle("is-scrolled", y > 8);
    if (progressBar) progressBar.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : 0);
    if (reduce) return;

    progressEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var mode = el.getAttribute("data-progress");
      var p = el.classList.contains("zoom")
        ? clamp((vh - r.top) / (vh * 0.85), 0, 1)
        : mode === "through"
          ? clamp((vh - r.top) / (vh + r.height), 0, 1)
          : clamp(-r.top / (r.height * 0.9), 0, 1);
      el.style.setProperty("--p", p.toFixed(4));
    });

    if (wordsEl) {
      var wr = wordsEl.getBoundingClientRect();
      var wp = clamp((vh * 0.82 - wr.top) / (wr.height + vh * 0.25), 0, 1);
      var n = words.length;
      words.forEach(function (w, i) {
        w.style.setProperty("--o", (0.16 + 0.84 * clamp(wp * n * 1.15 - i, 0, 1)).toFixed(3));
      });
    }

    if (journey && journeyActive) {
      var jr = journey.getBoundingClientRect();
      var jp = clamp(-jr.top / (jr.height - vh), 0, 1);
      journeyTrack.style.setProperty("--jx", (-jp * journeyDistance).toFixed(1) + "px");
      journeyBar.style.setProperty("--jp", jp.toFixed(4));
    }

    if (story) {
      var sr = story.getBoundingClientRect();
      var sp = clamp(-sr.top / (sr.height - vh), 0, 1);
      var idx = Math.min(steps.length - 1, Math.floor(sp * steps.length));
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      var c = storyColor(sp);
      storySticky.style.setProperty("--story-bg", "rgb(" + c.join(",") + ")");
      if (storyBag) {
        storyBag.style.setProperty("--rot", (-10 + sp * 20).toFixed(2) + "deg");
        storyBag.style.setProperty("--ty", (Math.sin(sp * Math.PI) * -30).toFixed(1) + "px");
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
  if (reduce) words.forEach(function (w) { w.style.setProperty("--o", 1); });

  /* Luz que acompanha o cursor nos cards --------------------------------- */
  tiles.forEach(function (t) {
    t.addEventListener("pointermove", function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty("--mx", (e.clientX - r.left) + "px");
      t.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* Carrossel de valores ------------------------------------------------- */
  var track = document.querySelector("[data-values-track]");
  var vBtns = document.querySelectorAll("[data-values]");
  if (track) {
    var syncBtns = function () {
      vBtns[0].disabled = track.scrollLeft < 4;
      vBtns[1].disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
    };
    vBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var card = track.querySelector("li");
        track.scrollBy({ left: Number(b.dataset.values) * (card.offsetWidth + 16), behavior: reduce ? "auto" : "smooth" });
      });
    });
    track.addEventListener("scroll", syncBtns, { passive: true });
    window.addEventListener("resize", syncBtns);
    syncBtns();
  }

  /* Vídeos: só carregam se o arquivo existir e quando a seção se aproxima */
  var saveData = navigator.connection && navigator.connection.saveData;
  var videos = document.querySelectorAll("video[data-video]");
  if (videos.length && "IntersectionObserver" in window && !reduce && !saveData) {
    var vplay = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (!v.classList.contains("is-playing")) return;
        if (e.isIntersecting) v.play().catch(function () {}); else v.pause();
      });
    }, { threshold: 0.15 });
    var vload = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var v = e.target, base = v.getAttribute("data-video");
        vload.unobserve(v);
        fetch(base + ".mp4", { method: "HEAD" }).then(function (res) {
          if (!res.ok) return;
          var webm = document.createElement("source");
          webm.src = base + ".webm"; webm.type = "video/webm";
          var mp4 = document.createElement("source");
          mp4.src = base + ".mp4"; mp4.type = "video/mp4";
          v.append(webm, mp4);
          v.addEventListener("canplay", function () {
            v.classList.add("is-playing");
            var host = v.closest(".cinema");
            if (host) host.classList.add("has-video");
            v.play().catch(function () {});
            vplay.observe(v);
          }, { once: true });
          v.load();
        }).catch(function () {});
      });
    }, { rootMargin: "400px 0px" });
    videos.forEach(function (v) { vload.observe(v); });
  }

  /* Botões magnéticos (mouse) ------------------------------------------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    document.querySelectorAll(".pill:not(.pill--sm)").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.translate = (x * 8).toFixed(1) + "px " + (y * 6).toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }

  /* Visualizador 360° (carregado sob demanda) ---------------------------- */
  var viewer = document.querySelector("[data-viewer]");
  if (viewer && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      vio.disconnect();
      import(new URL("viewer360.js", scriptSrc || location.href).href)
        .then(function (m) { return m.mountViewer(viewer); })
        .catch(function () { viewer.classList.add("viewer--fallback"); });
    }, { rootMargin: "600px 0px" });
    vio.observe(viewer);
  }

  /* WhatsApp flutuante e ano --------------------------------------------- */
  var wa = document.querySelector(".wa-float");
  if (wa) setTimeout(function () { wa.classList.add("is-in"); }, reduce ? 0 : 1400);
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
