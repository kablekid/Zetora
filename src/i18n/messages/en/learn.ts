export const learn = {
  tabs: {
    nav: 'Unit sections', overview: 'Overview', summary: 'Summary', materials: 'Learning materials', quiz: 'Practice quiz',
    test: 'Unit test', notYet: 'Not available yet',
  },
  header: {
    unit: 'Unit {n}', inProgress: 'In progress · {pct}%', bookmark: 'Bookmark', bookmarked: 'Bookmarked',
    markCompleted: 'Mark as completed', markNotCompleted: 'Mark as not completed', removeBookmark: 'Remove bookmark',
    updated: 'Updated', saved: 'Saved',
    bookmarkRemoved: 'Bookmark removed',
  },
  overview: {
    noIntro: 'No introduction has been added for this unit yet.',
    introduction: 'Introduction', objectives: 'Learning objectives', objectivesLead: 'By the end of this unit you should be able to:',
    topics: 'Key topics', concepts: 'Important concepts', status: 'Status', studyTime: 'Estimated study time', summary: 'Summary',
    materials: 'Materials', quizzes: 'Quizzes', available: 'Available', comingSoon: 'Coming soon', noneYet: 'None yet',
    readSummary: 'Read the summary', practiceNow: 'Practice now', overviewOnly: 'Overview only',
  },
  summary: {
    onThisPage: 'On this page', minRead: 'About {count} min read', finishedTitle: 'Finished reading?',
    finishedBody: 'Mark this unit as completed to update your progress, then test yourself with the practice quiz.',
    comingTitle: 'Summary coming soon',
    comingBody: 'The summary for this unit hasn’t been published yet. You can start with the overview, materials or the practice quiz.',
    backToOverview: 'Back to overview', readingProgress: 'Reading progress',
  },
  pager: { nav: 'Unit navigation', previous: 'Previous unit', next: 'Next unit', line: 'Unit {n}: {title}' },
  materials: {
    emptyTitle: 'No learning materials yet',
    emptyBody: 'PDF notes and reference documents for this unit will appear here once they are published.',
    downloadUnavailable: 'Download is not available.',
    meta: '{kind} · {size} · Added {date}', view: 'View', download: 'Download',
  },
  quiz: {
    emptyTitle: 'No practice quiz yet', emptyBody: 'A quiz for this unit will be published soon. In the meantime, read the summary.',
    practice: 'Practice · instant feedback', timed: 'Timed · answers after submit', passMark: 'Pass mark {pct}%', best: 'Best {pct}%',
    start: 'Start quiz', resume: 'Resume quiz', tryAgain: 'Try again', reviewLast: 'Review last attempt ({pct}%)',
  },
  test: {
    emptyTitle: 'No unit test yet',
    emptyBody: 'A timed test for this unit hasn’t been published. You can still check your understanding with the practice quiz.',
    upTo: { one: 'Up to {count} question', other: 'Up to {count} questions' }, start: 'Start test',
  },
};
