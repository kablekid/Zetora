import type { learn as en } from '../en/learn';

export const learn: typeof en = {
  tabs: {
    nav: 'የምዕራፉ ክፍሎች', overview: 'አጠቃላይ እይታ', summary: 'ማጠቃለያ', materials: 'የመማሪያ ቁሳቁሶች', quiz: 'የልምምድ ኩዊዝ',
    test: 'የምዕራፍ ፈተና', notYet: 'ገና አልተዘጋጀም',
  },
  header: {
    unit: 'ምዕራፍ {n}', inProgress: 'በመካሄድ ላይ · {pct}%', bookmark: 'ዕልባት', bookmarked: 'ዕልባት ተደርጓል',
    markCompleted: 'እንደተጠናቀቀ ምልክት አድርግ', markNotCompleted: 'እንዳልተጠናቀቀ ምልክት አድርግ', removeBookmark: 'ዕልባቱን አስወግድ',
    updated: 'ተዘምኗል', saved: 'ተቀምጧል',
    bookmarkRemoved: 'ዕልባት ተወግዷል',
  },
  overview: {
    noIntro: 'ለዚህ ምዕራፍ እስካሁን መግቢያ አልተጨመረም።',
    introduction: 'መግቢያ', objectives: 'የመማር ዓላማዎች', objectivesLead: 'ይህን ምዕራፍ ሲጨርሱ የሚከተሉትን ማድረግ መቻል አለብዎት፦',
    topics: 'ዋና ርዕሶች', concepts: 'አስፈላጊ ጽንሰ ሐሳቦች', status: 'ሁኔታ', studyTime: 'የሚገመት የጥናት ጊዜ', summary: 'ማጠቃለያ',
    materials: 'ቁሳቁሶች', quizzes: 'ኩዊዞች', available: 'አለ', comingSoon: 'በቅርብ ጊዜ', noneYet: 'እስካሁን የለም',
    readSummary: 'ማጠቃለያውን ያንብቡ', practiceNow: 'አሁን ይለማመዱ', overviewOnly: 'አጠቃላይ እይታ ብቻ',
  },
  summary: {
    onThisPage: 'በዚህ ገጽ ላይ', minRead: 'ወደ {count} ደቂቃ የንባብ ጊዜ', finishedTitle: 'ማንበብ ጨርሰዋል?',
    finishedBody: 'እድገትዎ እንዲዘምን ይህን ምዕራፍ እንደተጠናቀቀ ምልክት ያድርጉ፤ ከዚያ በልምምድ ኩዊዙ ራስዎን ይፈትሹ።',
    comingTitle: 'ማጠቃለያው በቅርቡ ይመጣል',
    comingBody: 'የዚህ ምዕራፍ ማጠቃለያ ገና አልታተመም። በአጠቃላይ እይታው፣ በቁሳቁሶቹ ወይም በልምምድ ኩዊዙ መጀመር ይችላሉ።',
    backToOverview: 'ወደ አጠቃላይ እይታ ተመለስ', readingProgress: 'የንባብ እድገት',
  },
  pager: { nav: 'የምዕራፍ ዳሰሳ', previous: 'ቀዳሚ ምዕራፍ', next: 'ቀጣይ ምዕራፍ', line: 'ምዕራፍ {n}፦ {title}' },
  materials: {
    emptyTitle: 'እስካሁን የመማሪያ ቁሳቁስ የለም',
    emptyBody: 'የዚህ ምዕራፍ የፒዲኤፍ ማስታወሻዎችና የማጣቀሻ ሰነዶች ከታተሙ በኋላ እዚህ ይታያሉ።',
    downloadUnavailable: 'ማውረድ አይቻልም።',
    meta: '{kind} · {size} · የተጨመረው {date}', view: 'ክፈት', download: 'አውርድ',
  },
  quiz: {
    emptyTitle: 'እስካሁን የልምምድ ኩዊዝ የለም', emptyBody: 'የዚህ ምዕራፍ ኩዊዝ በቅርቡ ይታተማል። እስከዚያው ማጠቃለያውን ያንብቡ።',
    practice: 'ልምምድ · ፈጣን ግብረ መልስ', timed: 'በጊዜ የተገደበ · መልሶች ከገቡ በኋላ', passMark: 'የማለፊያ ውጤት {pct}%', best: 'ምርጥ {pct}%',
    start: 'ኩዊዙን ጀምር', resume: 'ኩዊዙን ቀጥል', tryAgain: 'እንደገና ሞክር', reviewLast: 'የመጨረሻውን ሙከራ ይመልከቱ ({pct}%)',
  },
  test: {
    emptyTitle: 'እስካሁን የምዕራፍ ፈተና የለም',
    emptyBody: 'የዚህ ምዕራፍ በጊዜ የተገደበ ፈተና አልታተመም። ግንዛቤዎን በልምምድ ኩዊዙ መፈተሽ ይችላሉ።',
    upTo: { one: 'እስከ {count} ጥያቄ', other: 'እስከ {count} ጥያቄዎች' }, start: 'ፈተናውን ጀምር',
  },
};
