import { date, executor } from "audit/messageDelete";
import { getSetting } from "database/settings";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { logChannel } from "utils/logChannel";
import type { Event } from "utils/types";

// todo: make links work
export default (async function run(message) {
  try {
    if (message.partial) return;
    const author = message.author;
    if (!author)
      return await errorEmbed({
        client,
        title: "Cannot log deleted message.",
        reason: `Message ${message} lacks an author.`,
      });

    if (author.bot) return;
    const guild = message.guild;
    if (!guild)
      return await errorEmbed({
        client,
        title: "Cannot log deleted message.",
        reason: `Message ${message} lacks the guild.`,
      });

    if (!(await getSetting(guild.id, "moderation", "log_messages"))) return;

    const avatar = author.displayAvatarURL();
    const regex = /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/;
    const match = message.content ? message.content.match(regex) : null;
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

    if (message.content && url && process.env.ENABLE_MEDIA_FETCHING === "true") {
      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
      const isTenor = /tenor\.com\/view\//i.test(url);
      const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
      const isWebsite = !isImage && !isTenor && !isVideo;

      try {
        if (isImage) {
          image = url;
        } else if (isVideo) {
          video = url;
        } else if (isTenor || isWebsite) {
          const response = await fetch(url);
          const content = await response.text();
          
          const metaContentMatch =
            content.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
            content.match(/<meta[^>]+property=["']og:video:secure_url["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
            content.match(/<meta\s+property=["']twitter:image["']\s+content=["']([^"']+)["']/i);
          const metaContent = metaContentMatch ? metaContentMatch[1] : undefined; // undefined >>>>> null every day of the week >:)

          if (metaContent) {
            if (isTenor) video = metaContent; else if (isWebsite) thumbnail = metaContent;
          }
        }
      } catch (error) {
        console.error("Error fetching meta image:", error);
      }
    }

    // --

    const embed = new EmbedBuilder()
      .setDescription(
        message.content && message.content.length > 0 ? message.content : "*Empty message*",
      )
      .setThumbnail(thumbnail)
      .setImage(image)
      .setTimestamp(new Date())
      .setFooter({ text: `User ID: ${author.id}` })
      .setColor(genColor(0));

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("•  Jump to message")
        .setURL(message.url)
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Link),
    );

    let timeout;
    setTimeout(() => {
      timeout = date - Date.now();
      embed.setAuthor({
        name: `${dotCheck({ string: avatar, doubleSpace: true })}${author.username}'s message got deleted${(executor ? (executor.id != author.id ? ` by ${executor.username}` : "") : "") || ""}`,
        iconURL: avatar,
      });
    }, timeout || 200);

    await logChannel(guild, { embeds: [embed], components: [row], files: video ? [{ attachment: video, name: `tenor.mp4` }] : [] });
  } catch (error) {
    return await errorEmbed({ client, error, log: true, forward: true });
  }
} as Event<"messageDelete">);