import { getSetting } from "database/settings";
import { getStarred, setStarred } from "database/starboard";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { Event } from "utils/types";

export default (async function run(reaction, user) {
  const client = user.client;

  if (reaction.partial)
    try {
      await reaction.fetch();
    } catch (error) {
      return await errorEmbed({
        client,
        error,
        title: `Error fetching reaction.`,
        log: true,
        forward: true,
      });
    }

  if (user.partial) {
    try {
      await user.fetch();
    } catch (error) {
      await errorEmbed({
        client,
        error,
        title: `Error fetching user.`,
        log: true,
        forward: true,
      });
    }
  }

  const message = await reaction.message.fetch();
  if (!message.guild) return;

  const starEmoji = ((await getSetting(message.guild.id, "starboard", "emoji")) as string) || "⭐";
  if (reaction.emoji.name != starEmoji) return;
  if (!(await getSetting(message.guild.id, "starboard", "enabled")) as boolean) return;
  if (!message.content && !message.attachments.size) return;

  const starboardChannelId = (await getSetting(message.guild.id, "starboard", "channel")) as string;
  if (!starboardChannelId) return;

  const starboardChannel = message.guild.channels.cache.get(starboardChannelId);
  if (!starboardChannel?.isTextBased()) return;

  const starCount = reaction.count || 0;
  const threshold =
    parseInt((await getSetting(message.guild.id, "starboard", "threshold")) as string) || 3;
  if (starCount < threshold) return;

  const existingStarred = getStarred(message.guild.id, message.id);
  const avatar = message.author.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}${message.author.displayName}  •  ${starCount} ${starEmoji}`,
      iconURL: avatar,
    })
    .setDescription(message.content)
    .setTimestamp(message.createdAt)
    .setFooter({ text: `Message ID: ${message.id}` })
    .setColor(genColor(80));

  const ref = message.reference ? await message.fetchReference() : null;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`•  Jump to ${ref ? "starred " : ""}message`)
      .setURL(message.url)
      .setEmoji("🔗")
      .setStyle(ButtonStyle.Link),
  );

  const embeds = [];

  if (ref) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("•  Jump to replied message")
        .setURL(ref.url)
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Link),
    );
    const avatar = ref.author.displayAvatarURL();
    embeds.push(
      new EmbedBuilder()
        .setAuthor({
          name: `${pfpCheck(avatar)}${ref.author.displayName}  •  Replied by starred message`,
          iconURL: avatar,
        })
        .setDescription(ref.content)
        .setTimestamp(ref.createdAt)
        .setFooter({ text: `Message ID: ${ref.id}` })
        .setColor(genColor(75)),
    );
  }

  embeds.push(embed);

  const attachment = message.attachments.first();
  if (attachment?.contentType?.startsWith("image/")) embed.setImage(attachment.url);
  try {
    if (!existingStarred)
      return setStarred(
        message.guild.id,
        message.id,
        message.channel.id,
        message.author.id,
        (await starboardChannel.send({ embeds, components: [row] })).id,
        starCount,
        message.content || "",
        message.createdTimestamp.toString(),
      );

    const [channelId, , starMessageId, , ,] = existingStarred;
    await (
      await starboardChannel.messages.fetch(starMessageId)
    ).edit({ embeds, components: [row] });
    setStarred(
      message.guild.id,
      message.id,
      channelId,
      message.author.id,
      starMessageId,
      starCount,
      message.content || "",
      message.createdTimestamp.toString(),
    );
  } catch (error) {
    await errorEmbed({
      client,
      error,
      title: "Error handling starboard message.",
      log: true,
      forward: true,
    });
  }
} as Event<"messageReactionAdd">);
