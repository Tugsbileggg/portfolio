// ─────────────────────────────────────────────────────────────
//  Бүх агуулгыг ЭНДЭЭС засна. (Edit all content here.)
//  - Зураг: assets/portrait.png (байхгүй бол түр дүрс гарна)
//  - Төслийн зураг: assets/projects/*.jpg  (image: null бол автоматаар зурна)
//  - { en: '…', mn: '…' } хос = англи / монгол хувилбар. Сайтын хэлийг
//    орох хэсэгт сонгоно (товч, цэсний үгс js/i18n.js дотор бий).
// ─────────────────────────────────────────────────────────────

export const site = {
  name: { en: 'TUGSBILEG', mn: 'ТӨГСБИЛЭГ' },
  role: { en: 'Full-stack Developer', mn: 'Full-stack хөгжүүлэгч' },
  location: { en: 'Ulaanbaatar, Mongolia', mn: 'Улаанбаатар, Монгол' },
  email: 'ganbat.tugsbileg@gmail.com',
  resume: 'https://docs.google.com/document/d/1mFcVVozH7vXmo3IJIZWRl1UbnF0bXkWBUwUgIFglab8/edit?usp=sharing',
  available: true,
  theme: 'night', // анх нээхэд: 'night' | 'day'
  lang: 'en', // анх нээхэд: 'en' | 'mn' (хөтөч нь монгол хэлтэй бол 'mn')
  socials: [
    { label: 'GitHub', url: 'https://github.com/Tugsbileggg' },
  ],

  hero: {
    kicker: { en: 'Portfolio — 2026', mn: 'Портфолио — 2026' },
    title: { en: ['Beyond the', 'mountains,', 'into the sky.'], mn: ['Уулсыг', 'даваад,', 'тэнгэр өөд.'] },
    hint: { en: 'Scroll to fly', mn: 'Гүйлгээд нисээрэй' },
  },

  about: {
    kicker: { en: 'Hello —', mn: 'Сайн байна уу —' },
    title: { en: "I'm Tugsbileg.", mn: 'Би Төгсбилэг.' },
    text: {
      // резюмегийн «Товч танилцуулга»-аас товчилсон
      en:
        'Full-stack developer who has built a multi-tenant SaaS platform for small gyms and a complete e-commerce store with payments and inventory tracking. ' +
        'Before that, two years as a data analyst: digitizing and automating internal processes and leading a team of six.',
      mn:
        'Жижиг фитнесүүдэд зориулсан multi-tenant SaaS платформ, төлбөр болон бараа хяналттай бүрэн E-Commerce дэлгүүр бүтээсэн Full-Stack хөгжүүлэгч. ' +
        'Өмнө нь 2 жил дата шинжээчээр ажиллахдаа дотоод процессуудыг цахимжуулж, автоматжуулан, 6 хүний баг удирдсан.',
    },
  },

  outro: {
    kicker: { en: 'Next destination', mn: 'Дараагийн очих газар' },
    title: { en: ["Let's build", 'something', 'together.'], mn: ['Хамтдаа', 'шинэ зүйл', 'бүтээе.'] },
  },

  // Булангийн жижиг уул — AI туслах. Зөвхөн энэ файл дахь мэдээлэл дээр тулгуурлаж хариулна.
  assistant: {
    name: { en: 'Uuli', mn: 'Уул' },
    greetings: {
      en: ['Hi! How can I help you?', 'Hello from the mountains!'],
      mn: ['Сайн уу! Танд юугаар туслах вэ?', 'Уулсаас мэнд хүргэе!'],
    },
    suggestions: {
      en: ['What does Tugsbileg build?', 'Is Tugsbileg open to work?', 'Tell me about the projects'],
      mn: ['Төгсбилэг юу бүтээдэг вэ?', 'Төгсбилэг ажилд орох боломжтой юу?', 'Төслүүдийнх нь талаар яриач'],
    },
    // Дээр байхгүй нэмэлт мэдээлэл (ур чадвар, сургууль, хэл, ажлын туршлага, хобби...).
    // Энд бичсэн зүйлийг л AI мэднэ — бичээгүй зүйлийг "мэдэхгүй" гэж хариулна.
    facts: [
      // хувийн
      'Full name: Ganbat Tugsbileg (Ганбат Төгсбилэг). Phone: +976 8556 7784.',
      'Born on 1 November 2003: a Scorpio, and born in the Year of the Sheep (Хонь жил) by the Mongolian calendar.',
      'Loves playing football (хөлбөмбөг), the favourite thing to do away from the keyboard.',
      'Languages: Mongolian (native), English (B2), Japanese (N5).',
      // резюмегээс
      'Headline: entry-level full-stack developer, focused on backend and automation.',
      'Work: Full-Stack Developer at Lining Club, May 2026 – present. Put QPay payments (through Wire) live in production; designed admin / staff role-based access (RBAC) with Firebase custom claims, enforced at three levels: middleware, server-side token checks and Firestore / Storage security rules; shipped a fully Mongolian, mobile-first store on Vercel with MNT prices, guest checkout and order tracking.',
      'Work: Data Analyst at Миний Дэлгүүр LLC, Sep 2023 – Sep 2025. Automated internal workflows with Microsoft Power Platform in Microsoft 365 and digitized paper processes, so requests got resolved faster; moved HR and admin paperwork (leave requests, business-trip orders) from paper to digital flows; analysed company data to support data-driven decisions; led a team of 6.',
      'Work: Intern at Diverse Solution, 2022, on a web development project.',
      'Fitness SaaS (Sep 2026 – present): dashboards for each role (platform admin, gym manager, trainer); recording a payment calculates the membership end date automatically; members about to expire or already expired show up on the manager dashboard, with tracking of who has been notified.',
      'ClassPulse, the full classroom system (team of 5, Tugsbileg was the backend developer): detects whether a student is in their seat, dozing, looking at the board or using a phone; built on Cloudflare Workers, D1, R2 and Pages; real-time alerts to the teacher and a participation percentage for every student at the end of the day; AI runs locally in the browser so video never leaves the classroom, and students are told apart by seat map, not face recognition; tested on a ceiling UniFi Protect 360° camera; wrote the technical design doc (requirements, API spec, ERD, architecture).',
      'NomadX / LUMINA (team of 3, Tugsbileg was team lead): customers find salons and independent artists on a map, book, pay a deposit and pay the rest after the service; AI beauty advisor, in-app chat, booking calendar, artist and salon portals and a web admin panel.',
      'Other program projects: a real-time GPS tracking proof of concept for an at-home nail service (Socket.IO, Leaflet), a quiz app and a food delivery web app, each with its own technical design document.',
      'Skills — languages: TypeScript, JavaScript, Python, SQL, HTML/CSS. Frameworks: Next.js (App Router), React, Expo / React Native, Hono, Tailwind CSS, shadcn/ui, Zustand, React Hook Form, Zod. Backend and cloud: Supabase, Firebase (Firestore, Auth, Storage, security rules), Cloudflare (Workers, D1, R2, Pages), Vercel, REST APIs, webhooks, WebSocket. Integrations: QPay through Wire, Meta Messenger API, Claude API, TensorFlow.js, MediaPipe. Automation and data: Microsoft Power Platform, Microsoft 365, Excel, SQL. Practices: technical design docs, RBAC, idempotent payment flows, Git / GitHub, AI-assisted development (Claude Code).',
      'Education: New Mongolia Technology College (Шинэ Монгол Технологийн Коллеж), electrical engineering, Sep 2018 – Jun 2023, graduated. Pinecone Academy Software Engineering Program, an intensive project-based program, March 2026 – present, currently studying.',
      'Full resume (Google Doc): https://docs.google.com/document/d/1mFcVVozH7vXmo3IJIZWRl1UbnF0bXkWBUwUgIFglab8/edit?usp=sharing',
    ],
  },

  // Хөрөг зураг. Цайвар/энгийн дэвсгэртэй, нүүр нь сайн гэрэлтэй зураг хамгийн гоё харагдана.
  portrait: {
    src: 'assets/portrait.png', // дэвсгэргүй хар-цагаан, үсний хүрээг гүйцээсэн
    contrast: 1.1, // 1 = original
    depth: 7,       // how tall the "mountain relief" of the face is
  },
};

