# Portfolio — тэнгэрийн аялал

Тэнгэрт хөвж буй уулс scroll хийхэд нийлж таны хөрөг болж, дараа нь тэнгэрээр нисэх замын дагуу төслүүд гарч ирээд, нар мандах үед холбоо барих хэсгээр төгсдөг.

## Ажиллуулах

```bash
npm install
npm run dev
```

→ http://localhost:5173 (`?debug` нэмбэл loader алгасна)

## Засах

| Юу | Хаана |
|---|---|
| Нэр, мэргэжил, имэйл, сошиал, бүх текст | `js/config.js` → `site` |
| Анх нээгдэх тэнгэр (шөнө/өдөр) | `js/config.js` → `site.theme` |
| Англи / монгол текст | `js/config.js` дахь `{ en: '…', mn: '…' }` хосууд; товч, цэсний үгс `js/i18n.js` |
| Анх нээгдэх хэл | `js/config.js` → `site.lang` (хөтөч нь монгол хэлтэй бол монголоор нээгдэнэ) |
| Төслүүд | `js/config.js` → `projects` |
| AI туслахын нэр, мэндчилгээ, нэмэлт мэдээлэл | `js/config.js` → `site.assistant` |
| Хөрөг зураг | `assets/portrait.jpg` |
| Төслийн зураг | `assets/projects/нэр.jpg` → config-д `image: 'assets/projects/нэр.jpg'` |

**Хөрөг зургийн зөвлөмж:** нүүр нь гэрэлтэй, дэвсгэр нь бараан эсвэл энгийн, 4:5 харьцаатай зураг хамгийн гоё гарна. Цайвар хэсэг нь "уулын оргил" болж товойно. `portrait.contrast`, `portrait.depth`-ээр тохируулна.

**Төслийн зураг:** 16:10 харьцаа (жишээ нь 1600×1000). `image: null` бол автоматаар placeholder зурна.

## Байршуулах

Build хэрэггүй — бүх файлыг Netlify, Vercel, GitHub Pages зэрэг static hosting руу шууд хуулна.

## AI туслах (Uuli)

Дэлгэцээр тэнэж, хааяа зогсоод жижиг үйлдэл хийдэг уул (Uuli) дээр дарахад чат нээгдэнэ. Хариултыг `api/chat.js` Google Gemini-ийн үнэгүй загвараар үүсгэдэг бөгөөд зөвхөн `js/config.js` дахь мэдээллийг ашиглана.

- **Түлхүүр авах:** https://aistudio.google.com/apikey → Create API key (үнэгүй).
- **Vercel:** Project → Settings → Environment Variables → `GEMINI_API_KEY` нэмээд дахин deploy хийнэ.
- **Локал:** `.env.example`-ийг `.env` болгон хуулж түлхүүрээ бичнэ.
