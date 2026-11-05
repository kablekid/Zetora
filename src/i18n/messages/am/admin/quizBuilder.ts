import type { quizBuilder as en } from '../../en/admin/quizBuilder';

export const quizBuilder: typeof en = {
  backAria: 'ወደ ኩዊዞች ተመለስ', editTitle: 'ኩዊዝ አርትዕ', newTitle: 'አዲስ ኩዊዝ', save: 'ኩዊዙን አስቀምጥ', settings: 'ቅንብሮች',
  title: 'ርዕስ', titlePlaceholder: 'ለምሳሌ፦ ፈንክሽኖች — የልምምድ ኩዊዝ', desc: 'መግለጫ', subject: 'ትምህርት', unit: 'ምዕራፍ',
  unitHint: 'በምዕራፉ “የልምምድ ኩዊዝ” ትር ላይ ይታያል።', wholeSubject: 'መላው ትምህርት', mode: 'ሁነታ',
  modes: {
    practice: { label: 'ልምምድ', help: 'ከእያንዳንዱ ጥያቄ በኋላ ፈጣን ግብረ መልስና ማብራሪያ።' },
    exam: { label: 'ፈተና', help: 'መልሶችና ማብራሪያዎች ከገቡ በኋላ ብቻ።' },
  },
  passMark: 'የማለፊያ ውጤት (%)', timeLimit: 'የጊዜ ገደብ', timeLimitEnable: 'የጊዜ ገደብ አንቃ', timeLimitAria: 'የጊዜ ገደብ በደቂቃ', noLimit: 'ገደብ የለም',
  timeHint: 'ደቂቃ። በአገልጋዩ ይተገበራል።', shuffle: 'የጥያቄዎችን ቅደም ተከተል ቀላቅል', shuffleHint: 'እያንዳንዱ ሙከራ የተለየ ቅደም ተከተል ያገኛል።',
  published: 'የታተመ', publishedHint: 'ለተማሪዎች ይታያል። ቢያንስ አንድ ጥያቄ ያስፈልገዋል።',
  quizQuestions: 'የኩዊዙ ጥያቄዎች', noQuestions: 'እስካሁን ጥያቄ የለም። ከታች ካለው የጥያቄ ባንክ ይጨምሩ።', removeQuestion: 'ጥያቄ አስወግድ',
  bank: 'ከጥያቄ ባንክ ጨምር', bankSearch: 'የጥያቄ ባንክ ፈልግ', unitFilter: 'የምዕራፍ ማጣሪያ', difficultyFilter: 'የደረጃ ማጣሪያ',
  allUnits: 'ሁሉም ምዕራፎች', unitShort: 'ምዕራፍ {n}', anyLevel: 'ማንኛውም ደረጃ', bankEmpty: 'የሚዛመድ ጥያቄ የለም። መጀመሪያ በጥያቄ ባንክ ውስጥ ጥያቄዎችን ይፍጠሩ።',
  added: 'ተጨምሯል', add: 'ጨምር', addAll: 'የሚታዩትን ሁሉ ጨምር ({count})', meta: '{type} · {difficulty}', metaUnit: '{type} · {difficulty} · ምዕራፍ {n}',
  deleteBody: 'የተማሪዎች ያለፉ ውጤቶች ይቀመጣሉ፤ ኩዊዙ ግን ይወገዳል፤ እንደገናም መወሰድ አይችልም።',
};