export const projects = [
  {
    title: 'Фитнес Хяналт',
    year: 2026,
    tagline: {
      en: 'A membership & payments SaaS for gyms in Mongolia',
      mn: 'Монголын фитнес заалуудад зориулсан гишүүнчлэл, төлбөрийн SaaS',
    },
    description: {
      en:
        'Gyms sign up on their own and manage members, trainers, plans and payments in one place, with a dashboard that flags memberships about to expire. ' +
        'A public "Find a gym" map compares nearby gyms by price, hours and location. Row-level security keeps every gym’s data apart.',
      mn:
        'Заалууд өөрсдөө бүртгүүлээд гишүүд, дасгалжуулагч, багц, төлбөрөө нэг дор удирдана. Хугацаа нь дуусах гэж буй гишүүнчлэлийг хяналтын самбар сануулна. ' +
        'Нээлттэй «Заал хайх» газрын зураг ойролцоох заалуудыг үнэ, цагийн хуваарь, байршлаар нь харьцуулна. Row-level security заал бүрийн өгөгдлийг тусад нь хамгаална.',
    },
    role: { en: 'Solo — design, frontend, backend & database', mn: 'Ганцаараа — дизайн, frontend, backend, өгөгдлийн сан' },
    stack: ['Next.js 16', 'TypeScript', 'Supabase', 'PostgreSQL · RLS', 'Tailwind · shadcn/ui', 'Leaflet'],
    url: 'https://fitness-pi-opal-62.vercel.app',
    repo: 'https://github.com/Tugsbileggg/fitness',
    image: 'assets/projects/fitness.jpg',
    accent: '#d4ff3a',
  },
  {
    title: 'ClassPulse AI',
    year: 2026,
    tagline: {
      en: 'AI that spots sleeping or phone-distracted students',
      mn: 'Унтаж эсвэл утсандаа сатаарсан сурагчдыг илрүүлдэг AI',
    },
    description: {
      en:
        'Product site for a desktop AI app that watches the classroom camera feed and alerts the teacher the moment a student dozes off or picks up a phone. ' +
        'Static, fast, Cyrillic-ready typography, deployed on Cloudflare Workers.',
      mn:
        'Ангийн камерын дүрсийг хянаж, сурагч нойрмоглох эсвэл утсаа гартаа авах мөчид багшид мэдэгддэг desktop AI аппын бүтээгдэхүүний сайт. ' +
        'Статик, хурдан, кирилл үсэгт тохирсон фонттой, Cloudflare Workers дээр байршсан.',
    },
    role: { en: 'Frontend & Web Developer, backend support', mn: 'Frontend ба веб хөгжүүлэгч, backend-д туслалцаа' },
    stack: ['Next.js 16', 'TypeScript', 'Tailwind CSS v4', 'Cloudflare Workers'],
    url: 'https://classpulse-eosin.vercel.app',
    repo: 'https://github.com/Tugsbileggg/ClassPulse',
    image: 'assets/projects/classpulse.jpg',
    accent: '#3d7bff',
  },
  {
    title: 'Lumina',
    year: 2026,
    tagline: {
      en: 'Beauty booking platform: mobile app, web and API',
      mn: 'Гоо сайхны цаг захиалгын платформ: мобайл апп, веб, API',
    },
    description: {
      en:
        'Customers book salons and independent artists, get AI skin-analysis advice and push notifications. Businesses register through a verified 5-step wizard and run their own admin panels. ' +
        'One Supabase backend serves the Expo app, a 43-route Next.js site and a Hono API with Gemini AI.',
      mn:
        'Хэрэглэгчид салон, бие даасан артистуудад цаг захиалж, AI-аар арьсаа шинжлүүлэн зөвлөгөө авч, push мэдэгдэл хүлээн авна. Бизнесүүд баталгаажуулалттай 5 алхамт бүртгэлээр орж, өөрсдийн админ самбарыг удирдана. ' +
        'Нэг Supabase backend нь Expo апп, 43 хуудастай Next.js сайт, Gemini AI-тай Hono API-г зэрэг ажиллуулна.',
    },
    role: { en: 'Team Lead · Backend · App & Web Developer', mn: 'Багийн ахлагч · Backend · Апп ба веб хөгжүүлэгч' },
    stack: ['React Native · Expo', 'Next.js', 'Supabase', 'PostgreSQL · RLS', 'Hono', 'Gemini AI'],
    url: 'https://frontend-pi-lyart-87.vercel.app',
    repo: 'https://github.com/Tugsbileggg/NomadX',
    image: 'assets/projects/nomadx.jpg',
    accent: '#d48a96',
  },
  {
    title: 'Lining Club',
    year: 2026,
    tagline: {
      en: 'A custom sneaker store that replaced Shopify',
      mn: 'Shopify-г орлосон пүүзний өөрийн онлайн дэлгүүр',
    },
    description: {
      en:
        'A self-owned storefront for a sneaker shop in Ulaanbaatar, built to drop Shopify fees: catalog with filters and search, persisted cart, guest checkout, ' +
        'order tracking and QPay payments, all in Mongolian with MNT pricing.',
      mn:
        'Улаанбаатарын пүүзний дэлгүүрийг Shopify-н шимтгэлээс салгах зорилгоор бүтээсэн өөрийн онлайн дэлгүүр: шүүлтүүр, хайлттай каталог, хадгалагддаг сагс, бүртгэлгүй худалдан авалт, ' +
        'захиалга хянах, QPay төлбөр — бүгд монгол хэлээр, төгрөгийн үнэтэй.',
    },
    role: { en: 'Solo — design to deployment', mn: 'Ганцаараа — дизайнаас байршуулалт хүртэл' },
    stack: ['Next.js 16', 'TypeScript', 'Firebase', 'Zustand', 'React Hook Form · Zod', 'QPay'],
    url: 'https://lining-club.vercel.app',
    repo: 'https://github.com/Tugsbileggg/lining-club',
    image: 'assets/projects/lining-club.jpg',
    accent: '#ff4747',
  },
];
