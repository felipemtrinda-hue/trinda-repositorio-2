(function () {
  var WA = "https://wa.me/5542999263959?text=";

  // Links de WhatsApp com mensagem específica (categoria, currículo)
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = WA + encodeURIComponent(a.getAttribute("data-wa"));
  });

  // Header compacto ao rolar
  var header = document.querySelector(".header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Menu mobile
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("menu");
  if (burger && nav) {
    var setOpen = function (open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      nav.classList.toggle("is-open", open);
    };
    burger.addEventListener("click", function () { setOpen(burger.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  // Mapa interativo carregado só quando pedido
  document.querySelectorAll(".js-map-live").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var map = btn.closest(".map");
      var f = document.createElement("iframe");
      f.title = "Mapa: Disk Embalagens, Rua Benjamin Constant, 235, Centro, Ponta Grossa";
      f.src = "https://www.google.com/maps?q=Rua+Benjamin+Constant,+235+-+Centro,+Ponta+Grossa+-+PR,+84010-380&output=embed";
      f.referrerPolicy = "no-referrer-when-downgrade";
      map.appendChild(f);
      map.classList.add("is-live");
    });
  });

  // Carrossel do Instagram: duplica os posts para o loop contínuo
  document.querySelectorAll(".insta__rail").forEach(function (rail) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Array.prototype.slice.call(rail.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
      rail.appendChild(c);
    });
    rail.classList.add("is-looping");
  });

  // Ano no rodapé
  document.querySelectorAll(".js-year").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Animação de entrada
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var items = document.querySelectorAll(".section__head, .cat, .segs li, .park, .about, .contact, .jobs__card, .cta__inner");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
