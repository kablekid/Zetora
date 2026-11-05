import type { nav as en } from '../en/nav';

export const nav: typeof en = {
  student: { home: 'መነሻ', subjects: 'ትምህርቶች', exams: 'ፈተናዎች', progress: 'እድገት', saved: 'የተቀመጡ' },
  secondary: { notifications: 'ማሳወቂያዎች', settings: 'ቅንብሮች' },
  admin: {
    overview: 'አጠቃላይ እይታ', students: 'ተማሪዎች', subjects: 'ትምህርቶች', units: 'ምዕራፎች', summaries: 'ማጠቃለያዎች',
    materials: 'የመማሪያ ቁሳቁሶች', questions: 'የጥያቄ ባንክ', quizzes: 'ኩዊዞች', exams: 'ፈተናዎች', analytics: 'ትንተና', settings: 'ቅንብሮች',
  },
  sections: { learn: 'ትምህርት', account: 'መለያ' },
  labels: { primary: 'ዋና', main: 'ዋና ምናሌ' },
  userMenu: {
    open: 'የመገለጫ ምናሌን ክፈት', adminDashboard: 'የአስተዳዳሪ ዳሽቦርድ', studentView: 'የተማሪ እይታ', notifications: 'ማሳወቂያዎች',
    settings: 'መገለጫ እና ቅንብሮች', signOut: 'ውጣ', appearance: 'ገጽታ', language: 'ቋንቋ',
  },
  search: { trigger: 'ትምህርቶችን፣ ምዕራፎችንና ቁሳቁሶችን ፈልግ', placeholder: 'ትምህርቶች፣ ምዕራፎች፣ ማጠቃለያዎችን ይፈልጉ…', short: 'ፈልግ', shortcut: 'Ctrl K' },
  shell: {
    promoTitle: 'ይማሩ። ይለማመዱ። ያሳኩ።', promoBody: 'ምዕራፍ ይክፈቱ፣ ማጠቃለያውን ያንብቡ፣ ከዚያም በኩዊዝ ራስዎን ይፈትሹ።',
    adminConsole: 'የአስተዳዳሪ ኮንሶል', openNav: 'ምናሌውን ክፈት', adminNav: 'የአስተዳዳሪ ምናሌ', adminNavDesc: 'በአስተዳዳሪ ኮንሶል ውስጥ ይዘዋወሩ',
    studentView: 'የተማሪ እይታ', adminBadge: 'አስተዳዳሪ', notifications: 'ማሳወቂያዎች', notificationsUnread: 'ማሳወቂያዎች፣ {count} ያልተነበቡ',
  },
  marketing: {
    home: 'መነሻ', explore: 'ትምህርቶችን ይመልከቱ', features: 'ገጽታዎች', about: 'ስለ እኛ', signIn: 'ይግቡ', getStarted: 'ይጀምሩ',
    openDashboard: 'ዳሽቦርድ ክፈት', menu: 'ምናሌ', openMenu: 'ምናሌ ክፈት', menuDesc: 'የገጹ ዳሰሳ', mobile: 'ሞባይል',
  },
};
