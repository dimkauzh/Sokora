import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { errorEmbed } from "../utils/embeds/errorEmbed";
import { logChannel } from "../utils/logChannel";
import type { Event } from "../utils/types";

export default (async function run(message) {
  const author = message.author;
  const client = message.client;
  if (!author)
    return await errorEmbed({
      client,
      title: "Cannot log deleted message",
      reason: `Message ${message} lacks an author.`,
    });

  if (author.bot) return;
  const guild = message.guild;
  if (!guild)
    return await errorEmbed({
      client,
      title: "Cannot log deleted message",
      reason: `Message ${message} lacks the guild.`,
    });

  if (!(await getSetting(guild.id, "moderation", "log_messages"))) return;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.username}'s message got deleted`,
      iconURL: author.displayAvatarURL(),
    })
    .setDescription(
      message.content && message.content.length > 0 ? message.content : "*Empty message*",
    )
    .setTimestamp(new Date())
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(0));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("• Jump to message")
      .setURL(message.url)
      .setEmoji("🔗")
      .setStyle(ButtonStyle.Link),
  );

  await logChannel(guild, { embeds: [embed], components: [row] });
} as Event<"messageDelete">);
