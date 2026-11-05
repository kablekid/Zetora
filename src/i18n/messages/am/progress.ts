import type { progress as en } from '../en/progress';

export const progress: typeof en = {
  title: 'እድገቴ', description: 'እዚህ ያለው ሁሉ ከራስዎ እንቅስቃሴ የመጣ ነው — ምንም የተገመተ ወይም የተፈጠረ ነገር የለም።',
  emptyTitle: 'እድገትዎ እዚህ ይገነባል',
  emptyBody: 'ምዕራፍ ይክፈቱ፣ እንደተጠናቀቀ ምልክት ያድርጉ ወይም ኩዊዝ ይውሰዱ — ከዚያ ተመልሰው ገበታዎችዎንና ጥንካሬዎችዎን ይመልከቱ።', browse: 'ትምህርቶችን ይመልከቱ →',
  overall: 'ጠቅላላ እድገት', ring: 'ጠቅላላ የትምህርት እድገት', overallLine: 'ከ{total} ምዕራፎች ውስጥ {done} ተጠናቋል',
  tiles: {
    unitsCompleted: 'የተጠናቀቁ ምዕራፎች', quizzesCompleted: 'የተጠናቀቁ ኩዊዞች', avgQuiz: 'አማካይ የኩዊዝ ውጤት', avgExam: 'አማካይ የፈተና ውጤት',
    streak: 'ተከታታይ የጥናት ቀናት', active30: 'ንቁ ቀናት (30 ቀናት)',
  },
  completion: {
    title: 'የትምህርትና የምዕራፍ ማጠናቀቂያ', sr: 'የትምህርትና የምዕራፍ ማጠናቀቂያ', aria: 'የ{title} ማጠናቀቂያ', unitsAria: 'የ{title} ምዕራፎች',
    unitTitle: 'ምዕራፍ {n}፦ {title} — {status}', unitSr: 'ምዕራፍ {n}፦ {title}፣ {status}',
  },
  chartsAria: 'የውጤት ገበታዎች', strengthsAria: 'ጥንካሬዎችና ድክመቶች',
  topics: {
    weakTitle: 'ማጠናከር የሚገባቸው ርዕሶች', strongTitle: 'ጠንካራ ርዕሶችዎ',
    needMore: 'በአንድ ርዕስ ላይ ቢያንስ {count} ጥያቄዎችን ይመልሱ፤ ርዕሱ እዚህ ይታያል።', noWeak: 'አሁን ደካማ ርዕስ የለም — ጥሩ ሥራ።',
    noStrong: 'መለማመድዎን ይቀጥሉ — ጠንካራ ርዕሶች (80%+) እዚህ ይታያሉ።', accuracyAria: 'የ{title} ትክክለኛነት', line: '{subject} · ከ{answered} ውስጥ {correct} ትክክል',
  },
  recent: {
    title: 'የቅርብ ጊዜ የኩዊዝና የፈተና ውጤቶች', sr: 'የቅርብ ጊዜ ውጤቶች', empty: 'እስካሁን የኩዊዝ ወይም የፈተና ውጤት የለም።',
    cols: { activity: 'እንቅስቃሴ', type: 'ዓይነት', score: 'ውጤት', date: 'ቀን' }, review: 'ክለሳ', exam: 'ፈተና', quiz: 'ኩዊዝ',
  },
};
