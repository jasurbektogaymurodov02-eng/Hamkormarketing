/* Hamkor marketing agentligi — frontend */

(function () {
  'use strict';

  /* ---- Yil ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Mobil menyu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');

  function isMobile() { return window.matchMedia('(max-width: 900px)').matches; }

  function setNav(open) {
    if (!nav || !toggle) return;
    nav.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Yopish' : 'Menyu';
  }

  function syncNav() {
    if (!nav) return;
    if (isMobile()) { setNav(false); }
    else { nav.hidden = false; if (toggle) toggle.setAttribute('aria-expanded', 'false'); }
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(nav.hidden);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && isMobile()) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isMobile() && !nav.hidden) { setNav(false); toggle.focus(); }
    });
    window.addEventListener('resize', syncNav);
    syncNav();
  }

  /* ---- Scroll reveal ---- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('is-in'); });
    }, 3500);
  }

  /* ---- Ariza formasi ---- */
  var form = document.getElementById('lead-form');
  if (!form) return;

  var msg = document.getElementById('form-msg');
  var btn = form.querySelector('button[type="submit"]');

  function show(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'form-msg ' + (ok ? 'is-ok' : 'is-err');
    msg.hidden = false;
  }

  function digits(s) { return (s || '').replace(/\D/g, ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      business: form.business.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
      company: form.company.value.trim(), // honeypot
      page: location.pathname
    };

    if (data.name.length < 2) {
      show('Ismingizni yozing.', false);
      form.name.focus();
      return;
    }
    if (digits(data.phone).length < 9) {
      show('Telefon raqamini to\u2019liq yozing. Masalan: +998 90 123 45 67', false);
      form.phone.focus();
      return;
    }

    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Yuborilmoqda\u2026';

    fetch('/.netlify/functions/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (!r.ok || !r.j.ok) throw new Error(r.j && r.j.error ? r.j.error : 'server');
        form.reset();
        show('Arizangiz qabul qilindi. 1 ish kuni ichida qo\u2019ng\u2019iroq qilamiz.', true);
      })
      .catch(function () {
        show('Yuborishda xatolik bo\u2019ldi. Iltimos, +998 88 821 02 00 raqamiga qo\u2019ng\u2019iroq qiling.', false);
      })
      .finally(function () {
        btn.removeAttribute('aria-busy');
        btn.textContent = btn.getAttribute('data-label') || 'Ariza yuborish';
      });
  });
})();
