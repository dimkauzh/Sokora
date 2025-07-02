/**
 * Checks if there is or not a profile picture/emoji to the side, to add (or not) a "•" dot.
 *
 * @param {{
   string: string | undefined;
   includeString?: boolean;
   doubleSpace?: boolean;
   twoSides?: boolean;
 }} options Options.
 * @returns {string} String to be placed aside.
 */
export function dotCheck(options: {
  string: string | undefined;
  includeString?: boolean;
  doubleSpace?: boolean;
  twoSides?: boolean;
}): string {
  const { string, includeString, doubleSpace, twoSides } = options;
  const space = doubleSpace ? "  " : " ";
  const leftSide = twoSides ? space : "";
  return string ? `${includeString ? `${string}${leftSide}` : leftSide}•${space}` : "";
}
