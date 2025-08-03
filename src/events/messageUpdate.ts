import { getSetting } from "database/settings";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { logChannel } from "utils/logChannel";
import type { Event } from "utils/types";

const MESSAGE_LENGTH_CAP = 1024;
export default (async function run(oldMessage, newMessage) {
  if (oldMessage.partial) return;
  const author = oldMessage.author!;
  if (author.bot) return;

  const guild = oldMessage.guild!;
  if (!(await getSetting(guild.id, "moderation", "events"))?.toString().includes("messageUpdate"))
    return;

  const oldContent = oldMessage.content!;
  const newContent = newMessage.content!;
  if (oldContent == newContent) return;
  const oldLength = oldContent.length;
  const newLength = newContent.length;
  const avatar = author.displayAvatarURL();
  const regex = /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/;
  const match = newMessage.content ? newMessage.content.match(regex) : null;
  const url = match ? match[0] : null;
  let thumbnail = null;
  let image = null;
  let video = null;

  /*
    BEWARE.

    this code fetches certain meta tags, as well as other content (e.g, images, videos), from external URLs sent by users.
    this is a MAJOR security risk, as it can lead to skids being able to retrieve the bot's IP address by sending a link to a webserver that they control, possibly leading to DDoS attacks.
    if you are a self-hoster, it's highly recommended to disable this feature within your .env configuration to prevent this from happening.
    otherwise, if you have the appropriate security measures in place, you can leave it enabled.

    WITH GREAT POWER COMES GREAT RESPONSIBILITY (or smth).
  */

  // --

  if (newMessage.content && url && process.env.ENABLE_MEDIA_FETCHING == "true") {
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
    const isTenor = /tenor\.com\/view\//i.test(url);
    const isWebsite = !isImage && !isTenor && !isVideo;

    try {
      if (isImage) image = url;
      else if (isVideo) video = url;
      else if (isTenor || isWebsite) {
        const content = await (await fetch(url)).text();
        const metaContentMatch =
          content.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
          content.match(
            /<meta[^>]+property=["']og:video:secure_url["'][^>]+content=["']([^"']+)["'][^>]*>/i,
          ) ||
          content.match(/<meta\s+property=["']twitter:image["']\s+content=["']([^"']+)["']/i);

        const metaContent = metaContentMatch ? metaContentMatch[1] : undefined;
        if (metaContent) {
          if (isTenor) video = metaContent;
          else if (isWebsite) thumbnail = metaContent;
        }
      }
    } catch (error) {
      return await errorEmbed({
        client: oldMessage.client,
        error,
        title: "Error fetching meta image",
        forward: true,
      });
    }
  }

  // --

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${author.username} edited a message`,
      iconURL: avatar,
    })
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
    .setThumbnail(thumbnail)
    .setImage(image)
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(60));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("• Jump to message")
      .setURL(oldMessage.url)
      .setEmoji("🔗")
      .setStyle(ButtonStyle.Link),
  );

  const files: AttachmentBuilder[] = [];
  if (oldLength >= MESSAGE_LENGTH_CAP)
    files.push(new AttachmentBuilder(Buffer.from(oldContent, "utf8"), { name: "oldContent.txt" }));

  if (newLength >= MESSAGE_LENGTH_CAP)
    files.push(new AttachmentBuilder(Buffer.from(newContent, "utf8"), { name: "newContent.txt" }));

  if (video) files.push(new AttachmentBuilder(video, { name: "tenor.mp4" }));
  await logChannel(guild, { embeds: [embed], files: files, components: [row] });
} as Event<"messageUpdate">);
