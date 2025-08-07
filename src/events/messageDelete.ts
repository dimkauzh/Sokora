import { executor } from "audit/messageDelete";
import { getSetting } from "database/settings";
import { AttachmentBuilder, EmbedBuilder, Guild, Message } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { genColor } from "utils/colorGen";
import { deletedMsgs } from "utils/constants";
import { dotCheck } from "utils/dotCheck";
import { logChannel } from "utils/logChannel";
import { newline } from "utils/newline";
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

    // discord API is unreliably slow
    // if we try to be faster than them, we break
    // this waits 1.5 sec (which SHOULD be enough for discord to do its stuff)
    await new Promise(resolve => setTimeout(resolve, 1500));
    const avatar = executor ? executor.displayAvatarURL() : author.displayAvatarURL();
    const execId = executor?.id ?? "_";
    const content = newline(
      message.content,
      150,
      `• ${execId != "_" ? `Mod: ${guild.members.cache.get(execId)?.user.username} • ` : ""}Author: ${author.username} • Date: ${new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short", timeZone: "UTC" }).format(message.createdTimestamp)} •\n`,
    );

    const deletedMessages =
      deletedMsgs.get(guild.id) ||
      new Set([
        {
          date: message.createdTimestamp,
          senderId: message.author.id,
          execId,
          content,
          delMsg: null,
        },
      ]);

    const msgArray = deletedMessages
      .values()
      .toArray()
      .filter(m => m.senderId == message.author!.id && m.execId == execId);
    const msgCount = msgArray.length;
    const msgPrevDate = Date.now() - Math.min(...msgArray.map(m => m.date));

    const regex =
      /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/;
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

    if (message.content && url && process.env.ENABLE_MEDIA_FETCHING == "true") {
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
          client,
          error,
          title: "Error fetching meta image",
          forward: true,
        });
      }
    }

    // --

    const embed = new EmbedBuilder()
      .setAuthor({
        name: [
          `${dotCheck({ string: avatar, doubleSpace: true })}`,
          executor
            ? `${executor.username} deleted ${msgCount > 1 ? `${msgCount} messages` : `a message from ${author.username}`}`
            : `${author.username} deleted ${msgCount > 1 ? `${msgCount} messages` : "a message"}`,
        ].join(""),
        iconURL: avatar,
      })
      .setDescription(
        msgCount > 1
          ? "*The attached text file shows all deleted messages.*"
          : message.content && message.content.length > 0
            ? message.content
            : "*Empty message*",
      )
      .setThumbnail(thumbnail)
      .setImage(image)
      .setTimestamp(new Date())
      .setFooter({
        text: `Author ID: ${author.id}${executor ? ` • Executor ID: ${executor.id}` : ""}`,
      })
      .setColor(genColor(0));

    const files: AttachmentBuilder[] = [];
    if (msgCount > 1)
      files.push(
        new AttachmentBuilder(Buffer.from(msgArray.map(msg => msg.content).join("\n"), "utf-8"), {
          name: "message.txt",
        }),
      );
    else {
      if (message.content.length >= 1024)
        files.push(
          new AttachmentBuilder(Buffer.from(message.content, "utf8"), { name: "message.txt" }),
        );

      if (video) files.push(new AttachmentBuilder(video, { name: "tenor.mp4" }));
    }

    async function respond(guild: Guild): Promise<Message> {
      const response = await logChannel(guild, { embeds: [embed], files });
      deletedMessages.add({
        date: message.createdTimestamp,
        senderId: message.author!.id,
        execId,
        content,
        delMsg: response as Message,
      });
      deletedMsgs.set(
        guild.id,
        new Set(
          deletedMessages
            .values()
            .toArray()
            .filter(s => s.date > 60000),
        ),
      );
      return response as Message;
    }

    console.debug(msgArray);

    const lastMsg = deletedMessages.values().toArray().pop()?.delMsg;

    if (lastMsg && msgCount > 1 && msgPrevDate <= 60000) {
      try {
        await lastMsg.delete();
      } catch (error) {
        console.error(error);
      }
    }
    return await respond(guild);
  } catch (error) {
    return await errorEmbed({ client, error, log: true, forward: true });
  }
} as Event<"messageDelete">);
