// Client-safe registry for translating text that originates on the server
// (server-action results, validation messages, database errors). English is the key.
let map: Record<string, string> = {};

export function setServerText(next: Record<string, string>) {
  map = next;
}

/** Pure lookup against an explicit map — safe on the server, where a module-level map would be shared by every request. */
export function lookupServerText(table: Record<string, string>, message: string | null | undefined): string {
  if (!message) return '';
  const direct = table[message];
  if (direct) return direct;
  // Messages that carry a variable part: "Upload failed: <reason>"
  for (const [en, tr] of Object.entries(table)) {
    if (en.endsWith('…') && message.startsWith(en.slice(0, -1))) return tr.replace(/…$/, '') + message.slice(en.length - 1);
  }
  return message;
}

/** Browser-side shortcut that uses the map the nearest <I18nProvider> installed. */
export function translateServerText(message: string | null | undefined): string {
  return lookupServerText(map, message);
}
