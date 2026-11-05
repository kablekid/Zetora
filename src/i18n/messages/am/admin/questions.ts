import type { questions as en } from '../../en/admin/questions';

export const questions: typeof en = {
  searchPlaceholder: 'የጥያቄ ጽሑፍ ይፈልጉ…', searchLabel: 'ጥያቄዎችን ፈልግ', newQuestion: 'አዲስ ጥያቄ', subject: 'ትምህርት', unit: 'ምዕራፍ',
  allSubjects: 'ሁሉም ትምህርቶች', allUnits: 'ሁሉም ምዕራፎች', anyDifficulty: 'ማንኛውም ደረጃ', anyType: 'ማንኛውም ዓይነት', difficulty: 'ደረጃ',
  questionType: 'የጥያቄ ዓይነት', total: { one: '{count} ጥያቄ', other: '{count} ጥያቄዎች' },
  emptyTitle: 'ምንም ጥያቄ አልተገኘም', emptyNoSubject: 'መጀመሪያ ትምህርት ይፍጠሩ።', emptyBody: 'ጥያቄ ይፍጠሩ ወይም ማጣሪያዎቹን ያስተካክሉ።',
  editAria: 'ጥያቄ አርትዕ', deleteTitle: 'ይህ ጥያቄ ይሰረዝ?', deleteBody: 'ጥያቄው ከሚጠቀሙበት ሁሉም ኩዊዞች ይወገዳል። ያለፉ ውጤቶች ነጥባቸውን ይይዛሉ።',
  tagUnit: '{subject} · ምዕራፍ {n}',
  dialog: {
    editTitle: 'ጥያቄ አርትዕ', newTitle: 'አዲስ ጥያቄ',
    description: 'ሒሳባዊ ቀመሮችን በዶላር ምልክት ውስጥ ያድርጉ፣ ለምሳሌ <code>$x^2 + 1$</code>። ተማሪዎች እስኪመልሱ ወይም እስኪያስገቡ ድረስ ትክክለኛ መልሶችን አያዩም።',
    noUnit: 'የተወሰነ ምዕራፍ የለም', topic: 'ርዕስ', noTopic: 'የተወሰነ ርዕስ የለም', topicHint: 'ጥያቄዎችን ለመመደብ ለምዕራፉ ርዕሶችን ይጨምሩ።',
    type: 'ዓይነት', question: 'ጥያቄ', questionPlaceholder: 'ጥያቄውን ይጻፉ…', preview: 'ቅድመ እይታ፦',
    accepted: 'ተቀባይነት ያላቸው መልሶች', acceptedHint: 'በእያንዳንዱ መስመር አንድ። ማነጻጸሪያው የአቢይ ፊደልና ተጨማሪ ክፍተቶችን ችላ ይላል።', acceptedPlaceholder: 'ራይቦዞም\nራይቦዞሞች',
    options: 'የመልስ አማራጮች', tickOne: 'ትክክለኛውን ይምረጡ', tickMany: 'ትክክል የሆኑትን ሁሉ ይምረጡ', markCorrect: 'አማራጭ {n}ን እንደ ትክክል ምልክት አድርግ',
    optionPlaceholder: 'አማራጭ {letter}', optionText: 'የአማራጭ {n} ጽሑፍ', removeOption: 'አማራጭ {n}ን አስወግድ', addOption: 'አማራጭ ጨምር',
    explanation: 'ማብራሪያ', explanationHint: 'ተማሪው ከመለሰ በኋላ (ልምምድ) ወይም ካስገባ በኋላ (ፈተና) ይታያል።', create: 'ጥያቄ ፍጠር',
    trueText: 'እውነት', falseText: 'ሐሰት',
  },
};
