import type { Message } from "discord.js";
import { safeMember } from "./safeThings";

/**
 * Reacts to a message with multiple emojis.
 * @param {Message} message Message to react to.
 * @param {string[]} emojis Emojis that will be used to react.
 */
export async function multiReact(message: Message, ...emojis: string[]): Promise<void> {
  const guild = message.guild;
  if (!guild) return;
  if (!(await safeMember(guild, message.client.user.id)).permissions.has("AddReactions")) return;

  for (const i of emojis) {
    if (typeof i == "object") {
      await message.react(i);
      continue;
    }
    for (const reaction of i) if (reaction != " ") await message.react(reaction);
  }
}
