import { replace } from "./replace";

/**
 * If `numToCheck` isn't 1, `word` is made plural and returned, otherwise `word` is returned untouched.
 *
 * @param {string} word Word to pluralize.
 * @param {number} numToCheck Number to check.
 * @returns {string} Pluralized (or not) string.
 */
export function pluralOrNot(word: string, numToCheck: number): string {
  if (numToCheck == 1) return word;

  return (word = replace(word, [
    {
      text: word,
      replacement: word.charAt(word.length - 1) == "y" ? `${word.replace("y", "")}ies` : `${word}s`,
    },
  ]));
}
