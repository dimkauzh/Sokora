import { EmbedBuilder } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";
import { Event } from "../utils/types";

export default (async function run(oldMessage, newMessage) {
  const author = oldMessage.author!;
  if (author.bot) return;

  const guild = oldMessage.guild!;
  if (!getSetting(guild.id, "moderation", "log_messages")) return;

  const oldContent = oldMessage.content!;
  const newContent = newMessage.content!;
  if (oldContent == newContent) return;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName} edited a message.`,
      iconURL: author.displayAvatarURL(),
    })
    .setDescription(
      `[Jump to message](${oldMessage.url}) • [See ${author.displayName}'s profile](https://discord.com/users/${author.id})`,
    )
    .setTimestamp(new Date())
    .addFields(
      {
        name: "🖋️ • Old message",
        value: oldContent,
      },
      {
        name: "🖊️ • New message",
        value: newContent,
      },
    )
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(60));

  await logChannel(guild, embed);
} as Event<"messageUpdate">);
