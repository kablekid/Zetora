import type { notifications as en } from '../en/notifications';

export const notifications: typeof en = {
  title: 'ማሳወቂያዎች', description: 'አዳዲስ ትምህርቶች፣ ቁሳቁሶች፣ ኩዊዞችና ማስታወቂያዎች።',
  footnote: 'ማሳወቂያዎች Zetoraን ሲከፍቱ በውስጡ ይታያሉ። ወደ ስልክዎ የሚላኩ ማሳወቂያዎች ገና አልተጀመሩም።',
  emptyTitle: 'ሁሉንም ጨርሰዋል', emptyBody: 'አዳዲስ ትምህርቶች፣ ቁሳቁሶች፣ ኩዊዞችና ማስታወቂያዎች እዚህ ይታያሉ።',
  unread: '{count} ያልተነበቡ', allRead: 'ሁሉም ተነብበዋል', markAll: 'ሁሉንም እንደተነበበ ምልክት አድርግ', unreadAria: 'ያልተነበበ',
  templates: {
    subject: 'አዲስ ትምህርት፦ {name}', material: 'አዲስ የመማሪያ ቁሳቁስ፦ {name}', quiz: 'አዲስ ኩዊዝ ተዘጋጅቷል፦ {name}',
    exam: 'አዲስ ፈተና ተዘጋጅቷል፦ {name}',
  },
};
