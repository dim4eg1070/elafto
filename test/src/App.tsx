import { useState, useEffect, useCallback, createContext, useContext } from "react";

/* ======================================================================
   DATA & TYPES
   ====================================================================== */

interface ServiceItem { icon: string; title: string; description: string; price: string; }
interface StepItem { number: string; title: string; description: string; }
interface ReviewItem { name: string; car: string; text: string; rating: number; avatar: string; }
interface FAQItem { question: string; answer: string; }
interface StatItem { value: string; label: string; }

interface SiteContent {
  brand: string; phone: string; email: string; address: string;
  telegram: string; whatsapp: string; workHours: string;
  heroTitle: string; heroAccent: string; heroSubtitle: string; heroCTA: string; heroImage: string;
  aboutTitle: string; aboutAccent: string; aboutText: string; aboutText2: string; aboutStats: StatItem[];
  servicesTitle: string; servicesAccent: string; servicesSubtitle: string; services: ServiceItem[];
  stepsTitle: string; stepsAccent: string; stepsSubtitle: string; steps: StepItem[];
  reviewsTitle: string; reviewsAccent: string; reviewsSubtitle: string; reviews: ReviewItem[];
  faqTitle: string; faqAccent: string; faqSubtitle: string; faqs: FAQItem[];
  ctaTitle: string; ctaAccent: string; ctaText: string; ctaButton: string;
  footerText: string;
}

interface FormSubmission {
  id: string; date: string; name: string; phone: string;
  carType: string; budget: string; message: string; status: string;
}

const DEF: SiteContent = {
  brand: "AutoSelect", phone: "+7 (495) 120-00-77", email: "concierge@autoselect.ru",
  address: "Москва, Пресненская наб., 12, Башня «Федерация»",
  telegram: "https://t.me/autoselect", whatsapp: "https://wa.me/74951200077",
  workHours: "Пн–Вс: 09:00 – 21:00",
  heroTitle: "Ваш автомобиль мечты", heroAccent: "уже ждёт вас",
  heroSubtitle: "Премиальный подбор автомобилей с безупречной репутацией. Полная проверка, юридическая гарантия, персональный менеджер — от первой консультации до ключей в вашей руке.",
  heroCTA: "Начать подбор",
  heroImage: "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
  aboutTitle: "Почему клиенты", aboutAccent: "доверяют нам",
  aboutText: "AutoSelect — бутиковая компания по подбору автомобилей премиум-класса. Мы не гонимся за объёмами: каждый клиент получает персонального эксперта, который ведёт его от первого звонка до момента, когда вы садитесь за руль.",
  aboutText2: "Наши специалисты — сертифицированные эксперты с опытом работы в дилерских центрах, независимых СТО и страховых компаниях. Мы знаем все подводные камни вторичного рынка.",
  aboutStats: [
    { value: "2 400+", label: "Автомобилей подобрано" }, { value: "12 лет", label: "Безупречной работы" },
    { value: "99.2%", label: "Довольных клиентов" }, { value: "₽180M+", label: "Сэкономлено клиентам" },
  ],
  servicesTitle: "Наши", servicesAccent: "услуги",
  servicesSubtitle: "Полный цикл экспертного сопровождения — от анализа ваших потребностей до безопасного оформления сделки",
  services: [
    { icon: "🔍", title: "Полный подбор автомобиля", description: "Персональный поиск под ваши критерии: марка, бюджет, состояние, история. Проверяем десятки вариантов, выбираем лучший.", price: "от 25 000 ₽" },
    { icon: "🛡️", title: "Выездная диагностика", description: "Толщиномер, эндоскоп, компьютерная диагностика, проверка геометрии кузова. 200+ контрольных точек.", price: "от 7 000 ₽" },
    { icon: "📋", title: "Юридическая экспертиза", description: "Проверка по 15+ базам: ГИБДД, ФССП, ФНП, таможня, банки залогов, история ДТП, реальный пробег.", price: "от 4 000 ₽" },
    { icon: "🚗", title: "Сопровождение сделки", description: "Профессиональный торг, безопасная схема расчётов, оформление ДКП, постановка на учёт в ГИБДД.", price: "от 10 000 ₽" },
    { icon: "🚛", title: "Подбор из регионов", description: "Находим лучшие варианты по всей России и СНГ. Организуем осмотр, покупку и доставку до двери.", price: "от 35 000 ₽" },
    { icon: "🔧", title: "Предпродажный аудит", description: "Готовите автомобиль к продаже? Поможем оценить реальную стоимость и подготовить к показу.", price: "от 5 000 ₽" },
  ],
  stepsTitle: "Как проходит", stepsAccent: "подбор",
  stepsSubtitle: "Прозрачный процесс с отчётами на каждом этапе",
  steps: [
    { number: "01", title: "Консультация", description: "Обсуждаем ваши требования, бюджет, сроки. Составляем техническое задание и подписываем договор." },
    { number: "02", title: "Поиск и фильтрация", description: "Мониторим все площадки, звоним продавцам, отсеиваем перекупов и битые варианты на этапе телефонного скрининга." },
    { number: "03", title: "Осмотр и диагностика", description: "Выезжаем на лучшие варианты. Полная инструментальная проверка + фото/видео отчёт вам в мессенджер." },
    { number: "04", title: "Сделка и ключи", description: "Торгуемся, оформляем документы, проводим безопасный расчёт. Вы получаете автомобиль и полный отчёт." },
  ],
  reviewsTitle: "Что говорят", reviewsAccent: "наши клиенты",
  reviewsSubtitle: "Отзывы тех, кто уже нашёл свой идеальный автомобиль с нашей помощью",
  reviews: [
    { name: "Андрей Волков", car: "Mercedes-Benz GLE 300d · 2022", text: "Искал GLE полгода сам — сплошные перекрашенные варианты. Ребята из AutoSelect нашли идеальный экземпляр за 9 дней. Сэкономил 420 тысяч на торге. Сервис уровня пятизвёздочного отеля.", rating: 5, avatar: "АВ" },
    { name: "Екатерина Морозова", car: "BMW X5 40i · 2023", text: "Первый раз покупала машину такого класса и очень переживала. Персональный менеджер был на связи 24/7, объяснял каждый шаг. Результат — машина мечты без единого нарекания.", rating: 5, avatar: "ЕМ" },
    { name: "Игорь Красильников", car: "Porsche Cayenne · 2021", text: "Проверили 12 вариантов, пока не нашли тот самый. У 8 из 12 были скрытые проблемы, которые я бы никогда не обнаружил сам. Вложение в подбор окупилось многократно.", rating: 5, avatar: "ИК" },
    { name: "Диана Петрова", car: "Audi Q7 · 2022", text: "Заказала подбор из Петербурга с доставкой в Москву. Всё организовали удалённо: осмотр по видеосвязи, документы курьером, машину привезли на эвакуаторе. Безупречно.", rating: 5, avatar: "ДП" },
  ],
  faqTitle: "Частые", faqAccent: "вопросы",
  faqSubtitle: "Всё, что вы хотели знать о процессе подбора автомобиля",
  faqs: [
    { question: "Сколько времени занимает подбор?", answer: "Стандартный подбор — 5–14 рабочих дней. Срочный — от 3 дней с доплатой. Редкие комплектации могут потребовать до 30 дней." },
    { question: "Что входит в полную проверку?", answer: "Проверка ЛКП толщиномером, инструментальная диагностика ДВС и КПП, проверка подвески на подъёмнике, компьютерная диагностика, эндоскоп, проверка по базам: ГИБДД, ФССП, ФНП, реестр залогов. Итого 200+ точек." },
    { question: "Какие гарантии вы даёте?", answer: "Юридическая гарантия на чистоту — пожизненная. 30-дневная гарантия на техническое состояние. Если выявится скрытая проблема — компенсируем убытки." },
    { question: "Как происходит оплата?", answer: "Предоплата 30% при подписании договора. Остаток — после подбора и вашего одобрения. Не нашли — возвращаем предоплату полностью." },
    { question: "Работаете с новыми авто?", answer: "Да. Помогаем выбрать комплектацию, находим лучшие предложения у дилеров, помогаем получить максимальную скидку и trade-in." },
  ],
  ctaTitle: "Готовы найти", ctaAccent: "свой идеальный автомобиль?",
  ctaText: "Оставьте заявку — персональный эксперт свяжется с вами в течение 15 минут. Первая консультация бесплатно.",
  ctaButton: "Оставить заявку",
  footerText: "© 2024 AutoSelect Premium. Все права защищены.",
};

