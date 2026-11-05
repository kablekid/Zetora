import type { units as en } from '../../en/admin/units';

export const units: typeof en = {
  subject: 'ትምህርት', newUnit: 'አዲስ ምዕራፍ', emptyTitle: 'በዚህ ትምህርት ውስጥ ምዕራፍ የለም',
  emptyBody: 'ምዕራፎች ተማሪዎች የሚያጠኗቸውን ማጠቃለያ፣ ቁሳቁሶችና ኩዊዞች ይይዛሉ።', editAria: '{title}ን አርትዕ', deleteTitle: '“{title}”ን ይሰረዝ?',
  deleteBody: 'ይህ ምዕራፉን ከማጠቃለያው፣ ርዕሶቹ፣ የመማሪያ ቁሳቁሶቹ፣ ከኩዊዞች ጋር ካለው ትስስርና ከተማሪዎች እድገት ጋር እስከመጨረሻው ይሰርዛል። ይህ ተመልሶ አይመለስም።',
  writeSummary: 'ማጠቃለያ ጻፍ', summaryDraft: 'ማጠቃለያ (ረቂቅ)', summaryPublished: 'ማጠቃለያ (የታተመ)',
  dialog: {
    editTitle: 'ምዕራፍ አርትዕ', newTitle: 'አዲስ ምዕራፍ', description: 'በምዕራፉ የመጀመሪያ ትር ላይ የሚታየው አጠቃላይ ይዘት። ማጠቃለያውን ለብቻው በማጠቃለያ አርታዒ ይጻፉ።',
    number: 'የምዕራፍ ቁጥር', title: 'ርዕስ', titlePlaceholder: 'ለምሳሌ፦ ወሰንና ቀጣይነት', shortDesc: 'አጭር መግለጫ',
    shortDescPlaceholder: 'በምዕራፍ ዝርዝሩ ላይ የሚታይ አንድ መስመር', intro: 'መግቢያ', introHint: 'በአንቀጾች መካከል ባዶ መስመር ይተዉ።',
    objectives: 'የመማር ዓላማዎች', oneLine: 'በእያንዳንዱ መስመር አንድ።', objectivesPlaceholder: 'ፈንክሽን ይተርጉሙ\nየጎራና የክልል ስብስብ ይፈልጉ',
    topics: 'ዋና ርዕሶች', topicsHint: 'በእያንዳንዱ መስመር አንድ። ጥያቄዎች በእነዚህ ሊመደቡ ይችላሉ።', topicsPlaceholder: 'ጎራና ክልል\nየተዋሃዱ ፈንክሽኖች',
    concepts: 'አስፈላጊ ጽንሰ ሐሳቦች', studyTime: 'የጥናት ጊዜ (ደቂቃ)', published: 'የታተመ',
    publishedHint: 'ለተማሪዎች ይታያል (ትምህርቱም መታተም አለበት)።', create: 'ምዕራፍ ፍጠር',
  },
};
