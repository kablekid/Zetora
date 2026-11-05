export const dashboard = {
  welcome: {
    there: 'there', line: '{greeting}, {name}.', newUser: 'Welcome to Zetora — pick a subject and open your first unit.',
    returning: 'Ready to learn something new?', streak: '{count}-day streak', startStreak: 'Start a streak today',
    inProgress: '{units} in progress',
  },
  overall: {
    title: 'Overall progress', ring: 'Overall learning completion', unitsCompleted: 'Units completed',
    quizzesCompleted: 'Quizzes completed', avgQuiz: 'Average quiz score',
  },
  continue: {
    eyebrow: 'Continue learning', cta: 'Continue', meta: '{min} · last opened {when}', upNext: 'Up next', startFirst: 'Start your first unit',
    startUnit: 'Start unit', getStarted: 'Get started', chooseSubject: 'Choose a subject to begin', browse: 'Browse subjects',
    lastUnitHint: 'Your last unit will appear here', unitProgress: 'Unit progress', unitLine: 'Unit {n}: {title}',
  },
  subjects: {
    title: 'My subjects', viewAll: 'View all', emptyTitle: 'No subjects yet', emptyBody: 'Subjects will appear here as soon as they are published.',
    completionAria: '{title} completion', line: '{units} · {done} completed',
  },
  today: {
    title: 'Today’s study activity', doneOf: '{done}/{total} done', aria: 'Today’s goals completed', openUnit: 'Open a unit',
    readSummary: 'Read a summary', completeQuiz: 'Complete a quiz', allDone: 'All done for today — great work!',
  },
  recommended: {
    title: 'Recommended next steps', emptyTitle: 'You’re all caught up', emptyBody: 'New recommendations appear as you study and take quizzes.',
    reason: { resume: 'Pick up where you left off', next: 'Start next', review: 'Needs review' },
  },
  activity: {
    title: 'Recent activity', emptyTitle: 'Nothing here yet', emptyBody: 'Your recently opened units, summaries and quiz results will show up here.',
    opened: 'Opened {unit}', readSummary: 'Read the summary of {unit}', completed: 'Completed {unit}', material: 'Opened “{title}”',
    quiz: 'Finished “{title}” — {pct}%', exam: 'Finished exam “{title}” — {pct}%', aUnit: 'a unit', aMaterial: 'a material', generic: 'Activity',
  },
  quick: { browse: 'Browse subjects', continue: 'Continue learning', practice: 'Take a practice quiz', progress: 'View my progress' },
  overview: 'Performance overview',
};
