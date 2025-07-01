/**
 * Splits a string using commas.
 * @param string String to split.
 * @returns An array of strings from the original string.
 */
export function kominator(string: string): string[] {
  const ret = string.split(",").map(str => str.replaceAll('"', "").trim());
  console.debug("De-comma'd", ret, "from", string);
  return ret;
}

export function kominate(strings: string[]): string {
  return strings.map(str => str.trim()).join(",");
}
