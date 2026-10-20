/* Família Nardi — interações */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  doc.classList.add("js");

  /* Entrada inicial ------------------------------------------------------ */
  function onLoaded() {
    requestAnimationFrame(function () { doc.classList.add("is-loaded"); });
  }
  var heroImg = document.querySelector(".hero__media img");
  if (heroImg && !heroImg.complete) {
    heroImg.addEventListener("load", onLoaded, { once: true });
    heroImg.addEventListener("error", onLoaded, { once: true });
    setTimeout(onLoaded, 1800);
  } else {
    onLoaded();
  }

  /* Cabeçalho ------------------------------------------------------------ */
  var header = document.querySelector(".site-header");
  var hasHero = !!document.querySelector(".hero");
  function updateHeader() {
    if (!header) return;
    var solid = !hasHero || window.scrollY > 40;
    header.classList.toggle("is-solid", solid);
  }
  updateHeader();

  /* Menu mobile ---------------------------------------------------------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  var lastFocus = null;

  function focusables() {
    return [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll("a, button")));
  }
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    if ("inert" in menu) menu.inert = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      lastFocus = document.activeElement;
      header.classList.add("is-solid");
      var first = menu.querySelector("a");
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
    } else {
      updateHeader();
      if (lastFocus && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
    }
  }
  if (toggle && menu) {
    if ("inert" in menu) menu.inert = true;
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (link) {
        lastFocus = null;
        setMenu(false);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (!menu.classList.contains("is-open")) return;
      if (e.key === "Escape") { setMenu(false); return; }
      if (e.key === "Tab") {
        var items = focusables();
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia("(min-width: 1081px)").addEventListener("change", function (mq) {
      if (mq.matches && menu.classList.contains("is-open")) setMenu(false);
    });
  }

  /* Revelação durante a rolagem ------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal, .reveal-img");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Navegação ativa ------------------------------------------------------ */
  var navLinks = document.querySelectorAll(".nav__link[href^='#']");
  if ("IntersectionObserver" in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var link = map[entry.target.id];
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* Parallax sutil ------------------------------------------------------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;
  function updateParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.08;
      var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      el.style.transform = "translate3d(0," + (progress * speed * -100).toFixed(2) + "px,0)";
    });
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateHeader();
      if (!reduceMotion.matches) updateParallax();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (!reduceMotion.matches) updateParallax();

  /* Botão flutuante do WhatsApp ----------------------------------------- */
  var wa = document.querySelector(".wa-float");
  if (wa) setTimeout(function () { wa.classList.add("is-in"); }, reduceMotion.matches ? 0 : 1600);

  /* Ano no rodapé -------------------------------------------------------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
