import type { common as en } from '../en/common';

export const common: typeof en = {
  tagline: 'ይማሩ። ይለማመዱ። ያሳኩ።',
  actions: {
    save: 'አስቀምጥ', saveChanges: 'ለውጦችን አስቀምጥ', cancel: 'ተው', delete: 'ሰርዝ', edit: 'አርም', create: 'ፍጠር', close: 'ዝጋ',
    back: 'ተመለስ', next: 'ቀጣይ', previous: 'ቀዳሚ', continue: 'ቀጥል', view: 'ክፈት', download: 'አውርድ', upload: 'ስቀል',
    search: 'ፈልግ', confirm: 'አረጋግጥ', remove: 'አስወግድ', tryAgain: 'እንደገና ሞክር', submit: 'አስገባ', publish: 'አትም',
    unpublish: 'ማተም አቁም', add: 'ጨምር', clear: 'አጽዳ', loading: 'በመጫን ላይ…', seeAll: 'ሁሉንም ይመልከቱ', viewAll: 'ሁሉንም ይመልከቱ',
  },
  status: {
    completed: 'ተጠናቋል', inProgress: 'በመካሄድ ላይ', notStarted: 'አልተጀመረም', published: 'ታትሟል', draft: 'ረቂቅ',
    suspended: 'ታግዷል', demo: 'ናሙና', available: 'ዝግጁ', comingSoon: 'በቅርብ ጊዜ', passed: 'አልፏል', notPassed: 'አላለፈም',
    timedOut: 'ጊዜው አልቋል', optional: 'አማራጭ',
  },
  time: {
    justNow: 'አሁን', seconds: '{s} ሰከንድ', minutes: '{m} ደቂቃ', minSec: '{m} ደቂቃ {s} ሰከንድ',
  },
  greeting: { morning: 'እንደምን አደሩ', afternoon: 'እንደምን ዋሉ', evening: 'እንደምን አመሹ' },
  count: {
    unit: { one: '{count} ምዕራፍ', other: '{count} ምዕራፎች' },
    summary: { one: '{count} ማጠቃለያ', other: '{count} ማጠቃለያዎች' },
    file: { one: '{count} ፋይል', other: '{count} ፋይሎች' },
    question: { one: '{count} ጥያቄ', other: '{count} ጥያቄዎች' },
    attempt: { one: '{count} ሙከራ', other: '{count} ሙከራዎች' },
    day: { one: '{count} ቀን', other: '{count} ቀናት' },
    topic: { one: '{count} ርዕስ', other: '{count} ርዕሶች' },
    account: { one: '{count} መለያ', other: '{count} መለያዎች' },
    section: { one: '{count} ክፍል', other: '{count} ክፍሎች' },
    answer: { one: '{count} መልስ', other: '{count} መልሶች' },
    learner: { one: '{count} ተማሪ', other: '{count} ተማሪዎች' },
  },
  difficulty: { easy: 'ቀላል', medium: 'መካከለኛ', hard: 'ከባድ' },
  questionType: {
    multiple_choice: 'ብዙ ምርጫ', true_false: 'እውነት / ሐሰት', multiple_select: 'ከአንድ በላይ መልስ', short_answer: 'አጭር መልስ',
  },
  examKind: { unit: 'የምዕራፍ ፈተና', subject: 'የትምህርት ፈተና', mixed: 'የተቀላቀለ ፈተና', mock: 'የሙከራ ፈተና' },
  resourceKind: { pdf: 'ፒዲኤፍ', note: 'ማስታወሻ', image: 'ምስል', reference: 'ማጣቀሻ' },
  role: { student: 'ተማሪ', admin: 'አስተዳዳሪ' },
  theme: {
    label: 'ገጽታ', light: 'ብሩህ', dark: 'ጨለማ', system: 'እንደ መሣሪያው', switchToLight: 'ወደ ብሩህ ገጽታ ቀይር', switchToDark: 'ወደ ጨለማ ገጽታ ቀይር',
  },
  language: { label: 'ቋንቋ' },
  a11y: { skipToContent: 'ወደ ዋናው ይዘት ዝለል', loading: 'በመጫን ላይ', close: 'ዝጋ', showPassword: 'የይለፍ ቃል አሳይ', hidePassword: 'የይለፍ ቃል ደብቅ', breadcrumb: 'የገጽ መንገድ', previousPage: 'ቀዳሚ ገጽ', nextPage: 'ቀጣይ ገጽ' },
  pages: {
    notFound: {
      title: 'ገጹ አልተገኘም', heading: 'ይህን ገጽ ማግኘት አልቻልንም',
      body: 'አገናኙ የተበላሸ ሊሆን ይችላል፣ ወይም ትምህርቱ ተወስዷል ወይም ከህትመት ተነስቷል። ወደ መንገድዎ እንመልስዎት።',
      dashboard: 'ወደ ዳሽቦርድ ይሂዱ', home: 'ወደ መነሻ ገጽ ይመለሱ',
    },
    error: {
      heading: 'የሆነ ችግር ተፈጥሯል',
      body: 'ይህን ገጽ መጫን አልተቻለም። ይህ አብዛኛው ጊዜ ጊዜያዊ የግንኙነት ችግር ነው — እባክዎ እንደገና ይሞክሩ።',
      reference: 'ማጣቀሻ፦ {digest}',
    },
  },
};
