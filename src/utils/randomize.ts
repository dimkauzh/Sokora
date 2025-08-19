/**
 * Randomizes array values.
 * @param {T[]} array Array to randomize.
 * @returns {T} Randomized value from within the array.
 */
export function randomize<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
