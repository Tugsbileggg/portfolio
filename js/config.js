// ─────────────────────────────────────────────────────────────
//  Бүх агуулгыг ЭНДЭЭС засна. (Edit all content here.)
//  - Зураг: assets/portrait.png (байхгүй бол түр дүрс гарна)
//  - Төслийн зураг: assets/projects/*.jpg  (image: null бол автоматаар зурна)
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'TUGSBILEG',
  nameMn: 'Төгсбилэг', // AI туслах монголоор ингэж бичнэ
  role: 'Full-stack Developer',
  location: 'Ulaanbaatar, Mongolia',
  email: 'ganbat.tugsbileg@gmail.com',
  resume: 'https://docs.google.com/document/d/1mFcVVozH7vXmo3IJIZWRl1UbnF0bXkWBUwUgIFglab8/edit?usp=sharing',
  available: true,
  theme: 'night', // анх нээхэд: 'night' | 'day'
  socials: [
    { label: 'GitHub', url: 'https://github.com/Tugsbileggg' },
  ],

  hero: {
    kicker: 'Portfolio — 2026',
    title: ['Beyond the', 'mountains,', 'into the sky.'],
    hint: 'Scroll to fly',
  },

  about: {
    kicker: 'Hello —',
    title: "I'm Tugsbileg.",
    text:
      'I build web and mobile products end to end, from the database and API to the screen people touch. ' +
      'Every project is a climb: start on solid ground, then keep going until the view opens up.',
  },

  outro: {
    kicker: 'Next destination',
    title: ["Let's build", 'something', 'together.'],
  },

  // Булангийн жижиг уул — AI туслах. Зөвхөн энэ файл дахь мэдээлэл дээр тулгуурлаж хариулна.
  assistant: {
    name: 'Uuli',
    greetings: ['Сайн уу! Танд юугаар туслах вэ?', 'Hi! How can I help you?'],
    suggestions: [
      'What does Tugsbileg build?',
      'Is Tugsbileg open to work?',
      'Төслүүдийнх нь талаар яриач',
    ],
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
    src: 'assets/portrait.png', // дэвсгэргүй, бага зэрэг инээмсэглэсэн, хар-цагаан
    contrast: 1.1, // 1 = original
    depth: 7,       // how tall the "mountain relief" of the face is
  },
};

export const projects = [
  {
    title: 'Фитнес Хяналт',
    year: 2026,
    tagline: 'A membership & payments SaaS for gyms in Mongolia',
    description:
      'Gyms sign up on their own and manage members, trainers, plans and payments in one place, with a dashboard that flags memberships about to expire. ' +
      'A public "Find a gym" map compares nearby gyms by price, hours and location. Row-level security keeps every gym’s data apart.',
    role: 'Solo — design, frontend, backend & database',
    stack: ['Next.js 16', 'TypeScript', 'Supabase', 'PostgreSQL · RLS', 'Tailwind · shadcn/ui', 'Leaflet'],
    url: 'https://fitness-pi-opal-62.vercel.app',
    repo: 'https://github.com/Tugsbileggg/fitness',
    image: 'assets/projects/fitness.jpg',
    accent: '#d4ff3a',
  },
  {
    title: 'ClassPulse AI',
    year: 2026,
    tagline: 'AI that spots sleeping or phone-distracted students',
    description:
      'Product site for a desktop AI app that watches the classroom camera feed and alerts the teacher the moment a student dozes off or picks up a phone. ' +
      'Static, fast, Cyrillic-ready typography, deployed on Cloudflare Workers.',
    role: 'Frontend & Web Developer, backend support',
    stack: ['Next.js 16', 'TypeScript', 'Tailwind CSS v4', 'Cloudflare Workers'],
    url: 'https://classpulse-eosin.vercel.app',
    repo: 'https://github.com/Tugsbileggg/ClassPulse',
    image: 'assets/projects/classpulse.jpg',
    accent: '#3d7bff',
  },
  {
    title: 'Lumina',
    year: 2026,
    tagline: 'Beauty booking platform: mobile app, web and API',
    description:
      'Customers book salons and independent artists, get AI skin-analysis advice and push notifications. Businesses register through a verified 5-step wizard and run their own admin panels. ' +
      'One Supabase backend serves the Expo app, a 43-route Next.js site and a Hono API with Gemini AI.',
    role: 'Team Lead · Backend · App & Web Developer',
    stack: ['React Native · Expo', 'Next.js', 'Supabase', 'PostgreSQL · RLS', 'Hono', 'Gemini AI'],
    url: 'https://frontend-pi-lyart-87.vercel.app',
    repo: 'https://github.com/Tugsbileggg/NomadX',
    image: 'assets/projects/nomadx.jpg',
    accent: '#d48a96',
  },
  {
    title: 'Lining Club',
    year: 2026,
    tagline: 'A custom sneaker store that replaced Shopify',
    description:
      'A self-owned storefront for a sneaker shop in Ulaanbaatar, built to drop Shopify fees: catalog with filters and search, persisted cart, guest checkout, ' +
      'order tracking and QPay payments, all in Mongolian with MNT pricing.',
    role: 'Solo — design to deployment',
    stack: ['Next.js 16', 'TypeScript', 'Firebase', 'Zustand', 'React Hook Form · Zod', 'QPay'],
    url: 'https://lining-club.vercel.app',
    repo: 'https://github.com/Tugsbileggg/lining-club',
    image: 'assets/projects/lining-club.jpg',
    accent: '#ff4747',
  },
];
