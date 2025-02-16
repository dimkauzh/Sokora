/**
 * Outputs the given settings_string with formatting applied.
 * @param {string} string Settings string, either a key or a value.
 */
export function humanizeSettings(string: string): string {
  const humanized = string
    .trim()
    .replaceAll("_", " ")
    .replaceAll("true", "Enabled")
    .replaceAll("false", "Disabled")
    .replaceAll("(name)", "`(name)`")
    .replaceAll("(servername)", "`(servername)`")
    .replaceAll("(count)", "`(count)`")
    .replaceAll("(serverowner)", "`(serverowner)`")
    .replaceAll("(currentdate)", "`(currentdate)`")
    .replaceAll("(currentdate, simple)", "`(currentdate, simple))`")
    .replaceAll("(currentdate, detailed)", "`(currentdate, detailed)`");

  return humanized;
}
