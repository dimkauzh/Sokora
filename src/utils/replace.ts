import { Guild, User } from "discord.js";
import { randomize } from "./randomize";
import { Replacements } from "./types";

let emojis = ["💖", "💝", "💓", "💗", "💘", "💟", "💕", "💞"];
if (Math.round(Math.random() * 100) <= 5) emojis = ["⌨️", "💻", "🖥️"];

export const replacements = [
  { text: "(madeWith)", replacement: `Made with ${randomize(emojis)} by the Sokora team` },
];

export function replace(text: string, replaceText?: { text: string; replacement: any }[]) {
  for (const mention of replaceText ? replaceText || replacements : replacements)
    if (text?.includes(mention.text)) text = text.replaceAll(mention.text, mention.replacement);

  return text;
}


/**
 * Takes custom `(codes)` and replaces them with the string they represent.
 *
 * @async
 * @param {string} text String to have its codes replaced.
 * @param {Guild} guild Guild.
 * @param {User} user User.
 * @returns {Promise<string>} String with values replaced. The function is async because it depends on `fetchOwner()`.
 */
export async function replaceCodes(text: string, guild: Guild, user: User): Promise<string> {
  const replacementCodes: Replacements = [
    { text: "(name)", replacement: user.displayName },
    { text: "(username)", replacement: user.username },
    { text: "(count)", replacement: guild.memberCount },
    { text: "(servername)", replacement: guild.name },
    { text: "(serverowner)", replacement: (await guild.fetchOwner()).displayName },
    { text: "(currentdate)", replacement: `<t:${Math.floor(Date.now() / 1000)}:D>` },
    { text: "(currentdate, simple)", replacement: `<t:${Math.floor(Date.now() / 1000)}:d>` },
    { text: "(currentdate, detailed)", replacement: `<t:${Math.floor(Date.now() / 1000)}>` },
  ];

  return replace(text, replacementCodes);
}
