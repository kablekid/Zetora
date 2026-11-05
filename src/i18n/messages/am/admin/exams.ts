import type { exams as en } from '../../en/admin/exams';

export const exams: typeof en = {
  newExam: 'አዲስ ፈተና', emptyTitle: 'እስካሁን ፈተና የለም',
  emptyBody: 'ፈተናዎች ከጥያቄ ባንኩ በዘፈቀደ ጥያቄዎችን ይመርጣሉ፤ ሰዓት ቆጣሪውም በአገልጋዩ ላይ ይሄዳል።', editAria: '{title}ን አርትዕ',
  pass: 'ማለፊያ {pct}%', pool: 'በጥያቄ ማጠራቀሚያ ውስጥ {count}', poolFewer: 'በጥያቄ ማጠራቀሚያ ውስጥ {count} (ከተጠየቀው ያነሰ)',
  deleteBody: 'የተማሪዎች ያለፉ የፈተና ውጤቶች ይቀመጣሉ፤ ፈተናው ግን ይወገዳል፤ እንደገናም መወሰድ አይችልም።',
  kindHelp: {
    unit: 'ከአንድ ምዕራፍ በዘፈቀደ የተመረጡ ጥያቄዎች።', subject: 'ከአንድ ትምህርት ሁሉም ምዕራፎች በዘፈቀደ የተመረጡ ጥያቄዎች።',
    mixed: 'በትምህርቶች መካከል ከመረጧቸው ምዕራፎች በዘፈቀደ የተመረጡ ጥያቄዎች።', mock: 'ከአንድ ሙሉ ትምህርት የተወሰደ ሙሉ ርዝመት ያለው የሙከራ ፈተና።',
  },
  dialog: {
    editTitle: 'ፈተና አርትዕ', newTitle: 'አዲስ ፈተና', description: 'እያንዳንዱ ተማሪ የተለየ በዘፈቀደ የተመረጠና የተደረደረ ጥያቄ ያገኛል። ሰዓት ቆጣሪው በአገልጋዩ ላይ ይቆያል።',
    title: 'ርዕስ', titlePlaceholder: 'ለምሳሌ፦ ፊዚክስ — የሙከራ ፈተና', desc: 'መግለጫ', type: 'የፈተና ዓይነት', subject: 'ትምህርት', unitOne: 'ምዕራፍ',
    unitMany: 'ጥያቄ የሚወሰድባቸው ምዕራፎች', noUnits: 'የሚገኝ ምዕራፍ የለም።', questions: 'ጥያቄዎች', minutes: 'ደቂቃዎች', passPct: 'ማለፊያ %',
    published: 'የታተመ', publishedHint: 'በፈተናዎች ገጽ ላይ ይታያል።', create: 'ፈተና ፍጠር',
  },
};
