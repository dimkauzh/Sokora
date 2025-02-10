/**
 * Randomizes array values.
 * @param array Array to randomize.
 * @returns Randomized value from within the array.
 */

export function randomize(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}
