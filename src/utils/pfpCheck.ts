/**
 * Checks if there is or not a profile picture to the side, to add (or not) a "•" dot.
 *
 * @param {(string | undefined)} pfp Profile picture.
 * @returns {("•  " | "")} String to be placed aside.
 */
export function pfpCheck(pfp: string | undefined): "" | "•  " {
  return pfp ? "•  " : "";
}
