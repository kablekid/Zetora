interface Section { title: string; paragraphs?: string[]; list?: string[]; after?: string[] }

export const legal = {
  updated: 'Last updated: {date}',
  privacy: {
    title: 'Privacy policy', date: '1 January 2026',
    intro: 'We collect only what we need to run your learning account. We do not sell your data.',
    sections: [
      { title: 'What we collect', list: [
        '<b>Account details:</b> your name, email address and password (stored securely by our authentication provider — we never see your password).',
        '<b>Optional profile details:</b> school or institution, location and profile picture, if you choose to add them.',
        '<b>Learning activity:</b> units you open and complete, bookmarks, quiz and exam answers, scores and timings.',
      ] },
      { title: 'How we use it', list: [
        'To provide your dashboard, progress tracking and results.',
        'To send essential account emails such as email confirmation and password reset.',
        'To understand which content helps students, using aggregated activity.',
      ], after: ['Administrators can see student accounts and activity in order to manage the platform and support students.'] },
      { title: 'Cookies and storage', paragraphs: ['We use cookies that are strictly necessary to keep you signed in and to remember your language and light or dark theme. We do not use advertising or cross-site tracking cookies.'] },
      { title: 'Where data is stored', paragraphs: ['Data is stored with our infrastructure provider (Supabase). Learning documents are kept in private storage and are only available to signed-in students through short-lived links.'] },
      { title: 'Your choices', paragraphs: ['You can edit your profile at any time in Settings. To ask for your account and data to be deleted or exported, contact us {how}.'] },
      { title: 'Children', paragraphs: ['Zetora is designed for secondary-school students. If you are under 18, please use the platform with the knowledge of a parent or guardian.'] },
    ] as Section[],
    howEmail: 'at <mail>{email}</mail>', howPage: 'using the details on the Contact page',
  },
  terms: {
    title: 'Terms of service', date: '1 January 2026',
    intro: 'By creating an account or using Zetora you agree to these terms.',
    sections: [
      { title: 'Using Zetora', list: [
        'Zetora is for your personal study. Keep your login details private and don’t share your account.',
        'Provide accurate information when you register.',
        'Don’t attempt to access other students’ data, interfere with the service, or bypass security or exam timers.',
        'Don’t copy, resell or redistribute Zetora materials without permission.',
      ] },
      { title: 'Content', paragraphs: ['Summaries, questions and documents are provided to help you study. We work to keep them accurate, but they may contain mistakes and are not a substitute for your teachers or official textbooks. Sample or demonstration content is clearly labelled and is not an official syllabus.'] },
      { title: 'Results and progress', paragraphs: ['Scores and analytics reflect your activity on Zetora only. They are a study aid and do not predict or guarantee any official examination result.'] },
      { title: 'Availability', paragraphs: ['We aim to keep Zetora available but cannot promise uninterrupted service. We may update, change or remove features and content.'] },
      { title: 'Suspension', paragraphs: ['We may suspend accounts that break these terms or put the platform or other students at risk.'] },
      { title: 'Changes', paragraphs: ['We may update these terms. If we make important changes we will let you know in the app.'] },
    ] as Section[],
  },
};
