# Hamkor sayti — o'rnatish va boshqarish

Bu saytda **admin panel** bor. Bir marta sozlagandan keyin maqola yozish, keys
qo'shish va telefon raqamini o'zgartirish uchun brauzerdan `sayt.uz/admin` ga
kirasiz — hech qanday fayl yoki kod bilan ishlamaysiz.

Sozlash taxminan 30-40 daqiqa oladi. Quyida har bir tugmagacha yozilgan.

---

## Nima kerak

- GitHub akkaunti (bepul) — fayllar shu yerda saqlanadi
- Netlify akkaunti (bepul) — sayt shu yerda ishlaydi
- Telegram bot — arizalar shu yerga tushadi

---

## 1-qadam. Telegram bot

1. Telegramda **@BotFather** ni toping → `/newbot` yozing.
2. Botga nom va username bering. BotFather sizga **token** beradi
   (`1234567890:AAH...` ko'rinishida) — uni nusxalab qo'ying.
3. Arizalar tushadigan **guruh** yarating, botni guruhga qo'shing va admin qiling.
4. Guruhga istalgan xabar yozing.
5. Brauzerda oching (TOKEN o'rniga o'zingiznikini qo'ying):
   `https://api.telegram.org/bot TOKEN /getUpdates` — bo'shliqsiz yozing.
6. Chiqqan matndan `"chat":{"id":-1001234567890` qismidagi **raqamni** oling
   (minus belgisi bilan birga). Bu — `chat_id`.

Token va chat_id ni yozib qo'ying, 4-qadamda kerak bo'ladi.

---

## 2-qadam. GitHub'ga fayllarni yuklash

1. [github.com](https://github.com) da ro'yxatdan o'ting.
2. O'ng yuqoridagi **+** → **New repository**.
3. Repository name: `hamkor-sayt`. **Public** yoki **Private** — farqi yo'q.
   **Add a README file** ni belgilamang. → **Create repository**.
4. Ochilgan sahifada **uploading an existing file** havolasini bosing.
5. Kompyuterda ZIP faylni oching (unzip qiling). Ochilgan papka **ichidagi**
   hamma narsani (fayl va papkalarni) brauzer oynasiga sudrab tashlang.

   > Papkaning o'zini emas, ichidagilarni tashlang. `node_modules` degan papka
   > bo'lmasligi kerak — ZIP ichida u yo'q, hammasi joyida.

6. Pastdagi **Commit changes** tugmasini bosing. Yuklash bir necha daqiqa oladi.

---

## 3-qadam. Netlify'ga ulash

1. [app.netlify.com](https://app.netlify.com) da **Sign up with GitHub** orqali kiring.
2. **Add new site** → **Import an existing project** → **GitHub** → `hamkor-sayt` ni tanlang.
3. Sozlamalar avtomatik to'ldiriladi (`netlify.toml` fayli borligi uchun).
   Tekshiring:
   - Build command: `npm run build`
   - Publish directory: `_site`
4. **Deploy** bosing. 1-2 daqiqada sayt tayyor bo'ladi:
   `tasodifiy-nom.netlify.app`.

Bundan keyin GitHub'da nima o'zgarsa, Netlify saytni o'zi yangilaydi.

---

## 4-qadam. Telegram sozlamalari

Netlify'da: **Site configuration** → **Environment variables** → **Add a variable**

| Key | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather bergan token |
| `TELEGRAM_CHAT_ID` | `getUpdates` dan olingan raqam |

(Google Sheets uchun yana ikki o'zgaruvchi keyingi qadamda qo'shiladi.)

Qo'shgandan keyin: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**.

Endi saytdagi formani to'ldirib sinab ko'ring — xabar Telegram guruhingizga tushishi kerak.

---

## 5-qadam. Arizalar Google Sheets'ga tushishi

Telegram xabar berish uchun, Sheets esa arxiv va tahlil uchun. Ikkalasi
birga ishlaydi: ariza kelganda Telegramga xabar tushadi va shu zahoti
jadvalga yangi qator qo'shiladi.

1. [Jadvalingizni](https://docs.google.com/spreadsheets/d/1rIdwFlwMuHcwKxkk_1kRIP5KEyazqiGSRW_Y7Dnp5uk/edit) oching.
2. Yuqoridagi menyudan **Extensions → Apps Script** ni tanlang. Yangi oyna ochiladi.
3. Ochilgan oynadagi barcha kodni o'chirib tashlang.
4. Loyihadagi `setup/google-sheets.gs` faylini oching, ichidagi hamma narsani
   nusxalab, Apps Script oynasiga joylashtiring.
5. Kodning yuqorisidagi `SECRET` qatorida `BU_YERGA_UZUN_PAROL_YOZING` o'rniga
   o'zingiz o'ylab topgan uzun parolni yozing (masalan 20 ta tasodifiy harf va
   raqam). Bu parolni yozib qo'ying — keyingi qadamda kerak bo'ladi.
6. Yuqoridagi disk belgisini bosib saqlang.
7. O'ng yuqoridagi **Deploy → New deployment** ni bosing.
   - **Select type** yonidagi shesternya belgisi → **Web app**
   - *Description*: `Hamkor lead`
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - **Deploy** bosing.
8. Google ruxsat so'raydi: **Authorize access** → akkauntingizni tanlang →
   ogohlantirish chiqsa **Advanced** → **Go to ... (unsafe)** → **Allow**.

   > Bu ogohlantirish normal: Google har qanday yangi shaxsiy skriptni shunday
   > belgilaydi. Kod sizniki va faqat o'z jadvalingizga yozadi.

9. Oxirida **Web app URL** chiqadi (`https://script.google.com/macros/s/.../exec`).
   Uni nusxalab oling.

Endi Netlify'da yana ikki o'zgaruvchi qo'shing (**Site configuration →
Environment variables**):

| Key | Value |
|---|---|
| `SHEETS_WEBHOOK_URL` | 9-qadamda olingan URL |
| `SHEETS_SECRET` | 5-qadamda o'ylab topgan parol |

So'ng **Deploys → Trigger deploy → Clear cache and deploy site**.

Saytdagi formani to'ldirib sinang: xabar Telegramga tushishi va jadvalda
yangi qator paydo bo'lishi kerak. Sarlavha qatori birinchi arizada
avtomatik yaratiladi.

> **Kodni o'zgartirsangiz** Apps Script'da **Deploy → Manage deployments →
> qalam belgisi → Version: New version → Deploy** qiling. Aks holda eski
> versiya ishlashda davom etadi.

---

## 6-qadam. Admin panelni yoqish

Bu qadamdan keyin maqolalarni brauzerdan yozasiz.

1. Netlify'da: **Site configuration** → **Identity** → **Enable Identity**.
2. Shu sahifada pastroqda **Registration** → **Invite only** ni tanlang.
   (Aks holda istalgan odam ro'yxatdan o'tib admin panelga kira oladi.)
3. **Services** → **Git Gateway** → **Enable Git Gateway**.
4. Yuqoridagi **Identity** tabiga o'ting → **Invite users** → o'z emailingizni
   yozing → **Send**.
5. Emailga kelgan xatdagi havolani bosing → parol o'rnating.
6. Endi `sizning-sayt.netlify.app/admin` ga kiring.

---

## Admin panelda nima qilish mumkin

Kirganingizda uchta bo'lim ko'rasiz:

**Maqolalar** — blog uchun. *New Maqolalar* → sarlavha, sana, turkum, qisqacha
tavsif va matn. Matn muharririda qalin harf, sarlavha, ro'yxat, havola va rasm
bor. **Publish** bosasiz — 1-2 daqiqada sayt yangilanadi.

**Keyslar** — `/keyslar/` sahifasidagi ish natijalari. Mijoz, soha, xizmat,
muddat, rasm va 4 tagacha ko'rsatkich (masalan: `3.4x` — `ROMI`). *Tartib
raqami* kichik bo'lgan keys chapda turadi. Sahifada kartalar 3D holatda,
bir-birini qisman qoplab turadi: kursor kelganda karta tekislanadi va
ochiladi, bosilganda pastida batafsil ma'lumot chiqadi.

Rasm 4:3 nisbatda bo'lsin (masalan 1200×900). Kartada rasmning o'rtasi
ko'rinadi, chekkalari qirqiladi — muhim narsani markazga joylashtiring.

Har bir keysda **maqola havolasi** maydoni bor. Loyiha haqida blogda batafsil
maqola yozganingizdan keyin uning manzilini (masalan `/blog/nihol-academy/`)
shu maydonga yozasiz — keys ochilganda "Loyiha haqida batafsil" tugmasi
paydo bo'ladi. Maydon bo'sh bo'lsa tugma ko'rinmaydi.

Mijoz logotiplari `src/assets/uploads/` papkasida turadi. Auruspharm uchun
uch fayl bor: `keys-auruspharm.jpg` (keys kartasi), `auruspharm-logo.png`
(rangli, och fon uchun) va `auruspharm-logo-oq.png` (oq, to'q fon uchun).

**Sayt sozlamalari** ikki fayldan iborat:

- *Narxlar va savollar* — ikki tarif formatining nomi, tavsifi, ro'yxatlari,
  boshlang'ich narxi va to'lov sharti. Shu yerda "Ko'p beriladigan savollar"
  bo'limi ham tahrirlanadi: savol qo'shish, o'chirish, tartibini almashtirish.
- *Aloqa ma'lumotlari* — telefon, Telegram havolasi, Instagram, manzil, ish
  vaqti. Bu yerda o'zgartirsangiz, sayt bo'ylab hamma joyda o'zgaradi.

> **Narxlar diapazon ko'rinishida.** Aniq summa yozilmagan: ikki formatda
> ham `700–5 000 $` turadi va eslatmada aniq summa auditdan keyin
> belgilanishi aytilgan. O'zgartirmoqchi bo'lsangiz admin panelda
> *Narxlar va savollar* bo'limiga kiring.

> Namuna sifatida bitta maqola va bitta keys qo'shib qo'yganman. Ularni admin
> panelda o'chirib yoki o'zingiznikiga almashtirib yuboring.

---

## 7-qadam. Domen

Netlify'da: **Domain management** → **Add a domain**. Domen registratoringizda
Netlify ko'rsatgan NS yozuvlarini qo'yasiz. HTTPS avtomatik ulanadi.

Domen ulangandan keyin admin panelda **Sayt sozlamalari** → *Sayt domeni*
maydonini yangi domenga o'zgartiring (sitemap uchun kerak).

---

## Maqola yozishda foydali maslahatlar

- Sarlavhani savol yoki aniq va'da qilib yozing. "SMM haqida" emas —
  "Reklama ishlamayapti degan gapning orqasida odatda nima turadi".
- *Qisqacha* maydonini bo'sh qoldirmang: u blog ro'yxatida va Google
  natijalarida ko'rinadi.
- Matn ichida `## ` bilan boshlanadigan sarlavhalar qo'ying — uzun matn
  o'qishga qulay bo'ladi.
- Rasm qo'shsangiz, hajmi 300 KB dan oshmasin, aks holda sayt sekinlashadi.

---

## Fayl tuzilmasi (kerak bo'lsa)

```
src/
  index.njk, xizmatlar.njk, keyslar.njk, kontakt.njk, blog.njk   sahifalar
  blog/*.md          maqolalar (admin panel shu yerga yozadi)
  keys/*.md          keyslar
  _data/site.json    aloqa ma'lumotlari
  _includes/         umumiy shablonlar (header, footer, forma)
  admin/config.yml   admin panel sozlamalari
  css/style.css      dizayn
netlify/functions/lead.js   formani Telegram va Sheets'ga yuboradi
setup/google-sheets.gs      Google Sheets uchun Apps Script kodi
```

Kompyuterda ishga tushirish (ixtiyoriy, dasturchi uchun):

```bash
npm install
npm start
```

---

## Brend

| | |
|---|---|
| To'q yashil | `#00423E` |
| Krem | `#F1EFE2` |
| Aksent | `#D4A72C` |
| Sarlavha shrifti | Saira |
| Matn shrifti | IBM Plex Sans |
| Yorliq shrifti | IBM Plex Mono |
