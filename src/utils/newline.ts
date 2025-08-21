// I have a love-hate relationship with this function
// (mostly hate)
export function newline(str: string, chars: number, startWith: string = ""): string {
  const splitStr = str.split(" ");
  const array: string[] = [];
  let length: number = 0;
  let i: number = 0;

  splitStr.map(string => {
    let word = string.concat(" ");
    if (word.trim().startsWith("**")) {
      word = `\n${word}`;
      length -= word.length + startWith.length;
    }
    length += word.length;
    while (length > chars + i) {
      if (length > chars) word = `\n${word}`;
      i += chars;
    }
    array.push(word);
  });

  return `${startWith}${array.join("").replaceAll("\n", `\n${startWith}`)}`;
}
