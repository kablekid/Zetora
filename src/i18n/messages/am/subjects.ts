import type { subjects as en } from '../en/subjects';

export const subjects: typeof en = {
  card: {
    explore: 'ትምህርቱን ይመልከቱ', signUp: 'ለመመልከት ይመዝገቡ', fallback: 'ምዕራፎች፣ ማጠቃለያዎችና የልምምድ ጥያቄዎች።',
    unitsProgress: '{done}/{total} ምዕራፎች', progressAria: 'የ{title} እድገት',
  },
  library: {
    searchLabel: 'ትምህርቶችን ፈልግ', searchPlaceholder: 'ትምህርቶችን ይፈልጉ…', clearSearch: 'ፍለጋውን አጽዳ', filterLabel: 'በሁኔታ አጣራ',
    filters: { all: 'ሁሉም', in_progress: 'በመካሄድ ላይ', not_started: 'ያልተጀመሩ', completed: 'የተጠናቀቁ' },
    noneTitle: 'እስካሁን የታተመ ትምህርት የለም', noneBody: 'በቅርቡ ተመልሰው ይመልከቱ — አዳዲስ ትምህርቶች በየጊዜው ይጨመራሉ።',
    noMatchTitle: 'የሚዛመድ ትምህርት የለም', noMatchBody: 'ሌላ ፍለጋ ወይም ማጣሪያ ይሞክሩ።', clearFilters: 'ማጣሪያዎችን አጽዳ',
  },
  list: { title: 'ትምህርቶች', description: 'ምዕራፎቻቸውን፣ ማጠቃለያዎቻቸውን፣ ቁሳቁሶቻቸውንና ኩዊዞቻቸውን ለማየት ትምህርት ይምረጡ።' },
  detail: {
    totalUnits: 'ጠቅላላ ምዕራፎች', completedUnits: 'የተጠናቀቁ ምዕራፎች', estimated: 'የሚገመት ጊዜ', hours: '{hours} ሰዓት የጥናት ጊዜ',
    completedCount: '{count} ተጠናቋል', overall: 'ጠቅላላ እድገት', start: 'ምዕራፍ {n}ን ይጀምሩ', continue: 'ምዕራፍ {n}ን ይቀጥሉ',
    allDone: 'ሁሉንም ምዕራፎች ጨርሰዋል 🎉', unitsHeading: 'ምዕራፎች', emptyTitle: 'እስካሁን ምዕራፍ የለም',
    emptyBody: 'ቡድኑ ይህንን ትምህርት ገና እያዘጋጀ ነው። በቅርቡ ተመልሰው ይመልከቱ።', back: 'ወደ ትምህርቶች ተመለስ', progressAria: 'የ{title} እድገት',
    breadcrumb: 'ትምህርቶች',
  },
  unit: {
    number: 'ምዕራፍ {n}', heading: 'ምዕራፍ {n} · {title}', startHere: 'ከዚህ ይጀምሩ', summary: 'ማጠቃለያ', pdf: 'ፒዲኤፍ', quiz: 'ኩዊዝ',
    notAvailable: 'ገና አልተዘጋጀም',
    bestQuiz: 'ምርጥ የኩዊዝ ውጤት {pct}%', progressAria: 'የምዕራፍ {n} እድገት', hasIt: '{label} አለ', missing: '{label} ገና አልተዘጋጀም',
  },
};