/* ======================================================================
   CONTEXT
   ====================================================================== */
interface Ctx {
  content: SiteContent; setContent: (c: SiteContent) => void; resetContent: () => void;
  subs: FormSubmission[]; addSub: (s: Omit<FormSubmission, "id"|"date"|"status">) => void;
  updSub: (id: string, st: string) => void; delSub: (id: string) => void;
  page: string; setPage: (p: string) => void;
}
const C = createContext<Ctx>(null!);
const useC = () => useContext(C);

function Provider({ children }: { children: React.ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(() => {
    try { const s = localStorage.getItem("as_c"); return s ? { ...DEF, ...JSON.parse(s) } : DEF; } catch { return DEF; }
  });
  const [subs, setS] = useState<FormSubmission[]>(() => {
    try { const s = localStorage.getItem("as_s"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [page, setPage] = useState("landing");

  useEffect(() => { localStorage.setItem("as_c", JSON.stringify(content)); }, [content]);
  useEffect(() => { localStorage.setItem("as_s", JSON.stringify(subs)); }, [subs]);

  const setContent = useCallback((c: SiteContent) => setContentState(c), []);
  const resetContent = useCallback(() => { setContentState(DEF); localStorage.removeItem("as_c"); }, []);
  const addSub = useCallback((s: Omit<FormSubmission, "id"|"date"|"status">) => {
    setS(p => [{ ...s, id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), date: new Date().toLocaleString("ru-RU"), status: "Новая" }, ...p]);
  }, []);
  const updSub = useCallback((id: string, st: string) => setS(p => p.map(x => x.id===id ? { ...x, status: st } : x)), []);
  const delSub = useCallback((id: string) => setS(p => p.filter(x => x.id!==id)), []);

  return <C.Provider value={{ content, setContent, resetContent, subs, addSub, updSub, delSub, page, setPage }}>{children}</C.Provider>;
}

/* ======================================================================
   SVG ICONS (inline, no external deps)
   ====================================================================== */
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const icons = {
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M18 6L6 18M6 6l12 12",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  clock: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  award: "M12 15l-2 5 1-3h2l1 3-2-5zM12 2a7 7 0 100 14 7 7 0 000-14z",
  arrowR: "M5 12h14M12 5l7 7-7 7",
  chevDown: "M6 9l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  check: "M20 6L9 17l-5-5",
  trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
  save: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  reset: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  inbox: "M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM9 22V12h6v10",
  file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  msg: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-4.24-4.24M1 1l22 22",
  quote: "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z",
};

/* ======================================================================
   HEADER
   ====================================================================== */
function Header() {
  const { content, setPage } = useC();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scroll = (id: string) => { setOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };
  const links = [
    { label: "О нас", id: "about" }, { label: "Услуги", id: "services" },
    { label: "Этапы", id: "steps" }, { label: "Отзывы", id: "reviews" },
    { label: "FAQ", id: "faq" }, { label: "Контакты", id: "contact" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button onClick={() => scroll("hero")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-black font-black text-xs">AS</span>
            </div>
            <span className="text-base font-bold text-white tracking-tight">{content.brand}<span className="text-gold-400 font-light ml-1">Premium</span></span>
          </button>
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(l => <button key={l.id} onClick={() => scroll(l.id)} className="px-3.5 py-2 text-[12px] font-medium text-white/50 hover:text-gold-400 tracking-widest uppercase transition-colors">{l.label}</button>)}
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <a href={`tel:${content.phone.replace(/\D/g, "")}`} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-gold-400 transition"><Icon d={icons.phone} className="w-3 h-3" />{content.phone}</a>
            <button onClick={() => scroll("contact")} className="px-5 py-2 text-[11px] font-semibold tracking-widest uppercase bg-gradient-to-r from-gold-500 to-gold-600 text-black rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/20">Заявка</button>
          </div>
          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-white/60"><Icon d={open ? icons.x : icons.menu} className="w-5 h-5" /></button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden bg-[#0a0a0a]/98 backdrop-blur-xl border-t border-white/5">
          <div className="px-4 py-5 space-y-1">
            {links.map(l => <button key={l.id} onClick={() => scroll(l.id)} className="block w-full text-left px-4 py-2.5 text-white/60 hover:text-gold-400 rounded-xl text-sm uppercase tracking-wider transition">{l.label}</button>)}
            <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
              <a href={`tel:${content.phone.replace(/\D/g, "")}`} className="flex items-center gap-2 px-4 py-2.5 text-gold-400 font-semibold text-sm"><Icon d={icons.phone} className="w-4 h-4" />{content.phone}</a>
              <button onClick={() => scroll("contact")} className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-black rounded-xl font-bold text-sm uppercase tracking-wider">Оставить заявку</button>
            </div>
          </div>
        </div>
      )}
      {/* Admin link — tiny, bottom right corner */}
      <button onClick={() => { setOpen(false); setPage("admin"); window.scrollTo(0,0); }} className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-gold-400 hover:border-gold-500/30 transition-all" title="Админ-панель">
        <Icon d={icons.settings} className="w-4 h-4" />
      </button>
    </header>
  );
}

/* ======================================================================
   HERO
   ====================================================================== */
function Hero() {
  const { content } = useC();
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-[#080808]">
      <div className="absolute inset-0">
        <img src={content.heroImage} alt="" className="w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-[#080808]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/60" />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-gold-500/30 rounded-full mb-8 bg-gold-500/5">
            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
            <span className="text-gold-400 text-[10px] font-semibold tracking-[0.3em] uppercase">Premium Auto Concierge</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
            {content.heroTitle}<br />
            <span className="font-serif italic text-gold-400">{content.heroAccent}</span>
          </h1>
          <p className="text-base sm:text-lg text-white/45 leading-relaxed max-w-2xl mb-10">{content.heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button onClick={() => scroll("contact")} className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold rounded-xl text-sm uppercase tracking-wider shadow-2xl shadow-gold-500/25 hover:shadow-gold-500/40 transition-all">
              {content.heroCTA}<Icon d={icons.arrowR} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scroll("services")} className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/10 text-white/70 font-semibold rounded-xl text-sm uppercase tracking-wider hover:border-gold-500/30 hover:text-gold-400 transition-all">Подробнее</button>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: icons.shield, label: "Юридическая\nгарантия" },
              { icon: icons.clock, label: "Подбор\nот 3 дней" },
              { icon: icons.award, label: "12 лет\nна рынке" },
            ].map((it, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><Icon d={it.icon} className="w-3.5 h-3.5 text-gold-400" /></div>
                <span className="text-[10px] text-white/35 font-medium leading-tight whitespace-pre-line">{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[9px] text-white/15 uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gold-500/40 to-transparent" />
      </div>
    </section>
  );
}

/* ======================================================================
   ABOUT
   ====================================================================== */
function About() {
  const { content } = useC();
  return (
    <section id="about" className="relative py-24 md:py-32 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-gold-500 text-[10px] font-semibold tracking-[0.3em] uppercase">О компании</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{content.aboutTitle} <span className="font-serif italic text-gold-400">{content.aboutAccent}</span></h2>
            <p className="text-white/45 leading-relaxed">{content.aboutText}</p>
            <p className="text-white/35 leading-relaxed text-sm">{content.aboutText2}</p>
            <div className="w-16 h-px bg-gradient-to-r from-gold-500 to-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {content.aboutStats.map((s, i) => (
              <div key={i} className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-gold-500/20 transition-all duration-500">
                <div className="text-3xl sm:text-4xl font-bold text-gold-400 font-serif">{s.value}</div>
                <div className="mt-2 text-xs text-white/35 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ======================================================================
   SERVICES
   ====================================================================== */
function Services() {
  const { content } = useC();
  return (
    <section id="services" className="relative py-24 md:py-32 bg-[#070707] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="text-gold-500 text-[10px] font-semibold tracking-[0.3em] uppercase">Что мы предлагаем</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{content.servicesTitle} <span className="font-serif italic text-gold-400">{content.servicesAccent}</span></h2>
          <p className="mt-4 text-white/35 max-w-2xl mx-auto">{content.servicesSubtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {content.services.map((s, i) => (
            <div key={i} className="group p-7 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-gold-500/20 transition-all duration-500">
              <div className="text-3xl mb-5">{s.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed mb-5">{s.description}</p>
              <span className="inline-flex px-3 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-semibold">{s.price}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================================================================
   STEPS
   ====================================================================== */
function Steps() {
  const { content } = useC();
  return (
    <section id="steps" className="relative py-24 md:py-32 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="text-gold-500 text-[10px] font-semibold tracking-[0.3em] uppercase">Процесс</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{content.stepsTitle} <span className="font-serif italic text-gold-400">{content.stepsAccent}</span></h2>
          <p className="mt-4 text-white/35 max-w-2xl mx-auto">{content.stepsSubtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {content.steps.map((s, i) => (
            <div key={i} className="relative p-7 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-gold-500/20 transition-all duration-500">
              {i < content.steps.length - 1 && <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gold-500/20 to-transparent -z-0" />}
              <span className="block text-5xl font-bold text-gold-500/10 font-serif mb-3">{s.number}</span>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================================================================
   REVIEWS
   ====================================================================== */
function Reviews() {
  const { content } = useC();
  return (
    <section id="reviews" className="relative py-24 md:py-32 bg-[#070707] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="text-gold-500 text-[10px] font-semibold tracking-[0.3em] uppercase">Отзывы</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{content.reviewsTitle} <span className="font-serif italic text-gold-400">{content.reviewsAccent}</span></h2>
          <p className="mt-4 text-white/35 max-w-2xl mx-auto">{content.reviewsSubtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {content.reviews.map((r, i) => (
            <div key={i} className="p-7 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-gold-500/20 transition-all duration-500">
              <div className="flex items-start justify-between mb-5">
                <svg className="w-7 h-7 text-gold-500/15" viewBox="0 0 24 24" fill="currentColor"><path d={icons.quote} /></svg>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, si) => (
                  <svg key={si} className={`w-3 h-3 ${si < r.rating ? "text-gold-400 fill-gold-400" : "text-white/10 fill-white/10"}`} viewBox="0 0 24 24"><path d={icons.star} /></svg>
                ))}</div>
              </div>
              <p className="text-white/45 text-sm leading-relaxed mb-6">{r.text}</p>
              <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center">
                  <span className="text-gold-400 text-[10px] font-bold">{r.avatar}</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{r.name}</p>
                  <p className="text-gold-500/50 text-[11px] font-medium">{r.car}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ======================================================================
   FAQ
   ====================================================================== */
function FAQ() {
  const { content } = useC();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24 md:py-32 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="text-gold-500 text-[10px] font-semibold tracking-[0.3em] uppercase">FAQ</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{content.faqTitle} <span className="font-serif italic text-gold-400">{content.faqAccent}</span></h2>
          <p className="mt-4 text-white/35">{content.faqSubtitle}</p>
        </div>
        <div className="space-y-3">
          {content.faqs.map((f, i) => {
            const isO = openIdx === i;
            return (
              <div key={i} className={`rounded-2xl border transition-all duration-500 ${isO ? "border-gold-500/20 bg-gold-500/[0.03]" : "border-white/5 bg-white/[0.01]"}`}>
                <button onClick={() => setOpenIdx(isO ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className={`text-sm font-semibold pr-4 transition ${isO ? "text-gold-400" : "text-white/70"}`}>{f.question}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${isO ? "bg-gold-500/20 text-gold-400" : "bg-white/5 text-white/25"}`}>
                    <Icon d={isO ? icons.minus : icons.plus} className="w-3.5 h-3.5" />
                  </div>
                </button>
                {isO && <div className="px-5 pb-5"><p className="text-white/35 text-sm leading-relaxed">{f.answer}</p></div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ======================================================================
   CONTACT FORM
   ====================================================================== */
function Contact() {
  const { content, addSub } = useC();
  const [form, setForm] = useState({ name: "", phone: "", carType: "", budget: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addSub(form);
    setSent(true);
    setForm({ name: "", phone: "", carType: "", budget: "", message: "" });
    setTimeout(() => setSent(false), 5000);
  };

  const inp = "w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:border-gold-500/40 outline-none transition-all text-sm";

  return (
    <section id="contact" className="relative py-24 md:py-32 bg-[#070707] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="text-gold-500 text-[10px] font-semibold tracking-[0.3em] uppercase">Контакты</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{content.ctaTitle} <span className="font-serif italic text-gold-400">{content.ctaAccent}</span></h2>
          <p className="mt-4 text-white/35 max-w-2xl mx-auto">{content.ctaText}</p>
        </div>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 sm:p-8">
              {sent ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-5">
                    <Icon d={icons.check} className="w-8 h-8 text-gold-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Заявка отправлена!</h3>
                  <p className="text-white/35 text-sm">Эксперт свяжется с вами в течение 15 минут</p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">Ваше имя *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Александр" className={inp} /></div>
                    <div><label className="block text-[10px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">Телефон *</label><input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+7 (___) ___-__-__" className={inp} /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">Какой автомобиль?</label><input value={form.carType} onChange={e => setForm({...form, carType: e.target.value})} placeholder="Марка, модель, год" className={inp} /></div>
                    <div><label className="block text-[10px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">Бюджет</label>
                      <select value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className={inp + " appearance-none cursor-pointer"}>
                        <option value="" className="bg-[#111]">Выберите</option>
                        <option value="до 1 млн ₽" className="bg-[#111]">до 1 млн ₽</option>
                        <option value="1 — 2 млн ₽" className="bg-[#111]">1 — 2 млн ₽</option>
                        <option value="2 — 4 млн ₽" className="bg-[#111]">2 — 4 млн ₽</option>
                        <option value="4 — 7 млн ₽" className="bg-[#111]">4 — 7 млн ₽</option>
                        <option value="7+ млн ₽" className="bg-[#111]">7+ млн ₽</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-[10px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">Пожелания</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} placeholder="Что для вас важно..." className={inp + " resize-none"} /></div>
                  <button type="submit" className="w-full group flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold rounded-xl text-sm uppercase tracking-wider shadow-2xl shadow-gold-500/20 hover:from-gold-400 hover:to-gold-500 transition-all">
                    <Icon d={icons.send} className="w-4 h-4" />{content.ctaButton}
                  </button>
                </form>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Контакты</h3>
              {[
                { icon: icons.phone, label: "Телефон", val: content.phone, href: `tel:${content.phone.replace(/\D/g, "")}` },
                { icon: icons.mail, label: "Email", val: content.email, href: `mailto:${content.email}` },
                { icon: icons.mapPin, label: "Адрес", val: content.address },
                { icon: icons.clock, label: "Режим работы", val: content.workHours },
              ].map((it, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0"><Icon d={it.icon} className="w-3.5 h-3.5 text-gold-400" /></div>
                  <div>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider font-semibold">{it.label}</p>
                    {it.href ? <a href={it.href} className="text-sm text-white/60 hover:text-gold-400 transition font-medium">{it.val}</a> : <p className="text-sm text-white/60 font-medium">{it.val}</p>}
                  </div>
                </div>
              ))}
            </div>
            <a href={content.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE] font-semibold text-sm hover:bg-[#2AABEE]/15 transition">
              <Icon d={icons.msg} className="w-4 h-4" /> Написать в Telegram
            </a>
            <a href={content.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-semibold text-sm hover:bg-[#25D366]/15 transition">
              <Icon d={icons.msg} className="w-4 h-4" /> Написать в WhatsApp
            </a>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/20">
              <p className="text-gold-400 font-bold text-sm mb-1">✦ Первая консультация — бесплатно</p>
              <p className="text-white/35 text-xs leading-relaxed">Обсудим требования и составим план подбора без обязательств</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ======================================================================
   FOOTER
   ====================================================================== */
function Footer() {
  const { content } = useC();
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <footer className="bg-[#050505] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center"><span className="text-black font-black text-[10px]">AS</span></div>
              <span className="text-sm font-bold text-white">{content.brand}<span className="text-gold-500/40 font-light ml-1">Premium</span></span>
            </div>
            <p className="text-xs text-white/25 leading-relaxed">Премиальный подбор автомобилей с безупречной репутацией.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Навигация</h4>
            <div className="space-y-1.5">
              {["about","services","steps","reviews","faq"].map(id => <button key={id} onClick={() => scroll(id)} className="block text-xs text-white/25 hover:text-gold-400 transition capitalize">{id === "about" ? "О нас" : id === "services" ? "Услуги" : id === "steps" ? "Этапы" : id === "reviews" ? "Отзывы" : "FAQ"}</button>)}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Услуги</h4>
            <div className="space-y-1.5">{content.services.slice(0, 4).map((s, i) => <p key={i} className="text-xs text-white/25">{s.title}</p>)}</div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Контакты</h4>
            <div className="space-y-2">
              <a href={`tel:${content.phone.replace(/\D/g, "")}`} className="flex items-center gap-1.5 text-xs text-white/25 hover:text-gold-400 transition"><Icon d={icons.phone} className="w-3 h-3" />{content.phone}</a>
              <a href={`mailto:${content.email}`} className="flex items-center gap-1.5 text-xs text-white/25 hover:text-gold-400 transition"><Icon d={icons.mail} className="w-3 h-3" />{content.email}</a>
              <p className="flex items-start gap-1.5 text-xs text-white/25"><Icon d={icons.mapPin} className="w-3 h-3 shrink-0 mt-0.5" />{content.address}</p>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-white/5 text-center"><p className="text-[11px] text-white/15">{content.footerText}</p></div>
      </div>
    </footer>
  );
}

/* ======================================================================
   LANDING PAGE
   ====================================================================== */
function Landing() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <Header />
      <Hero />
      <About />
      <Services />
      <Steps />
      <Reviews />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

/* ======================================================================
   ADMIN PANEL
   ====================================================================== */
type ATab = "dash"|"subs"|"general"|"hero"|"about"|"services"|"steps"|"reviews"|"faq"|"cta";

function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("as_a") === "1");
  const [pw, setPw] = useState(""); const [pwErr, setPwErr] = useState(false); const [pwShow, setPwShow] = useState(false);
  const [tab, setTab] = useState<ATab>("dash");
  const [sb, setSb] = useState(false);
  const [saved, setSaved] = useState(false);
  const { content, setContent, resetContent, subs, updSub, delSub, setPage } = useC();
  const [d, setD] = useState<SiteContent>({ ...content });

  const save = () => { setContent(d); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const reset = () => { if (confirm("Сбросить все изменения?")) { resetContent(); window.location.reload(); } };
  const logout = () => { sessionStorage.removeItem("as_a"); setAuthed(false); };
  const s = (k: keyof SiteContent, v: unknown) => setD(p => ({ ...p, [k]: v }));

  // ---- LOGIN SCREEN ----
  if (!authed) {
    const login = (e: React.FormEvent) => { e.preventDefault(); if (pw === "admin123") { sessionStorage.setItem("as_a", "1"); setAuthed(true); } else { setPwErr(true); setTimeout(() => setPwErr(false), 2500); } };
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808] p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4"><span className="text-black font-black text-lg">AS</span></div>
            <h1 className="text-xl font-bold text-white">Панель управления</h1>
            <p className="text-white/25 text-sm mt-1">AutoSelect Premium</p>
          </div>
          <form onSubmit={login} className="bg-white/[0.02] border border-white/5 rounded-2xl p-7 space-y-5">
            <div>
              <label className="block text-[10px] font-semibold text-white/35 mb-1.5 uppercase tracking-wider">Пароль</label>
              <div className="relative">
                <Icon d={icons.lock} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
                <input type={pwShow ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="Введите пароль"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.03] border text-white text-sm placeholder:text-white/15 outline-none transition ${pwErr ? "border-red-500/50" : "border-white/10 focus:border-gold-500/40"}`} />
                <button type="button" onClick={() => setPwShow(!pwShow)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/35"><Icon d={pwShow ? icons.eyeOff : icons.eye} className="w-4 h-4" /></button>
              </div>
              {pwErr && <p className="mt-1.5 text-xs text-red-400">Неверный пароль</p>}
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold text-sm uppercase tracking-wider hover:from-gold-400 hover:to-gold-500 transition shadow-lg shadow-gold-500/20">Войти</button>
            <p className="text-center text-[10px] text-white/10">Пароль: admin123</p>
          </form>
          <button onClick={() => setPage("landing")} className="mt-4 w-full text-center text-xs text-white/20 hover:text-white/40 transition">← Вернуться на сайт</button>
        </div>
      </div>
    );
  }

  // ---- helpers ----
  const Inp = ({ label, value, onChange, multi }: { label: string; value: string; onChange: (v: string) => void; multi?: boolean }) => (
    <div>
      <label className="block text-[10px] font-semibold text-white/35 mb-1 uppercase tracking-wider">{label}</label>
      {multi ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none focus:border-gold-500/40 transition resize-none" />
        : <input value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none focus:border-gold-500/40 transition" />}
    </div>
  );
  const Card = ({ children, cls="" }: { children: React.ReactNode; cls?: string }) => <div className={`bg-white/[0.02] border border-white/5 rounded-2xl p-5 ${cls}`}>{children}</div>;

  const tabs: { id: ATab; label: string; ic: string }[] = [
    { id: "dash", label: "Обзор", ic: icons.home },
    { id: "subs", label: "Заявки", ic: icons.inbox },
    { id: "general", label: "Общее", ic: icons.settings },
    { id: "hero", label: "Главный экран", ic: icons.eye },
    { id: "about", label: "О нас", ic: icons.file },
    { id: "services", label: "Услуги", ic: icons.star },
    { id: "steps", label: "Этапы", ic: icons.arrowR },
    { id: "reviews", label: "Отзывы", ic: icons.msg },
    { id: "faq", label: "FAQ", ic: icons.plus },
    { id: "cta", label: "CTA / Подвал", ic: icons.send },
  ];

  const newC = subs.filter(x => x.status === "Новая").length;
  const isE = tab !== "dash" && tab !== "subs";

  // ---- RENDER SECTIONS ----
  const renderContent = () => {
    if (tab === "dash") {
      const c = { t: subs.length, n: newC, w: subs.filter(x => x.status==="В работе").length, d: subs.filter(x => x.status==="Завершена").length };
      return (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-white">Обзор</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[{ l: "Всего", v: c.t, cl: "text-white" }, { l: "Новые", v: c.n, cl: "text-gold-400" }, { l: "В работе", v: c.w, cl: "text-blue-400" }, { l: "Готово", v: c.d, cl: "text-emerald-400" }].map((x, i) => (
              <Card key={i}><p className="text-[9px] text-white/25 uppercase tracking-wider font-semibold">{x.l}</p><p className={`text-2xl font-bold mt-1 ${x.cl}`}>{x.v}</p></Card>
            ))}
          </div>
          {subs.length > 0 && <Card><h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Последние заявки</h3><div className="space-y-2">{subs.slice(0, 5).map(x => (
            <div key={x.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div><p className="text-white text-sm font-medium">{x.name}</p><p className="text-[10px] text-white/25">{x.phone} · {x.date}</p></div>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${x.status==="Новая"?"bg-gold-500/15 text-gold-400":x.status==="В работе"?"bg-blue-500/15 text-blue-400":x.status==="Завершена"?"bg-emerald-500/15 text-emerald-400":"bg-red-500/15 text-red-400"}`}>{x.status}</span>
            </div>
          ))}</div></Card>}
        </div>
      );
    }
    if (tab === "subs") {
      return (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-white">Заявки с сайта</h2>
          {subs.length === 0 ? <Card cls="text-center py-14"><Icon d={icons.inbox} className="w-8 h-8 text-white/10 mx-auto mb-2" /><p className="text-white/25 text-sm">Заявок пока нет</p></Card>
          : <div className="space-y-3">{subs.map(x => (
            <Card key={x.id} cls="space-y-2.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div><p className="text-white font-bold text-sm">{x.name}</p><p className="text-[10px] text-white/25 mt-0.5"><a href={`tel:${x.phone}`} className="text-gold-400 hover:underline">{x.phone}</a> · {x.date}</p></div>
                <div className="flex items-center gap-2">
                  <select value={x.status} onChange={e => updSub(x.id, e.target.value)} className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-white outline-none">
                    {["Новая","В работе","Завершена","Отклонена"].map(o => <option key={o} className="bg-[#111]">{o}</option>)}
                  </select>
                  <button onClick={() => { if (confirm("Удалить?")) delSub(x.id); }} className="p-1 rounded-lg hover:bg-red-500/20 text-white/15 hover:text-red-400 transition"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {(x.carType || x.budget) && <div className="flex gap-2 flex-wrap">{x.carType && <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-medium">🚗 {x.carType}</span>}{x.budget && <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">💰 {x.budget}</span>}</div>}
              {x.message && <p className="text-white/25 text-xs bg-white/[0.02] rounded-xl p-2.5 border border-white/5">{x.message}</p>}
            </Card>
          ))}</div>}
        </div>
      );
    }
    if (tab === "general") return (
      <div className="space-y-5"><h2 className="text-lg font-bold text-white">Общие настройки</h2><Card cls="space-y-3">
        <Inp label="Бренд" value={d.brand} onChange={v => s("brand", v)} />
        <Inp label="Телефон" value={d.phone} onChange={v => s("phone", v)} />
        <Inp label="Email" value={d.email} onChange={v => s("email", v)} />
        <Inp label="Адрес" value={d.address} onChange={v => s("address", v)} />
        <Inp label="Режим работы" value={d.workHours} onChange={v => s("workHours", v)} />
        <Inp label="Telegram" value={d.telegram} onChange={v => s("telegram", v)} />
        <Inp label="WhatsApp" value={d.whatsapp} onChange={v => s("whatsapp", v)} />
        <Inp label="Текст подвала" value={d.footerText} onChange={v => s("footerText", v)} />
      </Card></div>
    );
    if (tab === "hero") return (
      <div className="space-y-5"><h2 className="text-lg font-bold text-white">Главный экран</h2><Card cls="space-y-3">
        <Inp label="Заголовок" value={d.heroTitle} onChange={v => s("heroTitle", v)} />
        <Inp label="Акцент (курсив)" value={d.heroAccent} onChange={v => s("heroAccent", v)} />
        <Inp label="Подзаголовок" value={d.heroSubtitle} onChange={v => s("heroSubtitle", v)} multi />
        <Inp label="Кнопка" value={d.heroCTA} onChange={v => s("heroCTA", v)} />
        <Inp label="URL фото" value={d.heroImage} onChange={v => s("heroImage", v)} />
        {d.heroImage && <div className="rounded-xl overflow-hidden border border-white/10"><img src={d.heroImage} alt="" className="w-full h-32 object-cover opacity-50" /></div>}
      </Card></div>
    );
    if (tab === "about") return (
      <div className="space-y-5"><h2 className="text-lg font-bold text-white">О нас</h2><Card cls="space-y-3">
        <Inp label="Заголовок" value={d.aboutTitle} onChange={v => s("aboutTitle", v)} />
        <Inp label="Акцент" value={d.aboutAccent} onChange={v => s("aboutAccent", v)} />
        <Inp label="Текст 1" value={d.aboutText} onChange={v => s("aboutText", v)} multi />
        <Inp label="Текст 2" value={d.aboutText2} onChange={v => s("aboutText2", v)} multi />
      </Card><Card cls="space-y-3">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Статистика</p>
        {d.aboutStats.map((x, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={x.value} onChange={e => { const n=[...d.aboutStats]; n[i]={...n[i],value:e.target.value}; s("aboutStats",n); }} placeholder="Значение" className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" />
            <input value={x.label} onChange={e => { const n=[...d.aboutStats]; n[i]={...n[i],label:e.target.value}; s("aboutStats",n); }} placeholder="Описание" className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" />
            <button onClick={() => s("aboutStats",d.aboutStats.filter((_,j)=>j!==i))} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/15 hover:text-red-400 transition"><Icon d={icons.trash} className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => s("aboutStats",[...d.aboutStats,{value:"",label:""}])} className="flex items-center gap-1 text-[10px] text-gold-400 font-medium"><Icon d={icons.plus} className="w-3 h-3" /> Добавить</button>
      </Card></div>
    );

    // Generic list editor for services, steps, reviews, faq
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listEditor = (
      title: string, titleK: keyof SiteContent, accentK: keyof SiteContent, subK: keyof SiteContent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listK: keyof SiteContent, items: any[], emptyItem: any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderFields: (item: any, upd: (f: string, v: unknown) => void) => React.ReactNode
    ) => (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={() => s(listK, [...items, emptyItem] as never)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-500/15 text-gold-400 text-[10px] font-semibold"><Icon d={icons.plus} className="w-3 h-3" /> Добавить</button>
        </div>
        <Card cls="space-y-3">
          <Inp label="Заголовок" value={d[titleK] as string} onChange={v => s(titleK, v)} />
          <Inp label="Акцент" value={d[accentK] as string} onChange={v => s(accentK, v)} />
          <Inp label="Подзаголовок" value={d[subK] as string} onChange={v => s(subK, v)} />
        </Card>
        <div className="space-y-3">{items.map((item, i) => {
          const upd = (f: string, v: unknown) => { const n = [...items]; n[i] = { ...n[i], [f]: v }; s(listK, n as never); };
          return (
            <Card key={i} cls="space-y-2.5">
              <div className="flex items-center justify-between"><span className="text-[9px] text-white/25 font-semibold uppercase tracking-wider">#{i+1}</span><button onClick={() => s(listK, items.filter((_,j)=>j!==i) as never)} className="p-1 rounded-lg hover:bg-red-500/20 text-white/15 hover:text-red-400 transition"><Icon d={icons.trash} className="w-3 h-3" /></button></div>
              {renderFields(item, upd)}
            </Card>
          );
        })}</div>
      </div>
    );

    if (tab === "services") return listEditor("Услуги", "servicesTitle", "servicesAccent", "servicesSubtitle", "services", d.services, { icon: "🔍", title: "", description: "", price: "" }, (item, upd) => (<>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase tracking-wider">Иконка (emoji)</label><input value={item.icon as string} onChange={e => upd("icon", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
        <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase tracking-wider">Цена</label><input value={item.price as string} onChange={e => upd("price", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
      </div>
      <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase tracking-wider">Название</label><input value={item.title as string} onChange={e => upd("title", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
      <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase tracking-wider">Описание</label><textarea value={item.description as string} onChange={e => upd("description", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none resize-none" /></div>
    </>));

    if (tab === "steps") return listEditor("Этапы работы", "stepsTitle", "stepsAccent", "stepsSubtitle", "steps", d.steps, { number: String(d.steps.length+1).padStart(2,"0"), title: "", description: "" }, (item, upd) => (<>
      <div className="grid grid-cols-4 gap-2">
        <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">№</label><input value={item.number as string} onChange={e => upd("number", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
        <div className="col-span-3"><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Заголовок</label><input value={item.title as string} onChange={e => upd("title", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
      </div>
      <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Описание</label><textarea value={item.description as string} onChange={e => upd("description", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none resize-none" /></div>
    </>));

    if (tab === "reviews") return listEditor("Отзывы", "reviewsTitle", "reviewsAccent", "reviewsSubtitle", "reviews", d.reviews, { name:"", car:"", text:"", rating:5, avatar:"" }, (item, upd) => (<>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Имя</label><input value={item.name as string} onChange={e => upd("name", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
        <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Автомобиль</label><input value={item.car as string} onChange={e => upd("car", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
        <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Инициалы</label><input value={item.avatar as string} onChange={e => upd("avatar", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
      </div>
      <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Рейтинг</label><div className="flex gap-1">{[1,2,3,4,5].map(r => <button key={r} onClick={() => upd("rating",r)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${r <= (item.rating as number) ? "bg-gold-500/20 text-gold-400" : "bg-white/[0.03] text-white/15"}`}>★</button>)}</div></div>
      <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Текст</label><textarea value={item.text as string} onChange={e => upd("text", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none resize-none" /></div>
    </>));

    if (tab === "faq") return listEditor("FAQ", "faqTitle", "faqAccent", "faqSubtitle", "faqs", d.faqs, { question:"", answer:"" }, (item, upd) => (<>
      <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Вопрос</label><input value={item.question as string} onChange={e => upd("question", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none" /></div>
      <div><label className="block text-[9px] text-white/25 mb-0.5 uppercase">Ответ</label><textarea value={item.answer as string} onChange={e => upd("answer", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm outline-none resize-none" /></div>
    </>));

    if (tab === "cta") return (
      <div className="space-y-5"><h2 className="text-lg font-bold text-white">CTA и подвал</h2><Card cls="space-y-3">
        <Inp label="Заголовок" value={d.ctaTitle} onChange={v => s("ctaTitle", v)} />
        <Inp label="Акцент" value={d.ctaAccent} onChange={v => s("ctaAccent", v)} />
        <Inp label="Текст" value={d.ctaText} onChange={v => s("ctaText", v)} multi />
        <Inp label="Кнопка" value={d.ctaButton} onChange={v => s("ctaButton", v)} />
      </Card></div>
    );

    return null;
  };

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {sb && <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setSb(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-transform duration-300 ${sb ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center"><span className="text-black font-black text-[9px]">AS</span></div>
            <div><p className="text-white font-bold text-xs">Admin Panel</p><p className="text-white/15 text-[9px]">AutoSelect</p></div>
          </div>
          <button onClick={() => setSb(false)} className="lg:hidden text-white/25"><Icon d={icons.x} className="w-4 h-4" /></button>
        </div>
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSb(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition ${tab===t.id ? "bg-gold-500/10 text-gold-400 border border-gold-500/20" : "text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"}`}>
              <Icon d={t.ic} className="w-3.5 h-3.5" />{t.label}
              {t.id === "subs" && newC > 0 && <span className="ml-auto px-1.5 py-0.5 bg-gold-500 text-black text-[8px] rounded-md font-bold">{newC}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2.5 border-t border-white/5 space-y-0.5">
          <button onClick={() => { setPage("landing"); window.scrollTo(0,0); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-white/35 hover:text-white/60 hover:bg-white/[0.03] transition"><Icon d={icons.eye} className="w-3.5 h-3.5" /> Открыть сайт</button>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"><Icon d={icons.logout} className="w-3.5 h-3.5" /> Выйти</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setSb(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/35"><Icon d={icons.menu} className="w-4 h-4" /></button>
            <h1 className="text-sm font-bold text-white">{tabs.find(t => t.id === tab)?.label}</h1>
          </div>
          {isE && <div className="flex items-center gap-2">
            <button onClick={reset} className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 text-white/30 text-[10px] font-medium hover:text-white/60 transition"><Icon d={icons.reset} className="w-3 h-3" /> Сброс</button>
            <button onClick={save} className={`flex items-center gap-1 px-3.5 py-1 rounded-lg text-[10px] font-bold transition ${saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-gradient-to-r from-gold-500 to-gold-600 text-black shadow-lg shadow-gold-500/20"}`}>
              <Icon d={saved ? icons.check : icons.save} className="w-3 h-3" />{saved ? "Сохранено" : "Сохранить"}
            </button>
          </div>}
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}

/* ======================================================================
   APP (root)
   ====================================================================== */
export default function App() {
  return (
    <Provider>
      <Router />
    </Provider>
  );
}

function Router() {
  const { page } = useC();
  if (page === "admin") return <Admin />;
  return <Landing />;
}
