import type { settings as en } from '../en/settings';

export const settings: typeof en = {
  title: 'መገለጫና ቅንብሮች', description: 'በZetora ውስጥ እንዴት እንደሚታዩ ያስተካክሉ፤ መለያዎንም ደህንነቱ የተጠበቀ ያድርጉ።',
  profile: 'መገለጫዎ', password: 'የይለፍ ቃል', appearance: 'ገጽታ',
  appearanceHint: 'Zetora በዚህ መሣሪያ ላይ እንዴት እንደሚታይ ይምረጡ። “ሲስተም” የስልክዎን ወይም የኮምፒውተርዎን ቅንብር ይከተላል።',
  language: 'ቋንቋ', languageHint: 'ምናሌዎች፣ አዝራሮችና መልእክቶች ቋንቋ ይቀይራሉ። ትምህርቶች፣ ኩዊዞችና ሌሎች የትምህርት ይዘቶች በተጻፉበት ቋንቋ ይቆያሉ።',
  avatar: {
    change: 'ፎቶ ቀይር', upload: 'ፎቶ ጫን', remove: 'አስወግድ', hint: 'JPG፣ PNG ወይም WebP። መጠኑ በራስ-ሰር ይስተካከላል።',
    fileLabel: 'የመገለጫ ፎቶ ፋይል', updated: 'የመገለጫ ፎቶ ተዘምኗል', removed: 'ፎቶው ተወግዷል',
    tooBig: 'እባክዎ ከ15 ሜባ በታች የሆነ ምስል ይምረጡ።', tooLarge: 'ምስሉ በጣም ትልቅ ነው።', failed: 'መጫን አልተሳካም።',
  },
  fields: {
    fullName: 'ሙሉ ስም', email: 'ኢሜይል', emailHint: 'ኢሜይልዎ ለመግባት የሚያገለግል ሲሆን እዚህ መቀየር አይቻልም።',
    school: 'ትምህርት ቤት ወይም ተቋም', location: 'አካባቢ', locationPlaceholder: 'ከተማ ወይም ክልል',
  },
  saved: 'ተቀምጧል',
  pw: {
    newPassword: 'አዲስ የይለፍ ቃል', hint: 'ቢያንስ 8 ቁምፊዎች፣ ፊደልና ቁጥር የያዘ።', confirm: 'አዲሱን የይለፍ ቃል ያረጋግጡ',
    update: 'የይለፍ ቃል አዘምን', updated: 'የይለፍ ቃሉ ተዘምኗል።',
  },
};
