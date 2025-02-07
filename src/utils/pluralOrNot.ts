import { replace } from "./replace";

export function pluralOrNot(word: string, numToCheck: number) {
  if (numToCheck != 1)
    return (word = replace(word, [
      {
        text: word,
        replacement:
          word.charAt(word.length - 1) == "y" ? `${word.replace("y", "")}ies` : `${word}s`,
      },
    ]));

  return word;
}
