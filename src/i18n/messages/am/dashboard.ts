import type { dashboard as en } from '../en/dashboard';

export const dashboard: typeof en = {
  welcome: {
    there: 'ተማሪ', line: '{greeting}፣ {name}።', newUser: 'ወደ Zetora እንኳን በደህና መጡ — አንድ ትምህርት መርጠው የመጀመሪያ ምዕራፍዎን ይክፈቱ።',
    returning: 'አዲስ ነገር ለመማር ዝግጁ ነዎት?', streak: 'የ{count} ቀን ተከታታይ ጥናት', startStreak: 'ዛሬ ተከታታይ ጥናት ይጀምሩ',
    inProgress: '{units} በመካሄድ ላይ',
  },
  overall: {
    title: 'ጠቅላላ እድገት', ring: 'ጠቅላላ የትምህርት ማጠናቀቂያ', unitsCompleted: 'የተጠናቀቁ ምዕራፎች',
    quizzesCompleted: 'የተጠናቀቁ ኩዊዞች', avgQuiz: 'አማካይ የኩዊዝ ውጤት',
  },
  continue: {
    eyebrow: 'ትምህርትዎን ይቀጥሉ', cta: 'ቀጥል', meta: '{min} · መጨረሻ የተከፈተው {when}', upNext: 'ቀጣይ', startFirst: 'የመጀመሪያ ምዕራፍዎን ይጀምሩ',
    startUnit: 'ምዕራፉን ጀምር', getStarted: 'ይጀምሩ', chooseSubject: 'ለመጀመር ትምህርት ይምረጡ', browse: 'ትምህርቶችን ይመልከቱ',
    lastUnitHint: 'መጨረሻ የተማሩት ምዕራፍ እዚህ ይታያል', unitProgress: 'የምዕራፍ እድገት', unitLine: 'ምዕራፍ {n}፦ {title}',
  },
  subjects: {
    title: 'የእኔ ትምህርቶች', viewAll: 'ሁሉንም ይመልከቱ', emptyTitle: 'እስካሁን ትምህርት የለም', emptyBody: 'ትምህርቶች እንደታተሙ እዚህ ይታያሉ።',
    completionAria: 'የ{title} ማጠናቀቂያ', line: '{units} · {done} ተጠናቋል',
  },
  today: {
    title: 'የዛሬ የጥናት እንቅስቃሴ', doneOf: '{done}/{total} ተከናውኗል', aria: 'የተጠናቀቁ የዛሬ ግቦች', openUnit: 'ምዕራፍ ይክፈቱ',
    readSummary: 'ማጠቃለያ ያንብቡ', completeQuiz: 'ኩዊዝ ይጨርሱ', allDone: 'ለዛሬ ሁሉንም ጨርሰዋል — ጥሩ ሥራ!',
  },
  recommended: {
    title: 'የሚመከሩ ቀጣይ ርምጃዎች', emptyTitle: 'ሁሉንም ጨርሰዋል', emptyBody: 'ሲማሩና ኩዊዝ ሲወስዱ አዳዲስ ምክሮች ይታያሉ።',
    reason: { resume: 'ካቆሙበት ይቀጥሉ', next: 'ቀጥሎ ይጀምሩ', review: 'መከለስ ያስፈልገዋል' },
  },
  activity: {
    title: 'የቅርብ ጊዜ እንቅስቃሴ', emptyTitle: 'እስካሁን ምንም የለም', emptyBody: 'በቅርቡ የከፈቷቸው ምዕራፎች፣ ማጠቃለያዎችና የኩዊዝ ውጤቶች እዚህ ይታያሉ።',
    opened: '{unit}ን ከፍተዋል', readSummary: 'የ{unit} ማጠቃለያን አንብበዋል', completed: '{unit}ን አጠናቀዋል', material: '“{title}”ን ከፍተዋል',
    quiz: '“{title}”ን ጨርሰዋል — {pct}%', exam: 'ፈተና “{title}”ን ጨርሰዋል — {pct}%', aUnit: 'አንድ ምዕራፍ', aMaterial: 'አንድ ቁሳቁስ', generic: 'እንቅስቃሴ',
  },
  quick: { browse: 'ትምህርቶችን ይመልከቱ', continue: 'ትምህርትዎን ይቀጥሉ', practice: 'የልምምድ ኩዊዝ ይውሰዱ', progress: 'እድገቴን ይመልከቱ' },
  overview: 'የውጤት አጠቃላይ እይታ',
};
