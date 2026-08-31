/**
 * Hamkor sayti — arizalarni Google Sheets'ga yozish
 *
 * Bu kod Google Sheets ichida ishlaydi (Apps Script).
 * O'rnatish tartibi README.md faylining "Google Sheets" bo'limida.
 *
 * MUHIM: quyidagi ikki qatorni o'zingiznikiga almashtiring.
 */

// Jadval manzilidagi uzun kod (docs.google.com/spreadsheets/d/BU_YER/edit)
const SHEET_ID = '1rIdwFlwMuHcwKxkk_1kRIP5KEyazqiGSRW_Y7Dnp5uk';

// O'zingiz o'ylab topgan uzun parol. Aynan shu qiymatni Netlify'da
// SHEETS_SECRET nomi bilan ham yozasiz. Ikkalasi bir xil bo'lishi shart.
const SECRET = 'BU_YERGA_UZUN_PAROL_YOZING';

// Sarlavha qatori
const HEADERS = ['Sana', 'Ism', 'Telefon', 'Biznes', 'Xizmat', 'Izoh', 'Sahifa'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Parolni tekshiramiz — begona odam jadvalga yoza olmasin
    if (data.secret !== SECRET) {
      return json({ ok: false, error: 'auth' });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

    // Jadval bo'sh bo'lsa, avval sarlavhalarni qo'yamiz
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setFontWeight('bold')
        .setBackground('#00423E')
        .setFontColor('#F1EFE2');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 140); // Sana
      sheet.setColumnWidth(2, 140); // Ism
      sheet.setColumnWidth(3, 150); // Telefon
      sheet.setColumnWidth(4, 180); // Biznes
      sheet.setColumnWidth(5, 180); // Xizmat
      sheet.setColumnWidth(6, 320); // Izoh
    }

    sheet.appendRow([
      data.vaqt || new Date(),
      data.name || '',
      data.phone || '',
      data.business || '',
      data.service || '',
      data.message || '',
      data.page || ''
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Brauzerdan ochib tekshirish uchun
function doGet() {
  return json({ ok: true, info: 'Hamkor lead webhook ishlayapti' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
