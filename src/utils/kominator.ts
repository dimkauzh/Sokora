/**
 * Splits a string using commas.
 * @param {string} string String to split.
 * @returns An array of strings from the original string.
 */
export function kominator(string: string | undefined): string[] {
  if (!string || string.trim() == "") return [];
  const ret = string.split(",").map(str => str.replaceAll('"', "").trim());
  return ret;
}

/**
 * Joins an array using commas.
 * @param {string[]} strings Array to join.
 * @returns A string with all elements of the array, joined.
 */
export function dekominator(strings: string[]): string {
  return strings.map(str => str.trim()).join(",");
}
