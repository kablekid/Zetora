export const auth = {
  layout: {
    headline: 'Your journey to academic excellence starts here.',
    points: [
      { title: 'Study unit by unit', text: 'Clear summaries and materials, organised by subject.' },
      { title: 'Practice and test yourself', text: 'Quizzes with instant feedback and timed mock exams.' },
      { title: 'See your progress', text: 'Know exactly which topics to revise next.' },
    ],
    notConfigured: 'Supabase isn’t configured yet. Add your keys to <code>.env.local</code> — see the README.',
    backToHome: '← Back to Zetora',
  },
  login: {
    title: 'Welcome back', subtitle: 'Sign in to continue learning.',
    email: 'Email', emailPlaceholder: 'you@example.com', password: 'Password', passwordPlaceholder: 'Your password',
    forgot: 'Forgot password?', submit: 'Sign in', welcome: 'Welcome back!',
    newHere: 'New to Zetora?', createAccount: 'Create an account',
    errors: {
      link: 'That link has expired or was already used. Please try again.',
      suspended: 'This account has been suspended. Please contact support.',
    },
  },
  register: {
    title: 'Create your account', subtitle: 'Free for Grade 12 remedial students. It takes less than a minute.',
    fullName: 'Full name', fullNamePlaceholder: 'e.g. Hana Bekele', email: 'Email', password: 'Password',
    passwordHint: 'At least 8 characters, with a letter and a number.', confirmPassword: 'Confirm password',
    submit: 'Create account', welcome: 'Account created — welcome to Zetora!',
    agree: 'By creating an account you agree to our <terms>Terms</terms> and <privacy>Privacy Policy</privacy>.',
    verifyTitle: 'Check your email',
    verifyBody: 'We sent a confirmation link to <b>{email}</b>. Open it to activate your account, then sign in.',
    goToSignIn: 'Go to sign in', haveAccount: 'Already have an account?', signIn: 'Sign in',
  },
  forgot: {
    title: 'Reset your password', subtitle: 'Enter your email and we’ll send you a link to choose a new password.',
    email: 'Email', submit: 'Send reset link', sentTitle: 'Check your email',
    sentBody: 'If an account exists for that address, a password reset link is on its way. It may take a minute to arrive.',
    backToSignIn: 'Back to sign in', remembered: 'Remembered it?',
  },
  reset: {
    title: 'Choose a new password', subtitle: 'Pick something you haven’t used before.',
    password: 'New password', confirm: 'Confirm new password', hint: 'At least 8 characters, with a letter and a number.',
    submit: 'Update password', toast: 'Password updated.', skip: 'Skip for now',
  },
};
