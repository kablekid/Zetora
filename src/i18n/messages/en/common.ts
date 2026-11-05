export const common = {
  tagline: 'Learn. Practice. Achieve.',
  actions: {
    save: 'Save', saveChanges: 'Save changes', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Create', close: 'Close',
    back: 'Back', next: 'Next', previous: 'Previous', continue: 'Continue', view: 'View', download: 'Download', upload: 'Upload',
    search: 'Search', confirm: 'Confirm', remove: 'Remove', tryAgain: 'Try again', submit: 'Submit', publish: 'Publish',
    unpublish: 'Unpublish', add: 'Add', clear: 'Clear', loading: 'Loading…', seeAll: 'See all', viewAll: 'View all',
  },
  status: {
    completed: 'Completed', inProgress: 'In progress', notStarted: 'Not started', published: 'Published', draft: 'Draft',
    suspended: 'Suspended', demo: 'Demo', available: 'Available', comingSoon: 'Coming soon', passed: 'Passed', notPassed: 'Not passed',
    timedOut: 'Timed out', optional: 'Optional',
  },
  time: {
    justNow: 'just now', seconds: '{s}s', minutes: '{m} min', minSec: '{m}m {s}s',
  },
  greeting: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
  count: {
    unit: { one: '{count} unit', other: '{count} units' },
    summary: { one: '{count} summary', other: '{count} summaries' },
    file: { one: '{count} file', other: '{count} files' },
    question: { one: '{count} question', other: '{count} questions' },
    attempt: { one: '{count} attempt', other: '{count} attempts' },
    day: { one: '{count} day', other: '{count} days' },
    topic: { one: '{count} topic', other: '{count} topics' },
    account: { one: '{count} account', other: '{count} accounts' },
    section: { one: '{count} section', other: '{count} sections' },
    answer: { one: '{count} answer', other: '{count} answers' },
    learner: { one: '{count} learner', other: '{count} learners' },
  },
  difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  questionType: {
    multiple_choice: 'Multiple choice', true_false: 'True / False', multiple_select: 'Multiple select', short_answer: 'Short answer',
  },
  examKind: { unit: 'Unit exam', subject: 'Subject exam', mixed: 'Mixed-unit exam', mock: 'Mock exam' },
  resourceKind: { pdf: 'PDF', note: 'Notes', image: 'Image', reference: 'Reference' },
  role: { student: 'Student', admin: 'Administrator' },
  theme: {
    label: 'Theme', light: 'Light', dark: 'Dark', system: 'System', switchToLight: 'Switch to light mode', switchToDark: 'Switch to dark mode',
  },
  language: { label: 'Language' },
  a11y: { skipToContent: 'Skip to content', loading: 'Loading', close: 'Close', showPassword: 'Show password', hidePassword: 'Hide password', breadcrumb: 'Breadcrumb', previousPage: 'Previous page', nextPage: 'Next page' },
  pages: {
    notFound: {
      title: 'Page not found', heading: 'We couldn’t find that page',
      body: 'The link may be broken, or the lesson may have been moved or unpublished. Let’s get you back on track.',
      dashboard: 'Go to dashboard', home: 'Back to home',
    },
    error: {
      heading: 'Something went wrong',
      body: 'We couldn’t load this page. This is usually a temporary connection problem — please try again.',
      reference: 'Reference: {digest}',
    },
  },
};
