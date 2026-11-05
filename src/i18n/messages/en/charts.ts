export const charts = {
  toggleChart: 'Chart', toggleTable: 'Table', noData: 'No data yet.',
  score: {
    title: 'Quiz & exam scores', description: 'Your most recent results, oldest to newest', empty: 'Complete a quiz to see your scores here.',
    columns: { date: 'Date', activity: 'Activity', score: 'Score' }, exam: 'Exam', quiz: 'Quiz', tooltip: '{pct}% · {kind} · {label}',
  },
  activity: {
    title: 'Study activity', description: 'Learning actions in the last 14 days', empty: 'Open a unit to start building your study history.',
    columns: { day: 'Day', actions: 'Actions' }, tooltip: { one: '{count} learning action', other: '{count} learning actions' },
  },
  subject: {
    title: 'Performance by subject', description: 'Average score across your quizzes and exams',
    empty: 'Take a quiz to compare how you’re doing in each subject.',
    columns: { subject: 'Subject', average: 'Average', attempts: 'Attempts' }, tooltip: '{pct}% average · {attempts}',
  },
  column: { day: 'Day' },
};
