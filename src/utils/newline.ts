export function newline(str: string, chars: number, startWith?: string): string {
  const splitStr = str.split(" ");
  const array: string[] = [];
  let length: number = 0;
  let i: number = 0;

  splitStr.map(string => {
    let word = string.concat(" ");
    length += word.length;
    while (length > chars + i) {
      if (length > chars) word = `\n${word}`;
      i += chars;
    }
    array.push(word);
  });

  return `${startWith}${array.join("").replaceAll("\n", `\n${startWith}`)}`;
}
