import { EmbedBuilder } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";
import type { Event } from "../utils/types";
import { errorEmbed } from "../utils/embeds/errorEmbed";

export default (async function run(message) {
  const author = message.author;
  if (!author) {
    await errorEmbed({
      title: "Cannot log deleted message",
      reason: `message ${message} lacks author?`,
    });
    return;
  }
  if (author.bot) return;

  const guild = message.guild;
  if (!guild) {
    await errorEmbed({
      title: "Cannot log deleted message",
      reason: `message ${message} lacks guild?`,
    });
    return;
  }
  if (!getSetting(guild.id, "moderation", "log_messages")) return;

  const value = message.content && message.content.length > 0 ? message.content : "*Empty message*";
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName}'s message has been deleted.`,
      iconURL: author.displayAvatarURL(),
    })
    .setDescription(
      `[Jump to message](${message.url}) • [See ${author.displayName}'s profile](https://discord.com/users/${author.id})`,
    )
    .setTimestamp(new Date())
    .addFields({
      name: "🗑️ • Deleted message",
      value,
    })
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(0));

  await logChannel(guild, { embeds: [embed] });
} as Event<"messageDelete">);
