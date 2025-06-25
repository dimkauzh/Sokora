export function newline(str: string): string[] {
  const arr = Array.from(str);
  const arrays = [];
  let i = 0;

  while (i <= arr.length) {
    arrays.push(arr.splice(0, 100));
    i += 100;
  }

  return arrays.map(i => i.join("")).flat();
}
