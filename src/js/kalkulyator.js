/* Hamkor — marketing kalkulyatori (CAC, ROMI, LTV) */

(function () {
  'use strict';

  var root = document.querySelector('.calc-band');
  if (!root) return;

  var NB = ' ';
  var SOM = NB + 'so’m';

  function $(id) { return document.getElementById(id); }

  /* ---- Raqamlarni o'qish ---- */
  function num(id) {
    var el = $(id);
    if (!el) return NaN;
    var raw = el.value;
    if (el.hasAttribute('data-num')) raw = raw.replace(/\D/g, '');
    else raw = raw.replace(/\s/g, '').replace(',', '.');
    if (raw === '') return NaN;
    var n = parseFloat(raw);
    return isFinite(n) && n >= 0 ? n : NaN;
  }

  function sel(id) { return parseFloat($(id).value) || 1; }

  function ok(n) { return isFinite(n) && n > 0; }

  /* ---- Formatlash: 1 250 000, 3,6, −2 200 000 ---- */
  function group(n, sep) {
    return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  function money(n) {
    return (n < 0 ? '−' : '') + group(n, NB) + SOM;
  }

  function dec(n, digits) {
    var d = digits === undefined ? 1 : digits;
    var s = Math.abs(n).toFixed(d).replace('.', ',').replace(/,0+$/, '');
    // Butun qismini ham guruhlaymiz: 1 250,5
    var parts = s.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NB);
    return (n < 0 ? '−' : '') + parts.join(',');
  }

  function pct(n) {
    return dec(n, Math.abs(n) >= 10 ? 0 : 1) + '%';
  }

  /* ---- Natija kartasini yangilash ---- */
  function put(id, text) { var el = $(id); if (el) el.textContent = text; }

  // Katta raqam: birlik (so'm) kichikroq va alohida — uzun summada
  // "so'm" so'zi bo'linmasdan keyingi qatorga o'tadi
  function putBig(id, value, unit) {
    var el = $(id);
    if (!el) return;
    el.textContent = value;
    el.classList.toggle('is-long', value.length > 11);
    if (unit) {
      var u = document.createElement('span');
      u.className = 'calc__unit';
      u.textContent = unit;
      el.appendChild(document.createTextNode(' '));
      el.appendChild(u);
    }
  }

  function bigMoney(id, n) {
    putBig(id, (n < 0 ? '−' : '') + group(n, NB), 'so’m');
  }

  function verdict(id, tone, text) {
    var el = $(id);
    if (!el) return;
    if (!text) { el.hidden = true; return; }
    el.hidden = false;
    el.setAttribute('data-tone', tone);
    el.textContent = text;
  }

  /* ================================================================ CAC */
  var cacValue = NaN;

  function calcCac() {
    var ads = num('cac-ads'), other = num('cac-other');
    var leads = num('cac-leads'), clients = num('cac-clients');
    var check = num('cac-check');

    var total = (ok(ads) ? ads : 0) + (ok(other) ? other : 0);
    put('cac-total', total > 0 ? money(total) : '—');
    put('cac-cpl', ok(ads) && ok(leads) ? money(ads / leads) : '—');
    put('cac-conv', ok(leads) && ok(clients) && clients <= leads ? pct(clients / leads * 100) : '—');

    if (!(total > 0) || !ok(clients)) {
      cacValue = NaN;
      put('cac-out', '—');
      verdict('cac-verdict', 'info', total > 0
        ? 'Yangi mijozlar sonini kiriting — CAC shunga bo’linadi.'
        : 'Shu davrdagi reklama xarajatini kiriting.');
      return;
    }

    cacValue = total / clients;
    bigMoney('cac-out', cacValue);

    if (ok(check)) {
      var share = cacValue / check;
      if (share >= 1) {
        verdict('cac-verdict', 'warn',
          'Mijozni jalb qilish uning birinchi xaridi summasidan ' + dec(share) + ' baravar qimmat. ' +
          'Bu faqat mijoz qayta-qayta xarid qilsa o’zini oqlaydi — LTV tabida tekshiring.');
      } else {
        verdict('cac-verdict', 'info',
          'CAC o’rtacha chekning ' + pct(share * 100) + ' iga teng. ' +
          'Birinchi xariddagi foyda CAC dan katta bo’lsa, mijoz darhol o’zini qoplaydi. ' +
          'Bo’lmasa — qayta xaridlar hisobiga, buni LTV ko’rsatadi.');
      }
    } else {
      verdict('cac-verdict', 'info',
        'CAC o’zicha yaxshi ham, yomon ham emas — uni mijoz keltiradigan foyda bilan solishtirish kerak. ' +
        'O’rtacha chekni kiriting yoki LTV ni hisoblang.');
    }
  }

  /* =============================================================== ROMI */
  function calcRomi() {
    var spend = num('romi-spend'), rev = num('romi-rev'), m = num('romi-margin');
    var margin = ok(m) && m <= 100 ? m / 100 : NaN;

    if (!ok(spend) || !(rev >= 0)) {
      ['romi-out', 'romi-profit', 'romi-roas', 'romi-be', 'romi-naive'].forEach(function (id) { put(id, '—'); });
      verdict('romi-verdict', 'info', 'Marketing xarajati va shu reklamadan kelgan savdoni kiriting.');
      return;
    }

    var roas = rev / spend;
    put('romi-roas', dec(roas, 2) + NB + 'so’m');
    put('romi-naive', pct((rev - spend) / spend * 100));

    if (!isFinite(margin)) {
      ['romi-out', 'romi-profit', 'romi-be'].forEach(function (id) { put(id, '—'); });
      verdict('romi-verdict', 'info',
        'ROMI uchun marjani kiriting (0 dan 100 gacha). Usiz faqat tushum hisoblanadi — bu foydani bo’rttiradi.');
      return;
    }

    var profit = rev * margin - spend;
    var romi = profit / spend * 100;
    var be = 1 / margin;

    putBig('romi-out', pct(romi));
    put('romi-profit', money(profit));
    put('romi-be', dec(be, 2) + NB + 'so’m');

    var back = dec(1 + romi / 100, 2);
    if (romi < 0) {
      verdict('romi-verdict', 'bad',
        'Reklama zarar keltiryapti: tikilgan har 1 so’m foyda sifatida ' + back + ' so’m bo’lib qaytyapti. ' +
        'Zararsizlik uchun har 1 so’m reklamaga kamida ' + dec(be, 2) + ' so’m savdo kerak, hozir ' + dec(roas, 2) + '.');
    } else if (romi < 30) {
      verdict('romi-verdict', 'warn',
        'Reklama o’zini oqlayapti, lekin chegarada: har 1 so’m ' + back + ' so’m bo’lib qaytyapti. ' +
        'Narx yoki konversiya biroz tushsa, zararga o’tadi.');
    } else {
      verdict('romi-verdict', 'ok',
        'Reklama foyda keltiryapti: har 1 so’m ' + back + ' so’m bo’lib qaytyapti, ya’ni ' +
        dec(romi / 100, 2) + ' so’m sof foyda. Byudjetni oshirishni o’ylab ko’rsa bo’ladi.');
    }
  }

  /* ================================================================ LTV */
  var ltvCacTouched = false;

  function calcLtv() {
    // CAC birinchi tabdan keladi, agar foydalanuvchi o'zi yozmagan bo'lsa
    var cacEl = $('ltv-cac');
    if (!ltvCacTouched && document.activeElement !== cacEl) {
      cacEl.value = isFinite(cacValue) ? group(cacValue, ' ') : '';
    }

    var check = num('ltv-check'), freq = num('ltv-freq'), life = num('ltv-life');
    var m = num('ltv-margin'), cac = num('ltv-cac');
    var margin = ok(m) && m <= 100 ? m / 100 : NaN;

    var perMonth = ok(freq) ? freq / sel('ltv-freq-per') : NaN;
    var months = ok(life) ? life * sel('ltv-life-unit') : NaN;

    if (!ok(check) || !ok(perMonth) || !ok(months)) {
      ['ltv-out', 'ltv-ratio', 'ltv-payback', 'ltv-rev', 'ltv-count'].forEach(function (id) { put(id, '—'); });
      verdict('ltv-verdict', 'info', 'O’rtacha chek, xaridlar soni va mijoz qancha qolishini kiriting.');
      return;
    }

    var count = perMonth * months;
    var rev = check * count;
    put('ltv-count', dec(count) + NB + 'ta');
    put('ltv-rev', money(rev));

    if (!isFinite(margin)) {
      ['ltv-out', 'ltv-ratio', 'ltv-payback'].forEach(function (id) { put(id, '—'); });
      verdict('ltv-verdict', 'info', 'Marjani kiriting (0 dan 100 gacha) — LTV tushumdan emas, foydadan hisoblanadi.');
      return;
    }

    var ltv = rev * margin;
    var maxCac = ltv / 3;
    bigMoney('ltv-out', ltv);

    if (!ok(cac)) {
      put('ltv-ratio', '—');
      put('ltv-payback', '—');
      verdict('ltv-verdict', 'info',
        'Bitta mijozni jalb qilishga ' + money(maxCac) + 'gacha sarflasangiz, 3 : 1 nisbat saqlanadi. ' +
        'Aniq xulosa uchun CAC ni kiriting.');
      return;
    }

    var ratio = ltv / cac;
    put('ltv-ratio', dec(ratio) + NB + ':' + NB + '1');

    var monthlyProfit = check * perMonth * margin;
    var payback = cac / monthlyProfit;
    if (cac <= check * margin) put('ltv-payback', 'birinchi xariddayoq');
    else if (payback > months) put('ltv-payback', 'qoplanmaydi');
    else put('ltv-payback', dec(payback) + NB + 'oyda');

    if (ratio < 1) {
      verdict('ltv-verdict', 'bad',
        'Har bir yangi mijoz zarar: uni jalb qilish (' + money(cac) + ') u butun davrda keltiradigan foydadan (' + money(ltv) + ') qimmat. ' +
        'CAC ni tushirish yoki qayta xaridlarni ko’paytirish kerak.');
    } else if (ratio < 3) {
      verdict('ltv-verdict', 'warn',
        'Mijoz o’zini qoplaydi, lekin zaxira kam: foydaning katta qismi jalb qilishga ketyapti. ' +
        'Ko’p bizneslar 3 : 1 ni mo’ljal qiladi — buning uchun CAC ' + money(maxCac) + 'dan oshmasligi kerak.');
    } else {
      verdict('ltv-verdict', 'ok',
        'Sog’lom nisbat: mijoz o’z narxini ' + dec(ratio) + ' baravar qoplaydi. ' +
        'Bitta mijozga ' + money(maxCac) + 'gacha sarflasangiz ham 3 : 1 saqlanadi — reklamani kengaytirish mumkin.');
    }
  }

  function calcAll() { calcCac(); calcRomi(); calcLtv(); }

  /* ---- Pul maydonlari: yozish paytida 1 250 000 ko'rinishiga keltiramiz ---- */
  function formatLive(el) {
    var pos = el.selectionStart || 0;
    var digitsBefore = el.value.slice(0, pos).replace(/\D/g, '').length;
    var digits = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    var out = digits ? group(Number(digits), ' ') : '';
    el.value = out;
    // Kursorni o'sha raqamdan keyinga qaytaramiz
    var i = 0, seen = 0;
    while (i < out.length && seen < digitsBefore) {
      if (/\d/.test(out[i])) seen++;
      i++;
    }
    try { el.setSelectionRange(i, i); } catch (e) { /* ba'zi brauzerlar */ }
  }

  root.addEventListener('input', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-num')) formatLive(el);
    if (el.id === 'ltv-cac') ltvCacTouched = el.value.trim() !== '';

    // Bir xil ma'lumot (chek, marja) barcha tablarda bir xil tursin
    var key = el.getAttribute('data-key');
    if (key) {
      root.querySelectorAll('[data-key="' + key + '"]').forEach(function (other) {
        if (other !== el) other.value = el.value;
      });
    }
    calcAll();
  });

  root.addEventListener('change', function (e) {
    if (e.target.tagName === 'SELECT') calcAll();
  });

  /* ---- Tozalash ---- */
  root.querySelectorAll('[data-clear]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var form = btn.closest('form');
      form.querySelectorAll('input').forEach(function (i) { i.value = ''; });
      if (form.querySelector('#ltv-cac')) ltvCacTouched = false;
      calcAll();
      var first = form.querySelector('input');
      if (first) first.focus();
    });
  });

  /* ---- "LTV ni hisoblang" — boshqa tabga o'tish ---- */
  root.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = $(btn.getAttribute('data-goto'));
      if (!tab) return;
      tab.click();
      var bar = root.querySelector('.switch');
      if (bar) bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      tab.focus({ preventScroll: true });
    });
  });

  // Enter bosilganda forma sahifani yangilamasin
  root.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); });
  });

  calcAll();
})();
