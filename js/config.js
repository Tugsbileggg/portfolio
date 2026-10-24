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
      en:
        'I build web and mobile products end to end, from the database and API to the screen people touch. ' +
        'Every project is a climb: start on solid ground, then keep going until the view opens up.',
      mn:
        'Өгөгдлийн сан, API-гаас эхлээд хүмүүсийн гартаа барьж хэрэглэх дэлгэц хүртэл веб болон мобайл бүтээгдэхүүнийг бүхэлд нь бүтээдэг. ' +
        'Төсөл бүр нэг авиралт: бат бөх газраас эхэлж, үзэмж нээгдтэл урагшилсаар байна.',
    },
  },

  outro: {
    kicker: { en: 'Next destination', mn: 'Дараагийн очих газар' },
    title: { en: ["Let's build", 'something', 'together.'], mn: ['Хамтдаа', 'шинэ зүйл', 'бүтээе.'] },
  },

  // Булангийн жижиг уул — AI туслах. Зөвхөн энэ файл дахь мэдээлэл дээр тулгуурлаж хариулна.
  assistant: {
    name: { en: 'Uuli', mn: 'Уули' },
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
      'Builds full products end to end: database, API, web and mobile apps.',
      'Works mostly with TypeScript, Next.js, React Native (Expo), Supabase/PostgreSQL and Firebase.',
      'Speaks Mongolian and English.',
      'Full resume (Google Doc): https://docs.google.com/document/d/1mFcVVozH7vXmo3IJIZWRl1UbnF0bXkWBUwUgIFglab8/edit',
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
