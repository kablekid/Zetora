import type { pages as en } from '../../en/admin/pages';

export const pages: typeof en = {
  overview: {
    description: 'የትምህርት መድረክዎ አጭር ምስል።', newUnit: 'አዲስ ምዕራፍ', newSubject: 'አዲስ ትምህርት',
    stats: {
      students: 'ተማሪዎች', subjects: 'ትምህርቶች', units: 'ምዕራፎች', summaries: 'የታተሙ ማጠቃለያዎች', materials: 'ፒዲኤፍና ቁሳቁሶች',
      questions: 'ጥያቄዎች', quizAttempts: 'የኩዊዝ ሙከራዎች', examAttempts: 'የፈተና ሙከራዎች',
    },
    recentRegistrations: 'የቅርብ ጊዜ ምዝገባዎች', allStudents: 'ሁሉም ተማሪዎች', noStudentsTitle: 'እስካሁን ተማሪ የለም', noStudentsBody: 'አዳዲስ ተመዝጋቢዎች እዚህ ይታያሉ።',
    recentActivity: 'የተማሪዎች የቅርብ ጊዜ እንቅስቃሴ', noActivityTitle: 'እስካሁን እንቅስቃሴ የለም', noActivityBody: 'ተማሪዎች ማጥናት እንደጀመሩ እንቅስቃሴያቸው እዚህ ይታያል።',
    activity: {
      unit_opened: '{name} {what}ን ከፈተ/ች', summary_read: '{name} የ{what}ን ማጠቃለያ አነበበ/ች', unit_completed: '{name} {what}ን አጠናቀቀ/ች',
      resource_opened: '{name} ቁሳቁስ {what}ን ከፈተ/ች', quiz_completed: '{name} ኩዊዝ {what}ን ጨረሰ/ች', exam_completed: '{name} ፈተና {what}ን ጨረሰ/ች',
      other: '{name} {what}ን አደረገ/ች',
    },
  },
  analytics: {
    description: 'ባለፉት 30 ቀናት የመድረኩ እውነተኛ እንቅስቃሴ።', active7: 'ንቁ ተማሪዎች (7 ቀናት)', active30: 'ንቁ ተማሪዎች (30 ቀናት)',
    registrations30: 'አዲስ ምዝገባዎች (30 ቀናት)', attempts30: 'የኩዊዝና የፈተና ሙከራዎች (30 ቀናት)',
    registrations: 'አዲስ ምዝገባዎች', registrationsDesc: 'በየቀኑ የተመዘገቡ ተማሪዎች', registrationsUnit: 'ምዝገባዎች',
    registrationsEmpty: 'ባለፉት 30 ቀናት ምንም ምዝገባ የለም።', attempts: 'የኩዊዝና የፈተና ሙከራዎች', attemptsDesc: 'በየቀኑ የተጠናቀቁ ሙከራዎች',
    attemptsUnit: 'ሙከራዎች', attemptsEmpty: 'ባለፉት 30 ቀናት የተጠናቀቀ ሙከራ የለም።', popular: 'ብዙ የተጠኑ ምዕራፎች',
    popularEmpty: 'እስካሁን የጥናት እንቅስቃሴ የለም', learnersLine: '{learners} · {completed} ጨርሰዋል', completionAria: 'የ{title} የማጠናቀቅ መጠን',
    hardest: 'በጣም አስቸጋሪ ጥያቄዎች', hardestDesc: 'ቢያንስ 3 ጊዜ ከተመለሱ ጥያቄዎች መካከል ዝቅተኛ ትክክለኛነት ያላቸው — ለመከለስ ወይም በተሻለ ለማብራራት ተስማሚ።',
    hardestEmptyTitle: 'እስካሁን በቂ መልሶች የሉም', hardestEmptyBody: 'ተማሪዎች ጥያቄዎችን ጥቂት ጊዜ ከመለሱ በኋላ እዚህ ይታያሉ።',
  },
  students: {
    matching: '“{term}”ን የሚዛመዱ {accounts}።', plain: '{accounts}።', searchPlaceholder: 'በስም፣ በኢሜይል ወይም በትምህርት ቤት ይፈልጉ', searchLabel: 'ተማሪዎችን ፈልግ',
    noMatch: 'የሚዛመድ ተማሪ የለም', noneYet: 'እስካሁን ተማሪ የለም', tryDifferent: 'ሌላ ፍለጋ ይሞክሩ።', afterRegister: 'ተማሪዎች ከተመዘገቡ በኋላ እዚህ ይታያሉ።',
    adminBadge: 'አስተዳዳሪ', suspended: 'የታገደ', unitsDone: 'የጨረሷቸው ምዕራፎች', attempts: 'ሙከራዎች', avgScore: 'አማካይ ውጤት', joined: 'የተቀላቀሉት {date}',
    active: 'ንቁ የነበሩት {when}', noActivity: 'እስካሁን እንቅስቃሴ የለም',
  },
  summaries: {
    description: 'ለእያንዳንዱ ምዕራፍ የንባብ ማጠቃለያውን ይጻፉ፣ እንደ ረቂቅ ያስቀምጡ እና ያትሙ።', emptyTitle: 'እስካሁን ምዕራፍ የለም',
    emptyBody: 'መጀመሪያ ምዕራፍ ይፍጠሩ፤ ከዚያ ማጠቃለያውን ይጻፉ።', goToUnits: 'ወደ ምዕራፎች ሂድ', meta: '{words} · የተስተካከለው {date}', none: 'እስካሁን ማጠቃለያ የለም',
    edit: 'አርትዕ', write: 'ጻፍ', words: { one: '{count} ቃል', other: '{count} ቃላት' },
  },
  units: {
    description: 'በአንድ ትምህርት ስር ምዕራፎችን ይፍጠሩ፣ ቅደም ተከተላቸውን ያስተካክሉ እና ዝግጁ ሲሆኑ ያትሙ።', belong: 'ምዕራፎች የአንድ ትምህርት ናቸው።',
    createFirstTitle: 'መጀመሪያ ትምህርት ይፍጠሩ', createFirstBody: 'ምዕራፎች በትምህርቶች ስር ይደራጃሉ።', goToSubjects: 'ወደ ትምህርቶች ሂድ',
  },
  subjects: { description: 'ተማሪዎች የሚያጠኗቸውን ትምህርቶች ይጨምሩ፣ ያርትዑ፣ ቅደም ተከተላቸውን ያስተካክሉ እና ያትሙ። ለውጦች ወዲያውኑ ይታያሉ — ኮድ አያስፈልግም።' },
  materials: { description: 'ፒዲኤፍና የማጣቀሻ ፋይሎችን ይጫኑ። በግል ማከማቻ ውስጥ ይቀመጣሉ — ተማሪዎች የሚያገኙት አጭር ጊዜ የሚቆይ አገናኝ ብቻ ነው።' },
  questions: { description: 'ጥያቄዎችን አንድ ጊዜ ይፍጠሩ፤ በኩዊዞችና በፈተናዎች ውስጥ ደግመው ይጠቀሙባቸው።' },
  quizzes: {
    description: 'ከጥያቄ ባንኩ ኩዊዞችን ይገንቡ። ተማሪዎች በምዕራፉ “የልምምድ ኩዊዝ” ትር ላይ እንዲያገኟቸው ከምዕራፍ ጋር ያያይዟቸው።',
    newQuiz: 'አዲስ ኩዊዝ', emptyTitle: 'እስካሁን ኩዊዝ የለም', emptyBody: 'መጀመሪያ ጥያቄዎችን ይፍጠሩ፤ ከዚያ ወደ ኩዊዝ ያሰባስቧቸው።',
    practice: 'ልምምድ', examMode: 'የፈተና ሁነታ', unitTag: '{subject} · ምዕራፍ {n}', pass: 'ማለፊያ {pct}%',
  },
  exams: { description: 'የምዕራፍ፣ የትምህርት፣ የተቀላቀሉ ምዕራፎችና የሙከራ ፈተናዎች — ሊስተካከል የሚችል ርዝመትና በአገልጋይ የሚተገበር ሰዓት ቆጣሪ ያላቸው።' },
  settings: {
    description: 'ማስታወቂያዎች፣ አስተዳዳሪዎች እና የናሙና ይዘት ማጽዳት።', announcement: 'ማስታወቂያ ላክ',
    announcementBody: 'አስፈላጊ ነገር ለእያንዳንዱ ተማሪ ያሳውቁ።', admins: 'አስተዳዳሪዎች',
    adminsBody: 'ሌላ አስተዳዳሪ ለመጨመር እንዲመዘገብ ይጠይቁት፤ ከዚያ ከተማሪዎች ገጽ ያሳድጉት።',
    demo: 'የናሙና ይዘት', demoSome: 'የናሙና ትምህርቶች፣ ምዕራፎች፣ ማጠቃለያዎችና ጥያቄዎች በግልጽ “ናሙና” ተብለው ተመልክተዋል። የራስዎን ይዘት ለመጠቀም ሲዘጋጁ በአንድ ጠቅታ ያስወግዷቸው።',
    demoNone: 'በዚህ ፕሮጀክት ውስጥ የናሙና ይዘት የለም።', suspended: 'የታገደ',
  },
};
