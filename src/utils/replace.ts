import { randomise } from "./randomise";

let emojis = ["💖", "💝", "💓", "💗", "💘", "💟", "💕", "💞"];
if (Math.round(Math.random() * 100) <= 5) emojis = ["⌨️", "💻", "🖥️"];

export const replacements = [
  { text: "(madeWith)", replacement: `Made with ${randomise(emojis)} by the Sokora team` },
];

export function replace(text: string, replaceText?: { text: string; replacement: any }[]) {
  for (const mention of replaceText ? replaceText || replacements : replacements)
    if (text?.includes(mention.text)) text = text.replaceAll(mention.text, mention.replacement);

  return text;
}
