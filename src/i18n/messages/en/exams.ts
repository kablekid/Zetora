export const exams = {
  page: {
    title: 'Examinations',
    description: 'Timed exams with randomised questions. The clock runs on our servers, so refreshing the page won’t reset it.',
    emptyTitle: 'No exams available yet', emptyBody: 'Unit, subject and mock exams will appear here when they are published.',
    upTo: { one: 'Up to {count} question', other: 'Up to {count} questions' }, passMark: 'Pass mark {pct}%', best: 'Best {pct}%',
    resume: 'Resume exam', retake: 'Retake exam', start: 'Start exam', history: 'Exam history', historyEmpty: 'You haven’t completed an exam yet.',
    cols: { exam: 'Exam', date: 'Date', score: 'Score', time: 'Time', result: 'Result', review: 'Review' },
  },
  results: {
    message: {
      timedOut: 'Time ran out — your answers so far were graded.', outstanding: 'Outstanding work! You clearly know this material.',
      great: 'Great job — you’re well prepared on this one.', passed: 'Good effort — you passed. Review the questions you missed to lock it in.',
      getting: 'You’re getting there. Read the explanations below, then try again.',
      tough: 'This one is tough — revisit the unit summary, then give it another go.',
    },
    passed: 'Passed', notPassedYet: 'Not passed yet', kindExam: 'Exam', kindPractice: 'Practice quiz', kindTimed: 'Timed quiz',
    timedOut: 'Timed out', passMarkLine: 'Pass mark {pct}% · {when}', ring: 'Score',
    stats: { score: 'Score', correct: 'Correct', incorrect: 'Incorrect', time: 'Time taken' },
    tryAgain: 'Try again', retake: 'Retake exam', progress: 'View my progress',
    backSubjects: 'Back to subjects', backUnit: 'Back to unit', backTo: 'Back to {title}', backExams: 'Back to exams',
  },
  error: { title: 'We couldn’t start that', fallback: 'Something went wrong while starting your attempt.', back: 'Back to subjects' },
};
