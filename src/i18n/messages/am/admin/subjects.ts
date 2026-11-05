import type { subjects as en } from '../../en/admin/subjects';

export const subjects: typeof en = {
  newSubject: 'አዲስ ትምህርት', emptyTitle: 'እስካሁን ትምህርት የለም', emptyBody: 'የመጀመሪያ ትምህርትዎን ይፍጠሩ፤ ከዚያ ምዕራፎችን ይጨምሩበት።',
  editAria: '{title}ን አርትዕ', deleteTitle: '“{title}”ን ይሰረዝ?',
  deleteBody: 'ይህ ትምህርቱን ከ{units}፣ ማጠቃለያዎች፣ ፋይሎች፣ ጥያቄዎችና ኩዊዞች ጋር እስከመጨረሻው ይሰርዛል። የተማሪዎች እድገትም ይወገዳል። ይህ ተመልሶ አይመለስም።',
  dialog: {
    editTitle: 'ትምህርት አርትዕ', newTitle: 'አዲስ ትምህርት', description: 'ተማሪዎች ርዕሱን፣ መግለጫውን፣ አዶውንና የሽፋን ምስሉን በትምህርት ቤተ መጻሕፍት ውስጥ ያያሉ።',
    title: 'ርዕስ', titlePlaceholder: 'ለምሳሌ፦ ሂሳብ', url: 'የድር አድራሻ ስም', urlHint: 'በአድራሻው ውስጥ ይታያል፦ /subjects/{slug}',
    shortDesc: 'አጭር መግለጫ', descPlaceholder: 'ተማሪዎች በትምህርት ካርዱ ላይ የሚያዩት አንድ ወይም ሁለት ዓረፍተ ነገር።', icon: 'አዶ', colour: 'ቀለም',
    cover: 'የሽፋን ምስል', coverFile: 'የሽፋን ምስል ፋይል', replace: 'ተካ', uploadImage: 'ምስል ጫን', published: 'የታተመ',
    publishedHint: 'በቤተ መጻሕፍት ውስጥ ለተማሪዎች ይታያል።', create: 'ትምህርት ፍጠር',
  },
};
