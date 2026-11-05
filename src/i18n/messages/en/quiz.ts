export const quiz = {
  runner: {
    noQuestions: 'This attempt has no questions.',
    header: 'Question {n} of {total} · {answered} answered', timer: 'Time remaining {time}', openNavigator: 'Open question navigator',
    answeredBar: 'Questions answered',
    saveError: 'We couldn’t save your last answer. Check your connection — everything will be sent again when you submit.',
    flag: 'Flag for review', flagged: 'Flagged', selectAll: 'Select all the answers that apply.', yourAnswer: 'Your answer',
    typeAnswer: 'Type your answer', options: 'Answer options', check: 'Check answer', checking: 'Checking…',
    correct: 'Correct!', notQuite: 'Not quite',
    accepted: { one: 'Accepted answer: <b>{answers}</b>', other: 'Accepted answers: <b>{answers}</b>' },
    previous: 'Previous', next: 'Next', submitQuiz: 'Submit quiz', submitExam: 'Submit exam',
    grading: 'Grading your answers…',
  },
  navigator: {
    title: 'Questions', summary: '{answered} of {total} answered', summaryFlagged: '{answered} of {total} answered · {flagged} flagged',
    answered: 'Question {n}, answered', notAnswered: 'Question {n}, not answered',
    answeredFlagged: 'Question {n}, answered, flagged', notAnsweredFlagged: 'Question {n}, not answered, flagged',
    reviewSubmit: 'Review & submit',
  },
  confirm: {
    titleQuiz: 'Submit your quiz?', titleExam: 'Submit your exam?',
    unanswered: {
      one: 'You have {count} unanswered question. Unanswered questions score zero.',
      other: 'You have {count} unanswered questions. Unanswered questions score zero.',
    },
    allAnswered: 'You’ve answered every question.', final: 'You won’t be able to change your answers after submitting.',
    keepWorking: 'Keep working', submitNow: 'Submit now',
  },
  toasts: {
    submitSafe: 'Your answers are safe — please try submitting again.', timeUp: 'Time is up — your answers were submitted.',
    fiveMin: '5 minutes remaining', oneMin: '1 minute remaining',
  },
  review: {
    heading: 'Review your answers', filter: 'Filter answers', all: 'All', incorrect: 'Incorrect', correct: 'Correct',
    nothing: 'Nothing to show in this view.', statusCorrect: 'Correct', statusSkipped: 'Not answered', statusIncorrect: 'Incorrect',
    questionLine: 'Question {n} · {type}', yourAnswer: 'Your answer', accepted: 'Accepted', correctAnswer: 'Correct answer',
    explanation: 'Explanation.',
  },
};
