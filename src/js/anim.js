/* Hamkor — animatsiyalar
   Barchasi prefers-reduced-motion sozlamasini hurmat qiladi. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------------------------------------------------------------- Parda */
  var curtain = document.querySelector('.curtain');

  function finish() {
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    if (curtain) {
      curtain.classList.add('is-up');
      setTimeout(function () { curtain.remove(); }, 900);
    }
  }

  /* Foiz hisoblagichi: yuklanish jarayonini ko'rsatadi.
     Haqiqiy yuklanishga bog'langan — load hodisasi kelganda 100% ga yetadi. */
  var pct = curtain && curtain.querySelector('.curtain__pct');
  var loaded = false;
  var shown = 0;

  function tickPct() {
    if (!pct) return;
    // Yuklanmagan bo'lsa 92% da kutib turadi, yuklangach 100% ga chiqadi
    var ceiling = loaded ? 100 : 92;
    if (shown < ceiling) shown += Math.max(1, (ceiling - shown) * 0.12);
    if (shown > ceiling) shown = ceiling;
    pct.textContent = Math.round(shown) + '%';
    if (shown < 100) requestAnimationFrame(tickPct);
  }

  if (reduced) {
    finish();
  } else {
    var done = false;
    var go = function () {
      if (done) return;
      done = true;
      loaded = true;
      if (pct) { shown = 100; pct.textContent = '100%'; }
      setTimeout(finish, 220);
    };
    requestAnimationFrame(tickPct);
    window.addEventListener('load', function () {
      loaded = true;
      setTimeout(go, 380);
    });
    // Internet sekin bo'lsa ham 2.2 soniyadan ortiq ushlab turmaymiz
    setTimeout(go, 2200);
  }

  /* -------------------------------------------- Sarlavhani satrlarga bo'lish */
  // Satrlarni brauzer o'zi joylashtiradi; biz har bir satrni maskaga o'raymiz.
  function splitLines(el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.textContent = '';

    var probes = words.map(function (w) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
      return s;
    });

    // Bir xil top qiymatidagi so'zlar = bitta satr
    var lines = [];
    var lastTop = null;
    probes.forEach(function (s, i) {
      var top = Math.round(s.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 4) {
        lines.push([]);
        lastTop = top;
      }
      lines[lines.length - 1].push(words[i]);
    });

    el.textContent = '';
    lines.forEach(function (line) {
      var mask = document.createElement('span');
      mask.className = 'line-mask';
      var inner = document.createElement('span');
      // Oxiridagi bo'shliq matnni nusxalaganda so'zlar qo'shilib ketmasligi uchun
      inner.textContent = line.join(' ') + ' ';
      mask.appendChild(inner);
      el.appendChild(mask);
    });
  }

  var h1 = document.querySelector('.hero h1');
  if (h1 && !reduced && h1.textContent.trim().length < 160) {
    try { splitLines(h1); } catch (e) { /* muvaffaqiyatsiz bo'lsa matn o'z holicha qoladi */ }
  }

  /* ------------------------------------------------------ Skroll indikatori */
  var bar = document.querySelector('.scroll-bar');
  var nativeScrollTimeline = CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');

  if (bar && !reduced && !nativeScrollTimeline) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var p = h > 0 ? window.scrollY / h : 0;
        bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------- Header ixchamlashishi */
  var header = document.querySelector('.site-header');
  if (header) {
    var stuckTick = false;
    var checkStuck = function () {
      if (stuckTick) return;
      stuckTick = true;
      requestAnimationFrame(function () {
        header.classList.toggle('is-stuck', window.scrollY > 40);
        stuckTick = false;
      });
    };
    window.addEventListener('scroll', checkStuck, { passive: true });
    checkStuck();
  }

  /* ------------------------------------------------------------- Raqamlar */
  // "3.4x", "+180%", "12 kun" kabi qiymatlarni sanab ko'rsatadi.
  function countUp(el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d\-]*)(-?[\d\s]+(?:[.,]\d+)?)(.*)$/);
    if (!m) return;

    var prefix = m[1];
    var numStr = m[2].replace(/\s/g, '').replace(',', '.');
    var suffix = m[3];
    var target = parseFloat(numStr);
    if (!isFinite(target)) return;

    var decimals = (numStr.split('.')[1] || '').length;
    var start = performance.now();
    var dur = 1100;

    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = target * eased;
      el.textContent = prefix + v.toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------- Ko'rinishga kirish kuzatuvi */
  var watched = document.querySelectorAll('.stagger, .steps, .reveal-img, .metrics, .deck');

  if (reduced || !('IntersectionObserver' in window)) {
    watched.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        if (el.classList.contains('metrics')) {
          el.querySelectorAll('.val').forEach(countUp);
        }
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

    watched.forEach(function (el) { io.observe(el); });
  }

  /* Xavfsizlik to'ri: ba'zi brauzerlarda (ayniqsa ilova ichidagi
     brauzerlarda) kuzatuv ishlamay qolishi mumkin. 3.5 soniyadan keyin
     hali ochilmagan bloklarni majburan ko'rsatamiz — matn hech qachon
     ko'rinmay qolmasin. */
  setTimeout(function () {
    document.querySelectorAll('.reveal, .stagger, .steps, .metrics, .deck').forEach(function (el) {
      el.classList.add('is-in');
    });
    root.classList.add('is-ready');
  }, 3500);

  /* --------------------------------------------- Keys kartalari (deck + panel) */
  document.querySelectorAll('.deck__card').forEach(function (card) {
    var panel = document.getElementById(card.getAttribute('aria-controls'));
    var item = card.closest('.deck__item');
    if (!panel) return;

    panel.setAttribute('data-state', 'closed');

    function closeAll(except) {
      document.querySelectorAll('.deck__card[aria-expanded="true"]').forEach(function (other) {
        if (other === except) return;
        var op = document.getElementById(other.getAttribute('aria-controls'));
        other.setAttribute('aria-expanded', 'false');
        var oi = other.closest('.deck__item');
        if (oi) oi.classList.remove('is-open');
        if (!op) return;
        op.setAttribute('data-state', 'closed');
        if (reduced) { op.hidden = true; op.style.height = ''; return; }
        op.style.height = op.scrollHeight + 'px';
        requestAnimationFrame(function () { op.style.height = '0px'; });
        setTimeout(function () {
          if (other.getAttribute('aria-expanded') === 'false') op.hidden = true;
        }, 520);
      });
    }

    card.addEventListener('click', function () {
      var isOpen = card.getAttribute('aria-expanded') === 'true';
      closeAll(card);

      if (isOpen) {
        card.setAttribute('aria-expanded', 'false');
        if (item) item.classList.remove('is-open');
        panel.setAttribute('data-state', 'closed');
        if (reduced) { panel.hidden = true; return; }
        panel.style.height = panel.scrollHeight + 'px';
        requestAnimationFrame(function () { panel.style.height = '0px'; });
        setTimeout(function () {
          if (card.getAttribute('aria-expanded') === 'false') panel.hidden = true;
        }, 520);
        return;
      }

      card.setAttribute('aria-expanded', 'true');
      if (item) item.classList.add('is-open');
      panel.hidden = false;
      panel.setAttribute('data-state', 'open');
      if (reduced) { panel.style.height = ''; return; }
      panel.style.height = '0px';
      requestAnimationFrame(function () {
        panel.style.height = panel.scrollHeight + 'px';
      });
      setTimeout(function () {
        if (card.getAttribute('aria-expanded') === 'true') {
          panel.style.height = 'auto';
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 540);
    });
  });

  /* ------------------------------------------------------- Narx toggle'i */
  var tabs = document.querySelectorAll('.switch [role="tab"]');
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t2) {
          var on = t2 === tab;
          t2.setAttribute('aria-selected', String(on));
          var panel = document.getElementById(t2.getAttribute('aria-controls'));
          if (panel) {
            panel.hidden = !on;
            if (on) {
              // Panel yangi ko'rinsa, ichidagi bloklarni ochamiz
              panel.querySelectorAll('.reveal, .stagger').forEach(function (el) {
                el.classList.remove('is-in');
                requestAnimationFrame(function () { el.classList.add('is-in'); });
              });
            }
          }
        });
      });

      // Chap/o'ng tugmalar bilan almashish
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var list = Array.prototype.slice.call(tabs);
        var i = list.indexOf(tab);
        var next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
        next.focus();
        next.click();
      });
    });
  }

  /* --------------------------------------------------------- Lenta nusxasi */
  // Uzluksiz aylanishi uchun mazmun ikki marta kerak.
  var track = document.querySelector('.marquee__track');
  if (track && !reduced) {
    track.appendChild(track.firstElementChild.cloneNode(true));
  }
})();
