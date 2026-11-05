import type { search as en } from '../en/search';

export const search: typeof en = {
  title: 'ፍለጋ',
  description: 'ትምህርቶችን፣ ምዕራፎችን፣ ርዕሶችን፣ ማጠቃለያዎችንና የመማሪያ ቁሳቁሶችን ይፈልጉ።',
  placeholder: 'ትምህርቶች፣ ምዕራፎች፣ ማጠቃለያዎችን ይፈልጉ…',
  hint: 'ቢያንስ ሁለት ፊደላት ይተይቡ። እንደ “osmosis” ወይም “limits” ያለ ርዕስ ይሞክሩ።',
  noResults: 'ለ“{q}” ምንም ውጤት አልተገኘም። ፊደላቱን ይፈትሹ ወይም አጠር ያለ ቃል ይሞክሩ።',
  failed: 'ፍለጋ በአሁኑ ጊዜ አይገኝም።',
  seeAll: 'ሁሉንም ውጤቶች ይመልከቱ',
  kinds: { subject: 'ትምህርት', unit: 'ምዕራፍ', topic: 'ርዕስ', summary: 'ማጠቃለያ', resource: 'ቁሳቁስ' },
  unitN: 'ምዕራፍ {n}',
  unitLine: 'ምዕራፍ {n}፦ {title}',
  page: {
    title: 'ፍለጋ', description: 'ትምህርቶችን፣ ምዕራፎችን፣ ርዕሶችን፣ ማጠቃለያዎችንና የመማሪያ ቁሳቁሶችን ያግኙ።', inputLabel: 'የፍለጋ ቃል', button: 'ፈልግ',
    emptyTitle: 'ምን እየፈለጉ ነው?', emptyBody: 'ቢያንስ ሁለት ፊደላት ይተይቡ። እንደ “osmosis”፣ “limits” ወይም “Newton” ያለ ርዕስ ይሞክሩ።',
    noResultsTitle: 'ለ“{q}” ምንም ውጤት አልተገኘም', noResultsBody: 'ፊደላቱን ይፈትሹ፣ ወይም አጠር ያለ ወይም ጠቅለል ያለ ቃል ይሞክሩ።',
    groups: { subject: 'ትምህርቶች', unit: 'ምዕራፎች', topic: 'ርዕሶች', summary: 'ማጠቃለያዎች', resource: 'የመማሪያ ቁሳቁሶች' },
  },
};
