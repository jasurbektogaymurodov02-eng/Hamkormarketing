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

  // Foiz o'zgarishi: −33%, +12%
  function delta(n) {
    return (n > 0 ? '+' : '') + pct(n);
  }

  function times(n) { return dec(n) + NB + 'baravar'; }

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

  /* ==================================================== Batafsil tahlil */
  // Har bir topilma: { tone, title, text, todo: [...] }.
  // Ta'sir jadvali: [{ label, value, change, good }] — "agar buni o'zgartirsangiz".

  var TAG = { bad: 'Xavf', warn: 'E’tibor bering', info: 'Eslatma', ok: 'Yaxshi' };
  var RANK = { bad: 0, warn: 1, ok: 2, info: 3 };

  function node(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function hideDiag(id) { var box = $(id); if (box) box.hidden = true; }

  function renderDiag(id, items, whatif, valueHead) {
    var box = $(id);
    if (!box) return;
    items = items.filter(Boolean).sort(function (a, b) { return RANK[a.tone] - RANK[b.tone]; });
    box.textContent = '';
    if (!items.length) { box.hidden = true; return; }
    box.hidden = false;

    var head = node('div', 'diag__head');
    head.appendChild(node('h3', null, 'Batafsil tahlil'));
    var main = items[0];
    var sum = node('p', 'diag__sum');
    if (main.tone === 'bad' || main.tone === 'warn') {
      sum.appendChild(document.createTextNode('Asosiy muammo: '));
      sum.appendChild(node('strong', null, main.title));
    } else {
      sum.textContent = 'Jiddiy muammo topilmadi. Quyida — o’sish uchun nimaga e’tibor berish kerakligi.';
    }
    head.appendChild(sum);
    box.appendChild(head);

    var list = node('ol', 'diag__list');
    items.forEach(function (it) {
      var li = node('li', 'diag__item');
      li.setAttribute('data-tone', it.tone);
      li.appendChild(node('span', 'diag__tag', TAG[it.tone]));
      li.appendChild(node('h4', null, it.title));
      li.appendChild(node('p', null, it.text));
      if (it.todo && it.todo.length) {
        li.appendChild(node('span', 'diag__label', 'Nima qilish kerak'));
        var ul = node('ul', 'diag__do');
        it.todo.forEach(function (t) { ul.appendChild(node('li', null, t)); });
        li.appendChild(ul);
      }
      list.appendChild(li);
    });
    box.appendChild(list);

    if (whatif && whatif.length) {
      var wi = node('div', 'diag__whatif');
      wi.appendChild(node('span', 'diag__label', 'Agar o’zgartirsangiz — natija qanday bo’ladi'));
      var hd = node('div', 'diag__row diag__row--head');
      hd.appendChild(node('span', null, 'Nimani o’zgartirish'));
      hd.appendChild(node('span', null, valueHead));
      hd.appendChild(node('span', null, 'Farq'));
      wi.appendChild(hd);
      whatif.sort(function (a, b) { return b.score - a.score; }).forEach(function (w, i) {
        var row = node('div', 'diag__row' + (i === 0 ? ' is-best' : ''));
        row.appendChild(node('span', 'diag__lever', w.label));
        row.appendChild(node('span', 'diag__val', w.value));
        var ch = node('span', 'diag__chg', w.change);
        ch.setAttribute('data-good', String(w.score > 0));
        row.appendChild(ch);
        wi.appendChild(row);
      });
      wi.appendChild(node('p', 'diag__hint', 'Birinchi qator — eng katta ta’sir beradigan dastak. Odatda ishni shundan boshlash kerak.'));
      box.appendChild(wi);
    }

    box.appendChild(node('p', 'diag__note',
      'Chegaralar (masalan, konversiya 5% dan past) taxminiy mo’ljal — sohangizga qarab farq qiladi. ' +
      'Aniq xulosa uchun raqamlarni kanallar bo’yicha alohida ko’rish kerak.'));
  }

  /* ================================================================ CAC */
  var cacValue = NaN;
  var marginTouched = false; // marjani foydalanuvchi o'zi yozganmi

  function calcCac() {
    var ads = num('cac-ads'), other = num('cac-other');
    var leads = num('cac-leads'), clients = num('cac-clients');
    var check = num('cac-check');

    var adsV = ok(ads) ? ads : 0, otherV = ok(other) ? other : 0;
    var total = adsV + otherV;
    put('cac-total', total > 0 ? money(total) : '—');
    put('cac-cpl', ok(ads) && ok(leads) ? money(ads / leads) : '—');
    put('cac-conv', ok(leads) && ok(clients) && clients <= leads ? pct(clients / leads * 100) : '—');

    if (!(total > 0) || !ok(clients)) {
      cacValue = NaN;
      put('cac-out', '—');
      verdict('cac-verdict', 'info', total > 0
        ? 'Yangi mijozlar sonini kiriting — CAC shunga bo’linadi.'
        : 'Shu davrdagi reklama xarajatini kiriting.');
      hideDiag('cac-diag');
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

    diagCac(adsV, otherV, total, leads, clients, check);
  }

  function diagCac(ads, other, total, leads, clients, check) {
    var cac = total / clients;
    var items = [];
    var conv = ok(leads) ? clients / leads : NaN;
    var badConv = isFinite(conv) && conv < 0.05;

    // 1. Sotuv: murojaatlar mijozga aylanyaptimi
    if (!ok(leads)) {
      items.push({ tone: 'info', title: 'Muammo reklamadami yoki sotuvdami — hali noma’lum',
        text: 'Murojaatlar sonini kiriting. Shunda CAC qimmatligining sababi ko’rinadi: reklama kam odam olib kelyaptimi yoki kelganlar xarid qilmayaptimi.' });
    } else if (clients > leads) {
      items.push({ tone: 'warn', title: 'Mijozlar murojaatlardan ko’p chiqdi',
        text: 'Yangi mijozlar (' + dec(clients, 0) + ' ta) murojaatlardan (' + dec(leads, 0) + ' ta) ko’p. Demak, ularning bir qismi shu reklamadan emas: tavsiya bilan kelganlar, eski mijozlar yoki boshqa kanal. Bunda CAC haqiqatdagidan arzon ko’rinadi.',
        todo: ['Faqat shu reklama orqali kelgan yangi mijozlarni sanang',
          'Har murojaatda «Bizni qayerdan topdingiz?» deb so’rang va yozib boring'] });
    } else if (badConv) {
      items.push({ tone: 'bad', title: 'Murojaatlar mijozga aylanmayapti — muammo sotuvda',
        text: '100 ta murojaatdan atigi ' + dec(conv * 100) + ' tasi xarid qilyapti. Reklama odam olib kelyapti (' + dec(leads, 0) + ' ta murojaat), lekin ular sotuv bosqichida yo’qolyapti. Bunday holatda reklamaga pul qo’shish faqat yo’qotishni ko’paytiradi.',
        todo: ['Murojaatlarga qancha vaqtda javob berilayotganini tekshiring — kech javob mijozni raqobatchiga olib ketadi',
          'Javobsiz qolgan yoki bir marta gaplashib tashlab qo’yilgan murojaatlarni sanang',
          'Sotuvchi suhbatlarini (yozishma, qo’ng’iroq) o’qib-eshitib ko’ring: narxni aytib, qayta aloqa qilmaslik — eng ko’p uchraydigan xato',
          'Murojaat qoldirganlar haqiqatan sizning mijozingizmi — reklama auditoriyasini tekshiring'] });
    } else if (conv < 0.15) {
      items.push({ tone: 'info', title: 'Sotuv konversiyasi o’rtacha',
        text: 'Murojaatlarning ' + pct(conv * 100) + ' i mijozga aylanyapti. Yomon emas, lekin bu yerda o’sish eng arzon: reklamaga qo’shimcha pul sarflamasdan mijoz ko’payadi.',
        todo: ['Xarid qilmaganlarga 2–3 kundan keyin qayta yozing yoki qo’ng’iroq qiling',
          'Eng ko’p uchraydigan e’tirozlarga («qimmat», «o’ylab ko’raman») tayyor javob yozib chiqing'] });
    } else {
      items.push({ tone: 'ok', title: 'Sotuv yaxshi ishlayapti',
        text: 'Murojaatlarning ' + pct(conv * 100) + ' i mijozga aylanyapti — kuchli ko’rsatkich. Endi o’sishning asosiy dastagi — murojaatlar soni.',
        todo: ['Ishlayotgan reklamani bosqichma-bosqich kengaytiring va bitta murojaat narxi (CPL) o’sib ketmasligini kuzating'] });
    }

    // 2. Xarajat tuzilmasi: pul reklamaga ketyaptimi yoki atrofidagi ishlarga
    var otherShare = other / total;
    if (other > 0 && otherShare > 0.5) {
      items.push({ tone: 'warn', title: 'Xarajatning katta qismi reklamaga emas',
        text: 'Jami ' + money(total) + 'dan ' + money(other) + ' (' + pct(otherShare * 100) + ') — xizmatlar, dizayn, agentlik kabi doimiy xarajat. Reklamaning o’zi ' + money(ads) + '. Doimiy xarajat oz sonli mijozga bo’linganda har biriga og’ir tushadi: faqat reklama hisobidan CAC ' + money(ads / clients) + ' bo’lardi.',
        todo: [badConv
            ? 'Avval sotuvni tuzating, keyin reklama byudjetini oshiring — aks holda qo’shimcha pul ham yo’qoladi'
            : 'Doimiy xarajatni ko’proq mijozga bo’lish uchun reklama byudjetini oshirishni ko’rib chiqing',
          'Har bir xizmat (SMM, dizayn, video) natijaga qanday hissa qo’shayotganini hisobot bilan so’rang'] });
    }

    // 3. CAC birinchi xarid bilan solishtirganda
    if (ok(check)) {
      var m = marginTouched ? num('ltv-margin') / 100 : NaN;
      var hasM = isFinite(m) && m > 0 && m <= 1;
      var need = hasM ? cac / (check * m) : cac / check;
      if (need > 1) {
        items.push({ tone: need > 3 ? 'bad' : 'warn',
          title: 'Mijoz o’zini qoplashi uchun kamida ' + Math.ceil(need) + ' ta xarid kerak',
          text: hasM
            ? 'Bitta xariddan qoladigan foyda ' + money(check * m) + ' (marja ' + pct(m * 100) + '). CAC ' + money(cac) + 'ni qoplash uchun mijoz kamida ' + Math.ceil(need) + ' marta xarid qilishi kerak.'
            : 'Tannarxni hisobga olmasak ham, CAC o’rtacha chekdan ' + times(need) + ' katta: mijoz kamida ' + Math.ceil(need) + ' marta xarid qilmasa, uni jalb qilish zarar. Tannarx bilan bu son yana ko’payadi — aniq hisob uchun LTV tabida marjani kiriting.',
          todo: ['Mijozlaringiz haqiqatan necha marta qaytib xarid qilishini hisoblang (LTV tabi)',
            'Birinchi xariddan keyin qayta sotuv tizimini quring: mijozlar bazasi, eslatmalar, maxsus taklif',
            'Xaridingiz bir martalik bo’lsa (masalan, qimmat xizmat), CAC chekdagi foydadan past bo’lishi shart'] });
      } else {
        items.push({ tone: 'ok', title: 'Mijoz birinchi xariddayoq o’zini qoplaydi',
          text: hasM
            ? 'Birinchi xariddan qoladigan foyda (' + money(check * m) + ') CAC dan (' + money(cac) + ') katta.'
            : 'CAC o’rtacha chekning ' + pct(cac / check * 100) + ' i. Marja shundan yuqori bo’lsa, mijoz birinchi xariddayoq o’zini qoplaydi.',
          todo: ['Byudjetni oshirganda CAC qanday o’zgarishini kuzating — hajm oshgani sari yangi mijoz odatda qimmatlashadi'] });
      }
    }

    // Ta'sir jadvali
    var whatif = [];
    function row(label, newCac) {
      var d = (newCac - cac) / cac * 100;
      whatif.push({ label: label, value: money(newCac), change: delta(d), score: -d });
    }
    if (ok(leads) && clients <= leads) {
      if (conv < 0.1) row('Sotuv konversiyasi 10% ga chiqsa (' + pct(conv * 100) + ' → 10%)', total / (leads * 0.1));
      else row('Sotuv konversiyasi 1,5 baravar oshsa (' + pct(conv * 100) + ' → ' + pct(conv * 150) + ')', total / (clients * 1.5));
    }
    if (ads > 0) row('Reklama 20% arzonga xuddi shuncha murojaat olib kelsa', (ads * 0.8 + other) / clients);
    if (other > 0) row('Boshqa marketing xarajatlari 30% qisqarsa', (ads + other * 0.7) / clients);

    renderDiag('cac-diag', items, whatif, 'Yangi CAC');
  }

  /* =============================================================== ROMI */
  function calcRomi() {
    var spend = num('romi-spend'), rev = num('romi-rev'), m = num('romi-margin');
    var margin = ok(m) && m <= 100 ? m / 100 : NaN;

    if (!ok(spend) || !(rev >= 0)) {
      ['romi-out', 'romi-profit', 'romi-roas', 'romi-be', 'romi-naive'].forEach(function (id) { put(id, '—'); });
      verdict('romi-verdict', 'info', 'Marketing xarajati va shu reklamadan kelgan savdoni kiriting.');
      hideDiag('romi-diag');
      return;
    }

    var roas = rev / spend;
    put('romi-roas', dec(roas, 2) + NB + 'so’m');
    put('romi-naive', pct((rev - spend) / spend * 100));

    if (!isFinite(margin)) {
      ['romi-out', 'romi-profit', 'romi-be'].forEach(function (id) { put(id, '—'); });
      verdict('romi-verdict', 'info',
        'ROMI uchun marjani kiriting (0 dan 100 gacha). Usiz faqat tushum hisoblanadi — bu foydani bo’rttiradi.');
      hideDiag('romi-diag');
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

    diagRomi(spend, rev, margin, profit, romi, be);
  }

  function diagRomi(spend, rev, m, profit, romi, be) {
    var items = [];
    var beRev = spend / m;               // zararsizlik uchun kerakli savdo
    var cushion = rev > 0 ? (1 - beRev / rev) * 100 : 0; // savdo qancha tushsa ham zarar yo'q

    // 1. Natija
    if (romi < 0) {
      items.push({ tone: 'bad', title: 'Reklama zararga ishlayapti',
        text: 'Marketingga ' + money(spend) + ' sarflandi, savdodan qolgan foyda esa ' + money(rev * m) + ' — zarar ' + money(-profit) + '. Shu xarajatda zararsizlik uchun savdo kamida ' + money(beRev) + ' bo’lishi kerak — hozirgidan ' + money(beRev - rev) + ' (' + pct((beRev - rev) / Math.max(rev, 1) * 100) + ') ko’p.',
        todo: ['Reklamani kanallar bo’yicha alohida hisoblang — odatda zararning katta qismi bitta-ikkita kanaldan keladi',
          'Eng samarasiz kanalni to’xtatib, pulni ishlayotganiga o’tkazing',
          'Savdoni oshirmasdan foydani ko’tarish: o’rtacha chekni oshirish (qo’shimcha mahsulot, to’plam), narxni qayta ko’rib chiqish'] });
    } else if (romi < 30) {
      items.push({ tone: 'warn', title: 'Foyda bor, lekin zaxira yupqa',
        text: 'Har 1 so’m reklama ' + dec(romi / 100, 2) + ' so’m sof foyda qoldiryapti. Savdo atigi ' + pct(cushion) + ' ga tushsa, zararga o’tasiz.',
        todo: ['Chek, narx yoki konversiyani yaxshilamasdan byudjetni oshirmang',
          'Natijani har hafta kuzating — ROMI pasaya boshlasa, tez to’xtatish uchun'] });
    } else if (romi < 100) {
      items.push({ tone: 'ok', title: 'Reklama foyda keltiryapti',
        text: 'Har 1 so’m reklama ' + dec(romi / 100, 2) + ' so’m sof foyda qoldiryapti. Savdo ' + pct(cushion) + ' gacha tushsa ham zararga o’tmaysiz.',
        todo: ['Byudjetni bosqichma-bosqich (masalan, 20–30% dan) oshiring va har bosqichda ROMI ni qayta hisoblang'] });
    } else {
      items.push({ tone: 'ok', title: 'Kuchli natija — kengaytirishga tayyor',
        text: 'Har 1 so’m reklama ' + dec(romi / 100, 2) + ' so’m sof foyda keltiryapti. Savdo ' + pct(cushion) + ' gacha tushsa ham zararga o’tmaysiz.',
        todo: ['Byudjetni oshiring, lekin bosqichma-bosqich: hajm oshganda yangi auditoriya odatda qimmatroq tushadi',
          'Natija haqiqiyligini tekshiring (pastdagi eslatma)'] });
    }

    // 2. Marja
    if (m < 0.25) {
      items.push({ tone: 'warn', title: 'Marja past — reklama uchun joy kam',
        text: 'Marja ' + pct(m * 100) + ' bo’lsa, har 1 so’m reklama kamida ' + dec(be, 2) + ' so’m savdo olib kelishi kerak. Marja ikki baravar bo’lsa, bu chegara ' + dec(be / 2, 2) + ' so’mga tushardi.',
        todo: ['Tannarxni qayta ko’rib chiqing: yetkazib beruvchi, logistika, isrof',
          'Reklamada yuqori marjali mahsulot va xizmatlarni oldinga chiqaring',
          'Past marjada chegirma bilan sotish ayniqsa xavfli — foydani butunlay yeb qo’yadi'] });
    }

    // 3. Tushumdan hisoblangan ROI aldashi
    if (m < 1 && rev > 0) {
      var naive = (rev - spend) / spend * 100;
      items.push({ tone: 'info', title: 'Tushumdan hisoblangan ROI natijani bo’rttiradi',
        text: 'Tushum bo’yicha ROI ' + pct(naive) + ', haqiqiy ROMI esa ' + pct(romi) + '. Farq ' + dec(naive - romi, 0) + ' punkt — bu tannarx. Agentlik yoki xodim hisobotida ROI tushumdan hisoblangan bo’lsa, shu farqni yodda tuting.',
        todo: ['Hisobotlarda ROMI ni doim marja bilan, foydadan hisoblashni talab qiling'] });
    }

    // 4. Savdo haqiqatan shu reklamadanmi
    if (romi >= 30) {
      items.push({ tone: 'info', title: 'Savdo haqiqatan shu reklamadan kelganmi?',
        text: 'Savdoga doimiy mijozlar, tavsiya bilan kelganlar yoki boshqa kanal qo’shilib ketgan bo’lsa, ROMI haqiqatdagidan yuqori ko’rinadi.',
        todo: ['Mijozdan «Bizni qayerdan topdingiz?» deb so’rang',
          'Reklamaga alohida promokod, telefon raqam yoki havola bering'] });
    }

    // Ta'sir jadvali
    var whatif = [];
    function row(label, newRomi) {
      var d = newRomi - romi;
      whatif.push({ label: label, value: pct(newRomi), change: (d > 0 ? '+' : '') + dec(d, 0) + ' punkt', score: d });
    }
    row('Shu xarajatda savdo 20% oshsa', (rev * 1.2 * m - spend) / spend * 100);
    if (m <= 0.95) row('Marja 5 punktga oshsa (' + pct(m * 100) + ' → ' + pct(m * 100 + 5) + ')', (rev * (m + 0.05) - spend) / spend * 100);
    row('Eng samarasiz 20% xarajat kesilsa, savdo deyarli o’zgarmasa', (rev * m - spend * 0.8) / (spend * 0.8) * 100);

    renderDiag('romi-diag', items, whatif, 'Yangi ROMI');
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
      hideDiag('ltv-diag');
      return;
    }

    var count = perMonth * months;
    var rev = check * count;
    put('ltv-count', dec(count) + NB + 'ta');
    put('ltv-rev', money(rev));

    if (!isFinite(margin)) {
      ['ltv-out', 'ltv-ratio', 'ltv-payback'].forEach(function (id) { put(id, '—'); });
      verdict('ltv-verdict', 'info', 'Marjani kiriting (0 dan 100 gacha) — LTV tushumdan emas, foydadan hisoblanadi.');
      hideDiag('ltv-diag');
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
      diagLtv(check, perMonth, months, margin, NaN, count, ltv);
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

    diagLtv(check, perMonth, months, margin, cac, count, ltv);
  }

  function diagLtv(check, perMonth, months, m, cac, count, ltv) {
    var items = [];
    var hasCac = ok(cac);
    var monthlyProfit = check * perMonth * m;
    var maxCac = ltv / 3;
    var ratio = hasCac ? ltv / cac : NaN;
    var months3 = hasCac ? 3 * cac / monthlyProfit : NaN; // 3:1 uchun kerakli muddat
    var payback = hasCac ? cac / monthlyProfit : NaN;

    // 3 : 1 ga yetish yo'li. Kerakli muddat haqiqatdan yiroq bo'lsa
    // (3 yildan va hozirgisidan 3 baravardan ko'p), faqat CAC ni tushirishni aytamiz.
    var path = months3 <= Math.max(36, months * 3)
      ? '3 : 1 ga yetish uchun yo CAC ' + money(maxCac) + 'gacha tushishi, yo mijoz ' + dec(months3) + ' oy qolishi kerak (hozir ' + dec(months) + ').'
      : 'Faqat mijozni uzoqroq ushlab qolish bilan bu farqni yopib bo’lmaydi (' + dec(months3, 0) + ' oy kerak bo’lardi) — CAC ni tushirish shart: 3 : 1 uchun u ' + money(maxCac) + 'gacha tushishi kerak.';

    // 1. LTV : CAC
    if (!hasCac) {
      items.push({ tone: 'info', title: 'CAC kiritilmagan — nisbatni hisoblab bo’lmaydi',
        text: 'Mijoz butun davrda ' + money(ltv) + ' foyda beradi. 3 : 1 mo’ljali bilan bitta mijozni jalb qilishga ' + money(maxCac) + 'gacha sarflash mumkin.',
        todo: ['CAC tabida bitta mijoz necha pulga tushayotganini hisoblang'] });
    } else if (ratio < 1) {
      items.push({ tone: 'bad', title: 'Har yangi mijoz zarar keltiradi',
        text: 'Mijoz butun davrda ' + money(ltv) + ' foyda beradi, uni jalb qilish esa ' + money(cac) + '. Mijoz ketguncha uning narxi qoplanmaydi. ' + path,
        todo: ['Hozircha reklamani kengaytirmang — har yangi mijoz zararni oshiradi',
          'CAC tabida qayerda qimmat tushayotganini aniqlang: reklamami, sotuvmi, doimiy xarajatmi',
          'Mavjud mijozlarga qayta soting — ular uchun jalb qilish xarajati yo’q'] });
    } else if (ratio < 3) {
      items.push({ tone: 'warn', title: 'Mijoz o’zini qoplaydi, lekin o’sishga pul qolmaydi',
        text: 'Mijoz keltiradigan foydaning ' + pct(cac / ltv * 100) + ' i uni jalb qilishga ketyapti. ' + path,
        todo: ['Mijozni ushlab qolish muddatini oshiring: xizmat sifati, eslatmalar, sodiqlik dasturi',
          'CAC ni pasaytirish yo’llarini CAC tabidagi tahlildan qarang'] });
    } else if (ratio <= 5) {
      items.push({ tone: 'ok', title: 'Sog’lom nisbat',
        text: 'Mijoz o’z narxini ' + times(ratio) + ' qoplaydi. CAC ' + money(maxCac) + 'gacha o’ssa ham nisbat 3 : 1 da qoladi.',
        todo: ['Reklamani bosqichma-bosqich kengaytirish mumkin — har bosqichda CAC ni qayta hisoblang'] });
    } else {
      items.push({ tone: 'ok', title: 'Nisbat juda yuqori — o’sish imkoniyati qolib ketyapti',
        text: 'Mijoz o’z narxini ' + times(ratio) + ' qoplaydi. Bu yaxshi, lekin ehtimol marketingga kam sarflayapsiz: reklama ko’paysa, bozorning katta qismini olish mumkin, nisbat esa baribir sog’lom qoladi.',
        todo: ['Byudjetni bosqichma-bosqich oshiring — CAC ' + money(maxCac) + 'gacha o’ssa ham 3 : 1 saqlanadi',
          'Yangi kanallarni sinab ko’ring: hozirgisi to’yinib qolganda o’sish to’xtamaydi'] });
    }

    // 2. Pul qancha vaqt muzlab turadi
    if (hasCac && ratio >= 1 && payback > 12) {
      items.push({ tone: 'warn', title: 'Mijozga sarflangan pul uzoq qaytadi',
        text: 'CAC ' + dec(payback) + ' oyda qoplanadi. Shu vaqt davomida reklama uchun aylanma mablag’ kerak — tez o’sish pul yetishmovchiligiga olib kelishi mumkin.',
        todo: ['Birinchi xaridni kattalashtiring: to’plam, oldindan to’lov, abonement',
          'Qayta xaridlarni tezlashtiring: eslatma, mavsumiy taklif'] });
    }

    // 3. Qayta xaridlar
    if (count < 2) {
      items.push({ tone: 'warn', title: 'Mijozlar deyarli qaytib kelmayapti',
        text: 'Bitta mijoz butun davrda o’rtacha ' + dec(count) + ' marta xarid qiladi — LTV amalda birinchi xariddan iborat. Qayta sotuv — eng arzon o’sish: bu mijozni jalb qilishga pul allaqachon sarflangan.',
        todo: ['Mijozlar bazasini yig’ing: ism, telefon, nima sotib olgani',
          'Xariddan keyin eslatma va maxsus taklif yuboring (Telegram, SMS)',
          'Qo’shimcha mahsulot yoki xizmat taklif qiling',
          'Xizmatingiz bir martalik bo’lsa — mijoz tavsiyasi bilan yangi mijoz olib kelishni rag’batlantiring'] });
    }

    // 4. Marja
    if (m < 0.25) {
      items.push({ tone: 'warn', title: 'Marja past — mijoz qiymati kichik',
        text: 'Marja ' + pct(m * 100) + ' bo’lgani uchun ' + money(check) + 'lik xariddan atigi ' + money(check * m) + ' foyda qoladi. Marjani 5 punktga oshirish LTV ni ' + delta(5 / (m * 100) * 100) + ' ko’taradi.',
        todo: ['Tannarx va narxni qayta ko’rib chiqing',
          'Yuqori marjali mahsulotlarni ko’proq taklif qiling'] });
    }

    // Ta'sir jadvali
    var whatif = [];
    function row(label, newLtv) {
      var d = (newLtv - ltv) / ltv * 100;
      whatif.push({ label: label,
        value: money(newLtv) + (hasCac ? ' (' + dec(newLtv / cac) + NB + ':' + NB + '1)' : ''),
        change: delta(d), score: d });
    }
    row('Mijoz 2 oy ko’proq qolsa (' + dec(months) + ' → ' + dec(months + 2) + ' oy)', ltv * (months + 2) / months);
    row('O’rtacha chek 10% oshsa', ltv * 1.1);
    row('Har mijoz yana 1 marta ko’proq xarid qilsa', (count + 1) * check * m);

    renderDiag('ltv-diag', items, whatif, 'Yangi LTV');
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
      if (key === 'margin') marginTouched = el.value.trim() !== '';
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
