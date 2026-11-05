import type { quiz as en } from '../en/quiz';

export const quiz: typeof en = {
  runner: {
    noQuestions: 'ይህ ሙከራ ምንም ጥያቄ የለውም።',
    header: 'ጥያቄ {n} ከ{total} · {answered} ተመልሷል', timer: 'የቀረው ጊዜ {time}', openNavigator: 'የጥያቄ አመልካቹን ክፈት',
    answeredBar: 'የተመለሱ ጥያቄዎች',
    saveError: 'የመጨረሻ መልስዎን ማስቀመጥ አልተቻለም። ግንኙነትዎን ይፈትሹ — ሲያስገቡ ሁሉም እንደገና ይላካል።',
    flag: 'ለክለሳ ምልክት አድርግ', flagged: 'ምልክት ተደርጓል', selectAll: 'የሚሆኑትን መልሶች ሁሉ ይምረጡ።', yourAnswer: 'መልስዎ',
    typeAnswer: 'መልስዎን ይጻፉ', options: 'የመልስ አማራጮች', check: 'መልሱን አረጋግጥ', checking: 'በማረጋገጥ ላይ…',
    correct: 'ትክክል!', notQuite: 'በትክክል አይደለም',
    accepted: { one: 'ተቀባይነት ያለው መልስ፦ <b>{answers}</b>', other: 'ተቀባይነት ያላቸው መልሶች፦ <b>{answers}</b>' },
    previous: 'ቀዳሚ', next: 'ቀጣይ', submitQuiz: 'ኩዊዙን አስገባ', submitExam: 'ፈተናውን አስገባ',
    grading: 'መልሶችዎን በማረም ላይ…',
  },
  navigator: {
    title: 'ጥያቄዎች', summary: 'ከ{total} ውስጥ {answered} ተመልሷል', summaryFlagged: 'ከ{total} ውስጥ {answered} ተመልሷል · {flagged} ምልክት ተደርጎባቸዋል',
    answered: 'ጥያቄ {n}፣ ተመልሷል', notAnswered: 'ጥያቄ {n}፣ አልተመለሰም',
    answeredFlagged: 'ጥያቄ {n}፣ ተመልሷል፣ ምልክት ተደርጓል', notAnsweredFlagged: 'ጥያቄ {n}፣ አልተመለሰም፣ ምልክት ተደርጓል',
    reviewSubmit: 'ገምግመው ያስገቡ',
  },
  confirm: {
    titleQuiz: 'ኩዊዝዎን ያስገቡ?', titleExam: 'ፈተናዎን ያስገቡ?',
    unanswered: {
      one: '{count} ያልተመለሰ ጥያቄ አለዎት። ያልተመለሱ ጥያቄዎች ዜሮ ያገኛሉ።',
      other: '{count} ያልተመለሱ ጥያቄዎች አለዎት። ያልተመለሱ ጥያቄዎች ዜሮ ያገኛሉ።',
    },
    allAnswered: 'ሁሉንም ጥያቄዎች መልሰዋል።', final: 'ካስገቡ በኋላ መልሶችዎን መቀየር አይችሉም።',
    keepWorking: 'መሥራቴን ልቀጥል', submitNow: 'አሁን አስገባ',
  },
  toasts: {
    submitSafe: 'መልሶችዎ ደህንነታቸው የተጠበቀ ነው — እባክዎ እንደገና ለማስገባት ይሞክሩ።', timeUp: 'ጊዜው አብቅቷል — መልሶችዎ ገብተዋል።',
    fiveMin: '5 ደቂቃ ቀርቷል', oneMin: '1 ደቂቃ ቀርቷል',
  },
  review: {
    heading: 'መልሶችዎን ይገምግሙ', filter: 'መልሶችን አጣራ', all: 'ሁሉም', incorrect: 'ትክክል ያልሆኑ', correct: 'ትክክል',
    nothing: 'በዚህ እይታ የሚታይ ነገር የለም።', statusCorrect: 'ትክክል', statusSkipped: 'አልተመለሰም', statusIncorrect: 'ትክክል አይደለም',
    questionLine: 'ጥያቄ {n} · {type}', yourAnswer: 'መልስዎ', accepted: 'ተቀባይነት ያለው', correctAnswer: 'ትክክለኛው መልስ',
    explanation: 'ማብራሪያ።',
  },
};
