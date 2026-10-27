(function () {
  var WA = "https://wa.me/5542999263959?text=";

  // Links de WhatsApp com mensagem específica (categoria, currículo)
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = WA + encodeURIComponent(a.getAttribute("data-wa"));
  });

  // Links internos: rolam até a seção sem colocar "#secao" no endereço,
  // para um link copiado ou compartilhado sempre abrir no topo do site
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var id = a.getAttribute("href").slice(1);
    var target = id === "topo" ? null : document.getElementById(id);
    if (id !== "topo" && !target) return;
    e.preventDefault();
    if (target) {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (!target.hasAttribute("tabindex") && !target.matches("a, button")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
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
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { setOpen(false); burger.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (burger.getAttribute("aria-expanded") === "true" && !e.target.closest(".header")) setOpen(false);
    });
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

  // Carrossel do Instagram: duplica os posts para o loop contínuo,
  // com botão de pausa e pausa automática fora da tela
  document.querySelectorAll(".insta").forEach(function (section) {
    var rail = section.querySelector(".insta__rail");
    var toggle = section.querySelector(".insta__toggle");
    if (!rail || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Array.prototype.slice.call(rail.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
      rail.appendChild(c);
    });
    rail.classList.add("is-looping");

    var userPaused = false, offscreen = false;
    var sync = function () { rail.classList.toggle("is-paused", userPaused || offscreen); };
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener("click", function () {
        userPaused = !userPaused;
        toggle.setAttribute("aria-pressed", String(userPaused));
        toggle.querySelector("span").textContent = userPaused ? "Retomar posts" : "Pausar posts";
        sync();
      });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[0].isIntersecting; sync();
      }).observe(section);
    }
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
    items.forEach(function (el) {
      el.classList.add("reveal");
      var li = el.closest("li");
      if (li && li.parentElement.matches(".cats, .segs")) {
        el.style.setProperty("--i", Array.prototype.indexOf.call(li.parentElement.children, li) % 4);
      }
      io.observe(el);
    });
  }
})();
