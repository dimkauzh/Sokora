import { EmbedBuilder } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";
import type { Event } from "../utils/types";

/** Copied from https://jsr.io/@zakahacecosas/string-utils/ */
function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export default (async function run(message) {
  const author = message.author;
  if (!author) {
    console.error(`message ${message} lacks author?`);
    return;
  }
  if (author.bot) return;

  const guild = message.guild;
  if (!guild) {
    console.error(`message ${message} lacks guild?`);
    return;
  }
  if (!getSetting(guild.id, "moderation", "log_messages")) return;

  const value = message.content && message.content.length > 0 ? message.content : "Empty message";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName}'s message has been deleted:`,
      iconURL: author.displayAvatarURL()
    })
    .setDescription(value)
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(0));

  await logChannel(guild, embed);
} as Event<"messageDelete">);
