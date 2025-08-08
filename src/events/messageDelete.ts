import { executor } from "audit/messageDelete";
import { getSetting } from "database/settings";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { logChannel } from "utils/logChannel";
import { fetchMedia } from "utils/media";
import type { Event } from "utils/types";

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

    if (!(await getSetting(guild.id, "moderation", "events"))?.toString().includes("messageDelete"))
      return;

    const avatar = executor ? executor.displayAvatarURL() : author.displayAvatarURL();

    let media;

    try {
      media = await fetchMedia(message);
    } catch (error) {
      return await errorEmbed({
        client,
        error,
        title: "Error fetching meta image",
        forward: true,
      });
    }

    const { image, video, thumbnail } = media;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: [
          `${dotCheck({ string: avatar, doubleSpace: true })}`,
          executor
            ? `${executor.username} deleted a message from ${author.username}`
            : `${author.username} deleted a message`,
        ].join(""),
        iconURL: avatar,
      })
      .setDescription(
        message.content && message.content.length > 0 ? message.content : "*Empty message*",
      )
      .setThumbnail(thumbnail)
      .setImage(image)
      .setTimestamp(new Date())
      .setFooter({
        text: `Author ID: ${author.id}${executor ? ` • Executor ID: ${executor.id}` : ""}`,
      })
      .setColor(genColor(0));

    const files: AttachmentBuilder[] = [];
    if (video) files.push(new AttachmentBuilder(video, { name: "tenor.mp4" }));

    return await logChannel(guild, { embeds: [embed], files });
  } catch (error) {
    return await errorEmbed({ client, error, log: true, forward: true });
  }
} as Event<"messageDelete">);
