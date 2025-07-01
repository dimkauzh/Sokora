/**
 * Splits a string using commas.
 * @param string String to split.
 * @returns An array of strings from the original string.
 */
export function kominator(string: string): string[] {
  const ret = string.split(",").map(str => str.replaceAll('"', "").trim());
  return ret;
}

export function dekominator(strings: string[]): string {
  return strings.map(str => str.trim()).join(",");
}
