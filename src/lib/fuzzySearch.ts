/** Shared fuzzy search: typos, translit (Cyr↔Lat), diacritics. */

/** Levenshtein distance — lower is closer. */
export function editDistance(a: string, b: string): number {
  const s = a;
  const t = b;
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const prev = new Array(t.length + 1);
  const cur = new Array(t.length + 1);
  for (let j = 0; j <= t.length; j++) prev[j] = j;

  for (let i = 1; i <= s.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= t.length; j++) prev[j] = cur[j];
  }
  return prev[t.length];
}

/** Strip diacritics / unify quotes / lowercase. */
export function stripDiacritics(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´ʻʼ']/g, "")
    .replace(/ё/g, "е")
    .replace(/Ё/g, "Е")
    .toLowerCase()
    .trim();
}

/** Digraphs first — Cyrillic → Latin phonetics (RU / UZ / KY). */
const CYR_TO_LAT: [string, string][] = [
  ["щ", "sch"],
  ["ш", "sh"],
  ["ч", "ch"],
  ["ц", "ts"],
  ["ю", "yu"],
  ["я", "ya"],
  ["ё", "yo"],
  ["ж", "zh"],
  ["х", "h"],
  ["ъ", ""],
  ["ь", ""],
  ["ў", "o"],
  ["қ", "q"],
  ["ғ", "g"],
  ["ҳ", "h"],
  ["а", "a"],
  ["б", "b"],
  ["в", "v"],
  ["г", "g"],
  ["д", "d"],
  ["е", "e"],
  ["з", "z"],
  ["и", "i"],
  ["й", "y"],
  ["к", "k"],
  ["л", "l"],
  ["м", "m"],
  ["н", "n"],
  ["о", "o"],
  ["п", "p"],
  ["р", "r"],
  ["с", "s"],
  ["т", "t"],
  ["у", "u"],
  ["ф", "f"],
  ["ы", "y"],
  ["э", "e"],
];

/** Common Latin digraphs → single Cyrillic (for reverse fold). */
const LAT_TO_CYR: [string, string][] = [
  ["sch", "щ"],
  ["sh", "ш"],
  ["ch", "ч"],
  ["ts", "ц"],
  ["yu", "ю"],
  ["ya", "я"],
  ["yo", "ё"],
  ["zh", "ж"],
  ["kh", "х"],
  ["a", "а"],
  ["b", "б"],
  ["v", "в"],
  ["g", "г"],
  ["d", "д"],
  ["e", "е"],
  ["z", "з"],
  ["i", "и"],
  ["y", "й"],
  ["k", "к"],
  ["l", "л"],
  ["m", "м"],
  ["n", "н"],
  ["o", "о"],
  ["p", "п"],
  ["r", "р"],
  ["s", "с"],
  ["t", "т"],
  ["u", "у"],
  ["f", "ф"],
  ["h", "х"],
  ["q", "қ"],
];

function replaceMap(input: string, pairs: [string, string][]): string {
  let out = input;
  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }
  return out;
}

export function toLatinFold(input: string): string {
  return replaceMap(stripDiacritics(input), CYR_TO_LAT);
}

export function toCyrillicFold(input: string): string {
  return replaceMap(stripDiacritics(input), LAT_TO_CYR);
}

/** Unique folded variants for cross-script matching. */
export function foldVariants(input: string): string[] {
  const base = stripDiacritics(input);
  if (!base) return [];
  const latin = toLatinFold(base);
  const cyr = toCyrillicFold(base);
  const altH = latin.replace(/kh/g, "h");
  return [...new Set([base, latin, cyr, altH].filter(Boolean))];
}

function scorePair(q: string, text: string): number {
  if (!q) return 0;
  if (!text) return -1;
  if (text === q) return 10_000;
  if (text.startsWith(q)) return 5_000 - Math.min(text.length, 200);
  if (text.includes(q)) return 2_000 - Math.min(text.indexOf(q), 500);

  let best = -1;
  const tokens = text.split(/[\s\-_/.,;:+]+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok === q) best = Math.max(best, 9_000);
    else if (tok.startsWith(q)) best = Math.max(best, 4_500 - tok.length);
    else if (tok.includes(q)) best = Math.max(best, 1_800);
    else if (q.length >= 2) {
      const dist = editDistance(q, tok);
      const maxLen = Math.max(q.length, tok.length);
      const allowed = Math.max(1, Math.ceil(maxLen * 0.4));
      if (dist <= allowed) {
        best = Math.max(best, 1_200 - dist * 50 - Math.abs(tok.length - q.length));
      }
    }
  }

  // Whole-string typo tolerance (short fields / names)
  if (best < 0 && q.length >= 2 && text.length <= 48) {
    const dist = editDistance(q, text);
    const maxLen = Math.max(q.length, text.length);
    const allowed = Math.max(2, Math.ceil(maxLen * 0.35));
    if (dist <= allowed) {
      best = Math.max(best, 800 - dist * 40);
    }
  }

  // Sliding window: query vs similarly-sized slices of text (typo in the middle)
  if (best < 0 && q.length >= 3 && text.length > q.length) {
    const window = Math.min(text.length, q.length + 2);
    const maxDist = Math.max(1, Math.ceil(q.length * 0.35));
    for (let i = 0; i <= text.length - q.length; i++) {
      const slice = text.slice(i, i + window);
      const dist = editDistance(q, slice.slice(0, q.length));
      if (dist <= maxDist) {
        best = Math.max(best, 700 - dist * 45 - i);
        break;
      }
    }
  }

  return best;
}

/**
 * Rank score for fuzzy match (higher = better).
 * Returns -1 when the candidate should be excluded.
 */
export function fuzzyMatchScore(query: string, text: string): number {
  const qRaw = query.trim();
  if (!qRaw) return 0;
  if (!text?.trim()) return -1;

  const qVars = foldVariants(qRaw);
  const tVars = foldVariants(text);
  let best = -1;
  for (const q of qVars) {
    for (const t of tVars) {
      best = Math.max(best, scorePair(q, t));
    }
  }
  return best;
}

/** Best score across several text fields. */
export function fuzzyMatchAny(query: string, fields: Array<string | null | undefined>): number {
  let best = -1;
  for (const f of fields) {
    if (!f) continue;
    best = Math.max(best, fuzzyMatchScore(query, f));
  }
  return best;
}

/** Filter + sort items by fuzzy score descending. */
export function fuzzyFilterRanked<T>(
  items: T[],
  query: string,
  getFields: (item: T) => Array<string | null | undefined>
): T[] {
  const q = query.trim();
  if (!q) return items;
  return items
    .map((item) => ({ item, score: fuzzyMatchAny(q, getFields(item)) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
