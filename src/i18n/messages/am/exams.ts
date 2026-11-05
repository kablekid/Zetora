import type { exams as en } from '../en/exams';

export const exams: typeof en = {
  page: {
    title: 'ፈተናዎች',
    description: 'በዘፈቀደ የተመረጡ ጥያቄዎች ያሏቸው በጊዜ የተገደቡ ፈተናዎች። ሰዓቱ የሚሄደው በእኛ አገልጋዮች ላይ ስለሆነ ገጹን ማደስ አይመልሰውም።',
    emptyTitle: 'እስካሁን የሚገኝ ፈተና የለም', emptyBody: 'የምዕራፍ፣ የትምህርትና የሙከራ ፈተናዎች ሲታተሙ እዚህ ይታያሉ።',
    upTo: { one: 'እስከ {count} ጥያቄ', other: 'እስከ {count} ጥያቄዎች' }, passMark: 'የማለፊያ ውጤት {pct}%', best: 'ምርጥ {pct}%',
    resume: 'ፈተናውን ቀጥል', retake: 'ፈተናውን እንደገና ውሰድ', start: 'ፈተናውን ጀምር', history: 'የፈተና ታሪክ', historyEmpty: 'እስካሁን ምንም ፈተና አልጨረሱም።',
    cols: { exam: 'ፈተና', date: 'ቀን', score: 'ውጤት', time: 'ጊዜ', result: 'ውጤት ሁኔታ', review: 'ክለሳ' },
  },
  results: {
    message: {
      timedOut: 'ጊዜው አልቋል — እስካሁን የሰጧቸው መልሶች ታርመዋል።', outstanding: 'እጅግ ጥሩ ሥራ! ይህን ትምህርት በደንብ እንደሚያውቁት ግልጽ ነው።',
      great: 'በጣም ጥሩ — በዚህ ጉዳይ በደንብ ተዘጋጅተዋል።', passed: 'ጥሩ ጥረት — አልፈዋል። የተሳሳቱባቸውን ጥያቄዎች ደግመው በማየት ያጠናክሩ።',
      getting: 'እየተሻሻሉ ነው። ከታች ያሉትን ማብራሪያዎች አንብበው እንደገና ይሞክሩ።',
      tough: 'ይህ ከባድ ነው — የምዕራፉን ማጠቃለያ መለስ ብለው ካነበቡ በኋላ እንደገና ይሞክሩ።',
    },
    passed: 'አልፈዋል', notPassedYet: 'ገና አላለፉም', kindExam: 'ፈተና', kindPractice: 'የልምምድ ኩዊዝ', kindTimed: 'በጊዜ የተገደበ ኩዊዝ',
    timedOut: 'ጊዜው አልቋል', passMarkLine: 'የማለፊያ ውጤት {pct}% · {when}', ring: 'ውጤት',
    stats: { score: 'ውጤት', correct: 'ትክክል', incorrect: 'ትክክል ያልሆነ', time: 'የወሰደው ጊዜ' },
    tryAgain: 'እንደገና ሞክር', retake: 'ፈተናውን እንደገና ውሰድ', progress: 'እድገቴን ይመልከቱ',
    backSubjects: 'ወደ ትምህርቶች ተመለስ', backUnit: 'ወደ ምዕራፉ ተመለስ', backTo: 'ወደ {title} ተመለስ', backExams: 'ወደ ፈተናዎች ተመለስ',
  },
  error: { title: 'ማስጀመር አልቻልንም', fallback: 'ሙከራዎን በማስጀመር ላይ ሳለ የሆነ ችግር ተፈጥሯል።', back: 'ወደ ትምህርቶች ተመለስ' },
};
