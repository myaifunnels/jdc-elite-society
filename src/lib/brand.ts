/** The CRM / automation platform behind this site is white-labelled: users only ever see "AiFunnels".
 * Text we write is already branded at the source; this covers text that comes from stored records
 * or from the platform itself (a contact's saved source, a course's source line) and may still
 * carry the vendor's name. Collapses "AiFunnels AiFunnels" left by a source like "AiFunnels GHL". */
export function whiteLabel(text: string) {
  return text
    .replace(/go\s?high\s?level|highlevel|\bGHL\b/gi, "AiFunnels")
    .replace(/(AiFunnels)(\s+AiFunnels)+/g, "$1");
}
