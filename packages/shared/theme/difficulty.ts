// Semantic difficulty tokens — the human-readable names for the 1–5 scale.
// Pairs with ThemeColors.difficulty so bars, labels, and accents always agree.
// Use these anywhere a difficulty level is shown to the user; never inline
// "Easy"/"Hard" strings in components.

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export const difficultyLabels: Record<DifficultyLevel, string> = {
  1: 'Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Hard',
} as const;
