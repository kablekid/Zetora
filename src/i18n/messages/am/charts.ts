import type { charts as en } from '../en/charts';

export const charts: typeof en = {
  toggleChart: 'ሠንጠረዥ ገበታ', toggleTable: 'ሰንጠረዥ', noData: 'እስካሁን መረጃ የለም።',
  score: {
    title: 'የኩዊዝና የፈተና ውጤቶች', description: 'የቅርብ ጊዜ ውጤቶችዎ፣ ከቀደመው እስከ አዲሱ', empty: 'ውጤቶችዎን እዚህ ለማየት ኩዊዝ ይጨርሱ።',
    columns: { date: 'ቀን', activity: 'እንቅስቃሴ', score: 'ውጤት' }, exam: 'ፈተና', quiz: 'ኩዊዝ', tooltip: '{pct}% · {kind} · {label}',
  },
  activity: {
    title: 'የጥናት እንቅስቃሴ', description: 'ባለፉት 14 ቀናት የተከናወኑ የመማር ተግባራት', empty: 'የጥናት ታሪክዎን ለመገንባት አንድ ምዕራፍ ይክፈቱ።',
    columns: { day: 'ቀን', actions: 'ተግባራት' }, tooltip: { one: '{count} የመማር ተግባር', other: '{count} የመማር ተግባራት' },
  },
  subject: {
    title: 'በትምህርት የተመዘገበ ውጤት', description: 'በኩዊዞችና በፈተናዎችዎ ላይ ያለው አማካይ ውጤት',
    empty: 'በእያንዳንዱ ትምህርት ያለዎትን አቋም ለማወዳደር ኩዊዝ ይውሰዱ።',
    columns: { subject: 'ትምህርት', average: 'አማካይ', attempts: 'ሙከራዎች' }, tooltip: 'አማካይ {pct}% · {attempts}',
  },
  column: { day: 'ቀን' },
};
