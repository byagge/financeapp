/** Levenshtein distance — lower is closer. */
export function editDistance(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
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
      cur[j] = Math.min(
        cur[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= t.length; j++) prev[j] = cur[j];
  }
  return prev[t.length];
}

/** Rank score for person search (higher = better match). */
export function personMatchScore(query: string, name: string): number {
  const q = query.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (!q) return 0;
  if (n === q) return 10_000;
  if (n.startsWith(q)) return 5_000 - n.length;
  if (n.includes(q)) return 2_000 - n.indexOf(q);
  const dist = editDistance(q, n);
  const maxLen = Math.max(q.length, n.length);
  // Accept loose typos (e.g. иолжон ↔ инлжон)
  if (dist > Math.max(2, Math.ceil(maxLen * 0.45))) return -1;
  return 1_000 - dist * 40 - Math.abs(n.length - q.length);
}
