import type { editor as en } from '../../en/admin/editor';

export const editor: typeof en = {
  placeholder: 'የምዕራፉን ማጠቃለያ መጻፍ ይጀምሩ… ለርዕሶች፣ ዝርዝሮች፣ ሰንጠረዦች፣ ቀመሮችና ጎልተው ለሚታዩ ሳጥኖች የመሣሪያ አሞሌውን ይጠቀሙ።',
  contentAria: 'የማጠቃለያ ይዘት', backAria: 'ወደ ማጠቃለያዎች ተመለስ',
  status: { none: 'አልተጀመረም', published: 'የታተመ', draft: 'ረቂቅ' }, unsaved: 'ያልተቀመጡ ለውጦች',
  unpublish: 'ህትመቱን ሰርዝ', unpublished: 'ህትመቱ ተሰርዟል', viewAsStudent: 'እንደ ተማሪ ይመልከቱ', saveDraft: 'ረቂቅ አስቀምጥ', publish: 'አትም', updatePublished: 'የታተመውን አዘምን',
  toolbar: 'ቅርጸት', undo: 'ቀልብስ', redo: 'ድገም', heading: 'ርዕስ', subheading: 'ንዑስ ርዕስ', bold: 'ደማቅ', italic: 'ሰያፍ', underline: 'ከስር መስመር',
  strike: 'የተሻረ', highlight: 'አስፈላጊ ጽሑፍን አጉልተህ አሳይ', bullets: 'ነጥብ ያለው ዝርዝር', numbers: 'ቁጥር ያለው ዝርዝር', quote: 'ጥቅስ',
  insertTable: 'ሰንጠረዥ አስገባ', insertImage: 'ምስል አስገባ', insertFormula: 'ቀመር አስገባ', removeLink: 'አገናኙን አስወግድ', addLink: 'አገናኝ ጨምር',
  boxesToolbar: 'ጎልተው የሚታዩ ሳጥኖች', boxes: 'ሳጥኖች፦', removeBox: 'ሳጥኑን አስወግድ',
  callouts: { definition: 'ትርጓሜ', note: 'ማስታወሻ', key: 'ዋና ጽንሰ ሐሳብ', example: 'ምሳሌ', warning: 'ተጠንቀቅ' },
  table: { addRow: 'ከታች ረድፍ ጨምር', addCol: 'ዓምድ ጨምር', delRow: 'ረድፍ ሰርዝ', delCol: 'ዓምድ ሰርዝ', delTable: 'ሰንጠረዡን ሰርዝ' },
  tip: 'ጠቃሚ ምክር፦ ተማሪዎች ይህንኑ አቀማመጥ በትክክል ያያሉ። ማንኛውንም ቀመር ለማርትዕ ይንኩት። በሚሠሩበት ጊዜ “ረቂቅ አስቀምጥ”ን፣ ዝግጁ ሲሆን “አትም”ን ይጠቀሙ።',
  link: { title: 'አገናኝ ጨምር', description: 'መጀመሪያ ጽሑፉን ይምረጡ፤ ከዚያ የድር አድራሻውን ይለጥፉ።', address: 'የድር አድራሻ', add: 'አገናኝ ጨምር' },
  image: {
    title: 'ምስል አስገባ', description: 'በዝግተኛ ግንኙነት ገጾች በፍጥነት እንዲከፈቱ ምስሎች በራስ-ሰር ይቀነሳሉ።', file: 'የምስል ፋይል',
    alt: 'ለስክሪን አንባቢዎች መግለጫ', altPlaceholder: 'ለምሳሌ፦ የ y = x² ግራፍ', insert: 'አስገባ',
  },
  math: {
    editTitle: 'ቀመር አርትዕ', insertTitle: 'ቀመር አስገባ',
    description: 'LaTeX ይጻፉ፣ ለምሳሌ <code>\\frac{a}{b}</code>። ቀጥታ ቅድመ እይታ ከታች ይታያል።', aria: 'የLaTeX ቀመር', styleAria: 'የቀመር ዘይቤ',
    inline: 'በአረፍተ ነገር ውስጥ', display: 'በራሱ መስመር', preview: 'ቅድመ እይታ እዚህ ይታያል', update: 'ቀመሩን አዘምን', editHint: 'ቀመሩን ለማርትዕ ይንኩ',
    snippets: { fraction: 'ክፍልፋይ', sqrt: 'ካሬ ሥር', power: ' ኃይል', subscript: 'ንዑስ ጽሑፍ', sum: 'ድምር', limit: 'ወሰን', integral: 'ኢንቴግራል', arrow: 'ቀስት' },
  },
};
