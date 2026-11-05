import type { students as en } from '../../en/admin/students';

export const students: typeof en = {
  actionsFor: 'የ{name} እርምጃዎች', makeStudent: 'ተማሪ አድርግ', makeAdmin: 'አስተዳዳሪ አድርግ', suspend: 'መለያውን አግድ', reactivate: 'መለያውን መልስ',
  removeAdminTitle: 'የ{name}ን የአስተዳዳሪ መዳረሻ ይወገድ?', makeAdminTitle: '{name} አስተዳዳሪ ይደረጉ?', suspendTitle: '{name} ይታገዱ?',
  removeAdminBody: 'የአስተዳዳሪ መስሪያ ገጹን መዳረሻ ያጣሉ፤ መደበኛ ተማሪም ይሆናሉ።',
  makeAdminBody: 'አስተዳዳሪዎች ሁሉንም ይዘት፣ ተማሪዎችና ቅንብሮች ማስተዳደር ይችላሉ። የሚያምኗቸውን ሰዎች ብቻ ያሳድጉ።',
  suspendBody: 'ከZetora ይወጣሉ፤ መለያውን እስኪመልሱ ድረስ መጠቀም አይችሉም። እድገታቸው ይጠበቃል።',
};
