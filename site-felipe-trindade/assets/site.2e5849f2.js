/* Felipe Trindade — interactions. No dependencies. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- scroll-linked: inner-image parallax + statement lighting */
  const par = $$('[data-parallax]');
  const words = $$('.approach__text .w');
  const approach = $('.approach__text');
  function scrollFx() {
    if (reduced) return;
    const vh = innerHeight;
    par.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
      const y = (-p * r.height * 0.035).toFixed(1);
      $$('img', el).forEach((img) => (img.style.transform = `translate3d(0,${y}px,0) scale(1.08)`));
    });
    if (approach && words.length) {
      const r = approach.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = Math.round(p * words.length);
      words.forEach((w, k) => w.classList.toggle('on', k < lit));
    }
  }

  /* ---------- header state */
  const header = $('.header');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (header) header.classList.toggle('is-scrolled', scrollY > 8);
      scrollFx();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu (dialog with focus trap) */
  const btn = $('.menu-btn');
  const sheet = $('#menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? btn.dataset.close : btn.dataset.open);
    sheet.toggleAttribute('inert', !open);
    sheet.setAttribute('aria-hidden', String(!open));
    if (open) { const f = $('a', sheet); if (f) f.focus({ preventScroll: true }); }
  };
  if (btn && sheet) {
    btn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setMenu(false); btn.focus(); }
      if (e.key === 'Tab') {
        const items = [btn, ...$$('a,button', sheet)];
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* ---------- reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('[data-reveal], .step').forEach((el) => io.observe(el));

  /* ---------- active nav item */
  const navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const a = map.get(e.target.id);
        if (a && e.isIntersecting) { navLinks.forEach((l) => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- hero slideshow */
  const hero = $('.hero__media');
  if (hero) {
    const slides = $$('.hero__slide', hero);
    const dots = $$('.hero__dots button', hero);
    const now = $('.hero__now', hero);
    let i = 0, timer = null, visible = true;
    const load = (img) => { if (img && img.dataset.src) { img.srcset = img.dataset.srcset; img.src = img.dataset.src; img.removeAttribute('data-src'); } };
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', String(k !== i)); });
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
      const s = slides[i];
      load($('img', s));
      load($('img', slides[(i + 1) % slides.length]));
      if (now) {
        $('small', now).textContent = s.dataset.meta;
        const a = $('a', now); a.textContent = s.dataset.title; a.href = s.dataset.href;
      }
      scrollFx();
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const play = () => { stop(); if (!reduced && visible && slides.length > 1) timer = setInterval(() => show(i + 1), 5600); };
    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); play(); }));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); else stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
    addEventListener('load', () => setTimeout(() => load($('img', slides[1])), 1200));
    play();
  }

  /* ---------- proposal form: compose e-mail / WhatsApp */
  const form = $('#proposal');
  if (form) {
    const msg = form.dataset;
    const fields = $$('[required]', form);
    const check = (el) => {
      const f = el.closest('.field');
      const err = $('.err', f);
      let m = '';
      if (!el.value.trim()) m = msg.required;
      else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) m = msg.invalid;
      f.toggleAttribute('data-invalid', !!m);
      el.setAttribute('aria-invalid', String(!!m));
      err.textContent = m;
      return !m;
    };
    fields.forEach((el) => el.addEventListener('blur', () => { if (el.value) check(el); }));
    fields.forEach((el) => el.addEventListener('input', () => { if (el.closest('.field').hasAttribute('data-invalid')) check(el); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = fields.map(check).every(Boolean);
      if (!ok) { const bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }
      const d = new FormData(form);
      const body = [`${msg.lName}: ${d.get('name')}`, `${msg.lMail}: ${d.get('email')}`, `${msg.lType}: ${d.get('type')}`, '', d.get('message')].join('\n');
      const viaWa = e.submitter && e.submitter.value === 'wa';
      $('.form__ok', form).textContent = msg.ok;
      if (viaWa) window.open(`${msg.wa}&text=${encodeURIComponent(msg.subject + '\n\n' + body)}`, '_blank', 'noopener');
      else location.href = `mailto:${msg.to}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ---------- year */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
