import type { materials as en } from '../../en/admin/materials';

export const materials: typeof en = {
  filterLabel: 'በትምህርት አጣራ', allSubjects: 'ሁሉም ትምህርቶች', upload: 'ቁሳቁስ ጫን', wholeSubject: 'መላው ትምህርት',
  emptyTitle: 'እስካሁን የመማሪያ ቁሳቁስ የለም', emptyNoSubject: 'መጀመሪያ ትምህርት ይፍጠሩ፤ ከዚያ ፒዲኤፍ ይጫኑበት።',
  emptyBody: 'ፒዲኤፍ፣ ማስታወሻዎች ወይም የማጣቀሻ ምስሎችን ይጫኑ። ፋይሎች በግል ይቀመጣሉ፤ የገቡ ተማሪዎች ብቻ ሊከፍቷቸው ይችላሉ።',
  viewOnly: 'ለማየት ብቻ', meta: '{size} · የተጫነው {date} · {file}', previewAria: '{title}ን ቅድመ እይታ', editAria: '{title}ን አርትዕ',
  deleteBody: 'ፋይሉ ከማከማቻ እስከመጨረሻው ይወገዳል፤ ተማሪዎችም ከዚህ በኋላ ሊከፍቱት አይችሉም።',
  errors: {
    type: 'ፒዲኤፍ፣ PNG፣ JPG፣ WebP ወይም ተራ ጽሑፍ ፋይሎች ብቻ መጫን ይቻላል።', tooBig: 'ፋይሉ {size} ነው። ገደቡ {max} ነው።',
    empty: 'ፋይሉ ባዶ ነው።', notPdf: 'ይህ ትክክለኛ ፒዲኤፍ ፋይል አይመስልም።', chooseFile: 'የሚጫን ፋይል ይምረጡ።',
    enterTitle: 'ርዕስ ያስገቡ።', chooseSubject: 'ትምህርት ይምረጡ።', uploadFailed: 'መጫን አልተሳካም፦ {reason}',
  },
  dialog: {
    editTitle: 'ቁሳቁስ አርትዕ', uploadTitle: 'ቁሳቁስ ጫን',
    description: 'ፒዲኤፍ፣ PNG፣ JPG፣ WebP ወይም ጽሑፍ፣ እስከ {max}። በግል ይቀመጣል — ተማሪዎች በመተግበሪያው ውስጥ ባለው መመልከቻ ይከፍቱታል።',
    replaceFile: 'ፋይል ተካ', file: 'ፋይል', current: 'አሁን ያለው፦ {name} ({size})', title: 'ርዕስ', titlePlaceholder: 'ለምሳሌ፦ ፈንክሽኖች — የተሠሩ ምሳሌዎች',
    desc: 'መግለጫ', subject: 'ትምህርት', unit: 'ምዕራፍ', type: 'ዓይነት',
    kinds: { pdf: 'የፒዲኤፍ ሰነድ', note: 'ማስታወሻዎች', reference: 'የማጣቀሻ ሰነድ', image: 'ምስል' },
    allowDownload: 'ማውረድ ፍቀድ', allowHint: 'ጠፍቶ ከሆነ ተማሪዎች በመተግበሪያው ማንበብ ይችላሉ፤ ማስቀመጥ ግን አይችሉም።', published: 'የታተመ',
    publishedHint: 'ትምህርቱና ምዕራፉ ከታተሙ በኋላ ለተማሪዎች ይታያል።', uploading: 'በመጫን ላይ…', uploadBtn: 'ጫን',
  },
};
