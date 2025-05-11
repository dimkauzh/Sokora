import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";
import type { Event } from "../utils/types";

const MESSAGE_LENGTH_CAP = 1024;

export default (async function run(oldMessage, newMessage) {
  const author = oldMessage.author!;
  if (author.bot) return;

  const guild = oldMessage.guild!;
  if (!(await getSetting(guild.id, "moderation", "log_messages"))) return;

  const oldContent = oldMessage.content!;
  const newContent = newMessage.content!;
  if (oldContent == newContent) return;
  const oldLength = oldContent.length;
  const newLength = newContent.length;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName} edited a message`,
      iconURL: author.displayAvatarURL(),
    })
    .setDescription(
      `[Jump to message](${oldMessage.url}) • [See ${author.displayName}'s profile](https://discord.com/users/${author.id})`,
    )
    .setTimestamp(new Date())
    .addFields(
      {
        name: "🖋️ • Old message",
        value:
          oldLength <= MESSAGE_LENGTH_CAP
            ? oldContent
            : "*The old content of the message is an attachment below this embed due to it being too large.*",
      },
      {
        name: "🖊️ • New message",
        value:
          newLength <= MESSAGE_LENGTH_CAP
            ? newContent
            : `*The old content of the message is${oldContent.length > 4096 ? " also" : ""} an attachment below this embed due to it being too large.*`,
      },
    )
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(60));

  const files: AttachmentBuilder[] = [];
  if (oldLength >= MESSAGE_LENGTH_CAP)
    files.push(new AttachmentBuilder(Buffer.from(oldContent, "utf8"), { name: "oldContent.txt" }));
  if (newLength >= MESSAGE_LENGTH_CAP)
    files.push(new AttachmentBuilder(Buffer.from(newContent, "utf8"), { name: "newContent.txt" }));

  await logChannel(guild, { embeds: [embed], files: files });
} as Event<"messageUpdate">);
