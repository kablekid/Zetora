export const pages = {
  overview: {
    description: 'A snapshot of your learning platform.', newUnit: 'New unit', newSubject: 'New subject',
    stats: {
      students: 'Students', subjects: 'Subjects', units: 'Units', summaries: 'Published summaries', materials: 'PDFs & materials',
      questions: 'Questions', quizAttempts: 'Quiz attempts', examAttempts: 'Exam attempts',
    },
    recentRegistrations: 'Recent registrations', allStudents: 'All students', noStudentsTitle: 'No students yet', noStudentsBody: 'New sign-ups will appear here.',
    recentActivity: 'Recent student activity', noActivityTitle: 'No activity yet', noActivityBody: 'Student activity shows up as soon as learners start studying.',
    activity: {
      unit_opened: '{name} opened {what}', summary_read: '{name} read the summary of {what}', unit_completed: '{name} completed {what}',
      resource_opened: '{name} opened material {what}', quiz_completed: '{name} finished quiz {what}', exam_completed: '{name} finished exam {what}',
      other: '{name} did {what}',
    },
  },
  analytics: {
    description: 'Real platform activity from the last 30 days.', active7: 'Active students (7 days)', active30: 'Active students (30 days)',
    registrations30: 'New registrations (30 days)', attempts30: 'Quiz & exam attempts (30 days)',
    registrations: 'New registrations', registrationsDesc: 'Students who signed up each day', registrationsUnit: 'Registrations',
    registrationsEmpty: 'No registrations in the last 30 days.', attempts: 'Quiz & exam attempts', attemptsDesc: 'Completed attempts each day',
    attemptsUnit: 'Attempts', attemptsEmpty: 'No completed attempts in the last 30 days.', popular: 'Most-studied units',
    popularEmpty: 'No study activity yet', learnersLine: '{learners} · {completed} completed', completionAria: '{title} completion rate',
    hardest: 'Hardest questions', hardestDesc: 'Lowest accuracy among questions answered at least 3 times — good candidates to review or explain better.',
    hardestEmptyTitle: 'Not enough answers yet', hardestEmptyBody: 'Questions appear here once students have answered them a few times.',
  },
  students: {
    matching: '{accounts} matching “{term}”.', plain: '{accounts}.', searchPlaceholder: 'Search by name, email or school', searchLabel: 'Search students',
    noMatch: 'No students match', noneYet: 'No students yet', tryDifferent: 'Try a different search.', afterRegister: 'Students appear here after they register.',
    adminBadge: 'Admin', suspended: 'Suspended', unitsDone: 'Units done', attempts: 'Attempts', avgScore: 'Avg score', joined: 'Joined {date}',
    active: 'Active {when}', noActivity: 'No activity yet',
  },
  summaries: {
    description: 'Write, save as a draft, and publish the reading summary for each unit.', emptyTitle: 'No units yet',
    emptyBody: 'Create a unit first, then write its summary.', goToUnits: 'Go to units', meta: '{words} · edited {date}', none: 'No summary yet',
    edit: 'Edit', write: 'Write', words: { one: '{count} word', other: '{count} words' },
  },
  units: {
    description: 'Create units under a subject, reorder them, and publish when ready.', belong: 'Units belong to a subject.',
    createFirstTitle: 'Create a subject first', createFirstBody: 'Units are organised under subjects.', goToSubjects: 'Go to subjects',
  },
  subjects: { description: 'Add, edit, reorder and publish the subjects students can study. Changes appear instantly — no code needed.' },
  materials: { description: 'Upload PDFs and reference files. They live in a private bucket — students only ever get short-lived links.' },
  questions: { description: 'Create questions once and reuse them across quizzes and exams.' },
  quizzes: {
    description: 'Build quizzes from the question bank. Attach them to a unit so students find them on the unit’s Practice quiz tab.',
    newQuiz: 'New quiz', emptyTitle: 'No quizzes yet', emptyBody: 'Create questions first, then assemble them into a quiz.',
    practice: 'Practice', examMode: 'Exam mode', unitTag: '{subject} · Unit {n}', pass: 'Pass {pct}%',
  },
  exams: { description: 'Unit, subject, mixed-unit and mock exams with a configurable length and a server-enforced countdown.' },
  settings: {
    description: 'Announcements, administrators and sample-content clean-up.', announcement: 'Send an announcement',
    announcementBody: 'Notify every student about something important.', admins: 'Administrators',
    adminsBody: 'To add another administrator, ask them to register, then promote them from the Students page.',
    demo: 'Demo content', demoSome: 'Sample subjects, units, summaries and questions are clearly marked “Demo”. When you are ready to use your own material, remove them in one click.',
    demoNone: 'There is no demo content in this project.', suspended: 'Suspended',
  },
};
