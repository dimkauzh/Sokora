import { EmbedBuilder, MessageCreateOptions, AttachmentBuilder } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { logChannel } from "../utils/logChannel";
import type { Event } from "../utils/types";

export default (async function run(oldMessage, newMessage) {
  const author = oldMessage.author!;
  if (author.bot) return;

  const guild = oldMessage.guild!;
  if (!getSetting(guild.id, "moderation", "log_messages")) return;

  const oldContent = oldMessage.content!;
  const newContent = newMessage.content!;
  if (oldContent == newContent) return;
  const oldLength = oldContent.length;
  const newLength = newContent.length;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName} edited a message.`,
      iconURL: author.displayAvatarURL()
    })
    .setDescription(`[Jump to message](${oldMessage.url})`)
    .addFields(
      {
        name: "🖋️ • Old message",
        value:
          oldLength <= 4096
            ? oldContent
            : "The old content of the message is an attachment below this embed due to it being too large."
      },
      {
        name: "🖊️ • New message",
        value:
          newLength <= 4096
            ? newContent
            : `The old content of the message is${oldContent.length > 4096 ? " also" : ""} an attachment below this embed due to it being too large.`
      }
    )
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(60));

  let sendingOptions: MessageCreateOptions = { embeds: [embed] };
  if (oldLength > 4096 || newLength > 4096)
    sendingOptions.files = [
      oldLength > 4096
        ? new AttachmentBuilder(Buffer.from(oldContent, "utf8"), { name: "oldContent.txt" })
        : "",
      newLength > 4096
        ? new AttachmentBuilder(Buffer.from(newContent, "utf8"), { name: "newContent.txt" })
        : ""
    ];

  await logChannel(guild, sendingOptions);
} as Event<"messageUpdate">);
