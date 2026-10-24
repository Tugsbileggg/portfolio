// English / Mongolian. Picked on the loader, switchable from the top bar, remembered per browser.
// Content lives in config.js as { en, mn } pairs; the interface wording lives here.
import { site } from './config.js';

const KEY = 'lang';
const listeners = new Set();

export let lang = initial();

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'mn') return saved;
  } catch (e) { /* private mode */ }
  return /^mn\b/i.test(navigator.language || '') ? 'mn' : site.lang || 'en';
}

export function setLang(next) {
  if (next !== 'en' && next !== 'mn') return;
  try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
  if (next === lang) return;
  lang = next;
  listeners.forEach((fn) => fn(lang));
}

export const onLang = (fn) => listeners.add(fn);

// a { en, mn } pair from config.js → the current language (plain values pass through)
export const pick = (v) => (v && typeof v === 'object' && 'en' in v ? v[lang] ?? v.en : v);

// interface wording → the current language; entries that take arguments are functions
export function t(key, ...args) {
  const s = ui[lang][key] ?? ui.en[key] ?? key;
  return typeof s === 'function' ? s(...args) : s;
}

// 'TUGSBILEG' → 'Tugsbileg' (Mongolian lines add the genitive straight on: Төгсбилэг → Төгсбилэгийн)
export const firstName = () => { const n = pick(site.name); return n[0] + n.slice(1).toLowerCase(); };

const ui = {
  en: {
    loading: 'Charting the sky',
    ready: 'Sky is clear',
    chooseSky: 'Choose your sky',
    night: 'Night',
    day: 'Day',
    enter: 'Enter the sky',
    lat: 'Lat',
    lon: 'Lon',
    alt: 'Alt',
    hdg: 'Hdg',
    m: 'M',
    north: 'N',
    east: 'E',
    madeUnder: 'Made under the<br /><em>eternal blue sky</em>',
    home: 'Back to start',
    about: 'About',
    projects: 'Projects',
    contact: 'Contact',
    toDay: 'Switch to day sky',
    toNight: 'Switch to night sky',
    available: 'Available',
    journey: 'Journey',
    origin: 'Origin',
    portrait: 'Portrait',
    selectedWork: 'Selected work',
    projectsWord: 'projects',
    workBody: 'Follow the route. Each stop is something I built.',
    basedIn: 'Based in',
    resume: 'Resume',
    role: 'Role',
    stack: 'Stack',
    visit: 'Visit site',
    closeChat: 'Close chat',
    yourMessage: 'Your message',
    send: 'Send',
    chatNote: 'AI answers from this portfolio only, and can be wrong.',
    chatSub: (n) => `Ask me about ${n}`,
    chatWith: (a, n) => `Chat with ${a}, ${n}'s assistant`,
    placeholder: (n) => `Ask anything about ${n}…`,
    welcome: (a, n) => `Hi, I'm ${a}! Ask me anything about ${n}: projects, skills, or how to get in touch.`,
    hintAbout: (n) => `Curious about ${n}? Ask me!`,
    hintWork: 'Want a quick tour of the projects?',
    hintOutro: 'Want to work together? I can help.',
    hintProject: (p) => `Ask me about ${p}!`,
    psst: 'Psst… click me to chat!',
    tellMe: (p) => `Tell me about ${p}`,
    error: 'Something went wrong. Please try again.',
    offline: "I couldn't reach the server. Check your connection and try again.",
  },
  mn: {
    loading: 'Тэнгэрийн зураглал хийж байна',
    ready: 'Цэлмэг тэнгэр',
    chooseSky: 'Тэнгэрээ сонгоно уу',
    night: 'Шөнө',
    day: 'Өдөр',
    enter: 'Тэнгэрт хөөрөх',
    lat: 'Өргөрөг',
    lon: 'Уртраг',
    alt: 'Өндөр',
    hdg: 'Чиглэл',
    m: 'М',
    north: 'ХӨ',
    east: 'ЗУ',
    madeUnder: '<em>Мөнх хөх тэнгэрийн</em><br />дор бүтээв.',
    home: 'Эхлэл рүү буцах',
    about: 'Тухай',
    projects: 'Төслүүд',
    contact: 'Холбоо',
    toDay: 'Өдрийн тэнгэр рүү шилжих',
    toNight: 'Шөнийн тэнгэр рүү шилжих',
    available: 'Ажилд нээлттэй',
    journey: 'Аялал',
    origin: 'Эхлэл',
    portrait: 'Хөрөг',
    selectedWork: 'Сонгосон бүтээлүүд',
    projectsWord: 'төсөл',
    workBody: 'Замаа дагаарай. Зогсоол бүр миний бүтээсэн зүйл.',
    basedIn: 'Байршил',
    resume: 'Анкет',
    role: 'Үүрэг',
    stack: 'Технологи',
    visit: 'Сайт үзэх',
    closeChat: 'Чат хаах',
    yourMessage: 'Таны мессеж',
    send: 'Илгээх',
    chatNote: 'AI зөвхөн энэ портфолиод тулгуурлан хариулдаг тул алдаж болно.',
    chatSub: (n) => `${n}ийн талаар асуугаарай`,
    chatWith: (a, n) => `Чат нээх — ${n}ийн туслах ${a}`,
    placeholder: (n) => `${n}ийн талаар юу ч асуугаарай…`,
    welcome: (a, n) => `Сайн уу, би ${a}! ${n}ийн төслүүд, ур чадвар, холбоо барих талаар юу ч асуугаарай.`,
    hintAbout: (n) => `${n}ийн талаар сонирхож байна уу? Надаас асуугаарай!`,
    hintWork: 'Төслүүдээр нь товчхон аялуулах уу?',
    hintOutro: 'Хамтарч ажиллах уу? Би тусалъя.',
    hintProject: (p) => `«${p}» төслийн талаар асуугаарай!`,
    psst: 'Псс… намайг дараад чатлаарай!',
    tellMe: (p) => `«${p}» төслийн талаар яриач`,
    error: 'Алдаа гарлаа. Дахин оролдоно уу.',
    offline: 'Сервертэй холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.',
  },
};
