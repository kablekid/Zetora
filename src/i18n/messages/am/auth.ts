import type { auth as en } from '../en/auth';

export const auth: typeof en = {
  layout: {
    headline: 'የትምህርት ልቀት ጉዞዎ እዚህ ይጀምራል።',
    points: [
      { title: 'ምዕራፍ በምዕራፍ ይማሩ', text: 'በትምህርት የተደራጁ ግልጽ ማጠቃለያዎችና ቁሳቁሶች።' },
      { title: 'ይለማመዱ፣ ራስዎንም ይፈትሹ', text: 'ፈጣን ግብረ መልስ ያላቸው ኩዊዞችና በጊዜ የተገደቡ የሙከራ ፈተናዎች።' },
      { title: 'እድገትዎን ይመልከቱ', text: 'ቀጥሎ የትኞቹን ርዕሶች መከለስ እንዳለብዎት በትክክል ይወቁ።' },
    ],
    notConfigured: 'Supabase ገና አልተዋቀረም። ቁልፎችዎን ወደ <code>.env.local</code> ያክሉ — README ይመልከቱ።',
    backToHome: '← ወደ Zetora ተመለስ',
  },
  login: {
    title: 'እንኳን ደህና መጡ', subtitle: 'መማርዎን ለመቀጠል ይግቡ።',
    email: 'ኢሜይል', emailPlaceholder: 'you@example.com', password: 'የይለፍ ቃል', passwordPlaceholder: 'የይለፍ ቃልዎ',
    forgot: 'የይለፍ ቃል ረስተዋል?', submit: 'ይግቡ', welcome: 'እንኳን ደህና መጡ!',
    newHere: 'ለ Zetora አዲስ ነዎት?', createAccount: 'መለያ ይፍጠሩ',
    errors: {
      link: 'ያ አገናኝ ጊዜው አልፎበታል ወይም ቀደም ሲል ጥቅም ላይ ውሏል። እባክዎ እንደገና ይሞክሩ።',
      suspended: 'ይህ መለያ ታግዷል። እባክዎ ድጋፍን ያነጋግሩ።',
    },
  },
  register: {
    title: 'መለያዎን ይፍጠሩ', subtitle: 'ለ12ኛ ክፍል ሪሜዲያል ተማሪዎች ነጻ ነው። ከአንድ ደቂቃ በታች ይፈጃል።',
    fullName: 'ሙሉ ስም', fullNamePlaceholder: 'ለምሳሌ ሐና በቀለ', email: 'ኢሜይል', password: 'የይለፍ ቃል',
    passwordHint: 'ቢያንስ 8 ቁምፊዎች፣ አንድ ፊደልና አንድ ቁጥር ያካተተ።', confirmPassword: 'የይለፍ ቃሉን ያረጋግጡ',
    submit: 'መለያ ይፍጠሩ', welcome: 'መለያ ተፈጥሯል — ወደ Zetora እንኳን ደህና መጡ!',
    agree: 'መለያ በመፍጠርዎ በ<terms>የአገልግሎት ውላችን</terms> እና በ<privacy>የግላዊነት ፖሊሲያችን</privacy> ተስማምተዋል።',
    verifyTitle: 'ኢሜይልዎን ይመልከቱ',
    verifyBody: 'የማረጋገጫ አገናኝ ወደ <b>{email}</b> ልከናል። መለያዎን ለማንቃት ይክፈቱት፣ ከዚያ ይግቡ።',
    goToSignIn: 'ወደ መግቢያ ይሂዱ', haveAccount: 'መለያ አለዎት?', signIn: 'ይግቡ',
  },
  forgot: {
    title: 'የይለፍ ቃልዎን ዳግም ያስጀምሩ', subtitle: 'ኢሜይልዎን ያስገቡ፤ አዲስ የይለፍ ቃል የሚመርጡበት አገናኝ እንልክልዎታለን።',
    email: 'ኢሜይል', submit: 'የማስጀመሪያ አገናኝ ላክ', sentTitle: 'ኢሜይልዎን ይመልከቱ',
    sentBody: 'ለዚያ አድራሻ መለያ ካለ የይለፍ ቃል ማስጀመሪያ አገናኝ በመንገድ ላይ ነው። ለመድረስ አንድ ደቂቃ ሊወስድ ይችላል።',
    backToSignIn: 'ወደ መግቢያ ተመለስ', remembered: 'አስታወሱት?',
  },
  reset: {
    title: 'አዲስ የይለፍ ቃል ይምረጡ', subtitle: 'ከዚህ በፊት ያልተጠቀሙበትን ይምረጡ።',
    password: 'አዲስ የይለፍ ቃል', confirm: 'አዲሱን የይለፍ ቃል ያረጋግጡ', hint: 'ቢያንስ 8 ቁምፊዎች፣ አንድ ፊደልና አንድ ቁጥር ያካተተ።',
    submit: 'የይለፍ ቃል አዘምን', toast: 'የይለፍ ቃል ተዘምኗል።', skip: 'ለአሁን ዝለል',
  },
};
