import type { viewer as en } from '../en/viewer';

export const viewer: typeof en = {
  unavailable: 'ይህ ፋይል አልተገኘም።', opening: 'በመክፈት ላይ…', noPreview: 'ይህ የፋይል ዓይነት በመተግበሪያው ውስጥ ሊታይ አይችልም።',
  backToMaterials: 'ወደ ቁሳቁሶች ተመለስ',
  pdf: {
    loading: 'በመጫን ላይ…', page: 'ገጽ {current}', ofTotal: 'ከ{total}', zoomOut: 'አሳንስ', zoomIn: 'አጉላ', fit: 'ወደ ስፋቱ አስተካክል',
    pages: 'የፒዲኤፍ ገጾች', loadingDoc: 'ሰነዱን በመጫን ላይ…', loadingDocPct: 'ሰነዱን በመጫን ላይ… {pct}%', pageAria: 'ገጽ {n}',
    password: 'ይህ ፒዲኤፍ በይለፍ ቃል የተጠበቀ ነው።', openFailed: 'ይህን ፒዲኤፍ መክፈት አልተቻለም። ጊዜው አልፎበት ሊሆን ይችላል — እባክዎ ተመልሰው እንደገና ይሞክሩ።',
  },
};
