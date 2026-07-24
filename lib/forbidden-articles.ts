export const FORBIDDEN_ARTICLES = new Set([
  131,
  132, 133, 134, 135,
  189,
  200,
  205,
  206,
  207,
  208,
  209,
  210,
  211,
  212,
  215,
  217,
  220,
  221,
  226,
  227,
  229,
  274,
  275,
  276,
  277,
  278,
  279,
  280,
  281,
  282,
  283,
  284,
  322,
  335,
  337,
  359,
  360,
  361,
])

export function isForbiddenArticle(input: string): { forbidden: boolean; matched: number[] } {
  const matched: number[] = []
  const seen = new Set<number>()
  // Extract all numbers
  const numbers = input.match(/\d+/g)
  if (!numbers) return { forbidden: false, matched: [] }

  for (const num of numbers) {
    const n = parseInt(num, 10)
    if (FORBIDDEN_ARTICLES.has(n) && !seen.has(n)) {
      seen.add(n)
      matched.push(n)
    }
  }

  return { forbidden: matched.length > 0, matched }
}
