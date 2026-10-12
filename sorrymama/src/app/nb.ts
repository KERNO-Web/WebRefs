// keep short Russian words (and a dash) on the line with the word that follows
export const nb = (s: string) =>
  s.replace(/\s—/g, ' —').replace(/(?<=^|[\s(«])([а-яёА-ЯЁ]{1,2}|—)\s/g, '$1 ');
