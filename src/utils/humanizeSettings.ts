/**
 * Outputs the given settings_string
 * @param {string} string Settings string, either a key or a value.
 */
export function humanizeSettings(string: string) {
  if (!string) return;
  const humanized = string
    .trim()
    .replaceAll("_", " ")
    .replaceAll("true", "Enabled")
    .replaceAll("false", "Disabled")
    .replaceAll("(name)", "`(name)`")
    .replaceAll("(servername)", "`(servername)`")
    .replaceAll("(count)", "`(count)`")
    .replaceAll("(serverowner)", "`(serverowner)`")
    .replaceAll("(currentdate)", "`(currentdate)`");

  return humanized;
}
