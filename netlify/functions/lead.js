/**
 * Netlify Function: /.netlify/functions/lead
 *
 * Saytdagi ariza formasini ikki joyga yuboradi:
 *   1) Telegram bot  — darhol xabar berish uchun
 *   2) Google Sheets — arxiv va tahlil uchun
 *
 * Maxfiy kalitlar SHU YERDA, serverda turadi — brauzerga chiqmaydi.
 *
 * Netlify'da sozlash: Site configuration → Environment variables
 *   TELEGRAM_BOT_TOKEN = 1234567890:AA...      (@BotFather bergan token)
 *   TELEGRAM_CHAT_ID   = -1001234567890        (guruh) yoki 123456789 (shaxsiy)
 *   SHEETS_WEBHOOK_URL = https://script.google.com/macros/s/.../exec
 *   SHEETS_SECRET      = o'zingiz o'ylab topgan uzun parol
 *
 * Sheets sozlanmagan bo'lsa ham forma ishlayveradi — faqat Telegramga tushadi.
 *
 * Eslatma: package.json da "type": "module" turgani uchun bu fayl ES module
 * sintaksisida yozilgan (export const handler). CommonJS (exports.handler)
 * ishlatilsa Netlify'da funksiya ishga tushmaydi.
 */

const esc = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 800);

const clean = (s) => String(s || '').trim().slice(0, 800);

// --------------------------------------------------------------- Telegram
async function sendTelegram(data, vaqt) {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TOKEN || !CHAT_ID) {
    console.error('Telegram sozlanmagan: TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yo\'q');
    return false;
  }

  const lines = [
    '<b>Yangi ariza — Hamkor sayti</b>',
    '',
    `<b>Ism:</b> ${esc(data.name)}`,
    `<b>Telefon:</b> ${esc(data.phone)}`,
    data.business ? `<b>Biznes:</b> ${esc(data.business)}` : null,
    data.service ? `<b>Xizmat:</b> ${esc(data.service)}` : null,
    data.message ? `<b>Izoh:</b> ${esc(data.message)}` : null,
    '',
    `<i>${esc(vaqt)} · ${esc(data.page || '/')}</i>`
  ].filter(Boolean);

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  const out = await res.json();
  if (!out.ok) console.error('Telegram xatosi:', out);
  return !!out.ok;
}

// ---------------------------------------------------------- Google Sheets
async function sendSheets(data, vaqt) {
  const URL = process.env.SHEETS_WEBHOOK_URL;
  const SECRET = process.env.SHEETS_SECRET;
  if (!URL) return null; // sozlanmagan — bu xato emas

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Apps Script qayta yo'naltiradi, shuning uchun redirect'ni kuzatamiz
    redirect: 'follow',
    body: JSON.stringify({
      secret: SECRET || '',
      vaqt,
      name: clean(data.name),
      phone: clean(data.phone),
      business: clean(data.business),
      service: clean(data.service),
      message: clean(data.message),
      page: clean(data.page)
    })
  });

  const text = await res.text();
  let ok = false;
  try { ok = JSON.parse(text).ok === true; } catch { ok = res.ok; }
  if (!ok) console.error('Sheets xatosi:', res.status, text.slice(0, 200));
  return ok;
}

// ------------------------------------------------------------------ Asosiy
export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'method' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'json' }) };
  }

  // Honeypot: bot to'ldirsa, jim qaytaramiz
  if (data.company) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  const name = clean(data.name);
  const phone = clean(data.phone);

  if (name.length < 2 || phone.replace(/\D/g, '').length < 9) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'validation' }) };
  }

  const vaqt = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Ikkalasini parallel yuboramiz. Biri ishlamay qolsa ham lid yo'qolmaydi.
  const [tg, sheets] = await Promise.allSettled([
    sendTelegram(data, vaqt),
    sendSheets(data, vaqt)
  ]);

  const tgOk = tg.status === 'fulfilled' && tg.value === true;
  const shOk = sheets.status === 'fulfilled' && sheets.value === true;

  if (tg.status === 'rejected') console.error('Telegram tashladi:', tg.reason);
  if (sheets.status === 'rejected') console.error('Sheets tashladi:', sheets.reason);

  // Kamida bittasi yetib borgan bo'lsa, foydalanuvchiga muvaffaqiyat ko'rsatamiz
  if (tgOk || shOk) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, telegram: tgOk, sheets: shOk }) };
  }

  return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'delivery' }) };
};
