import { executor } from "audit/messageDelete";
import { getSetting } from "database/settings";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { genColor } from "utils/colorGen";
import { logChannel } from "utils/logChannel";
import { pfpCheck } from "utils/pfpCheck";
import type { Event } from "utils/types";

// todo: somehow make the values existent here
export let guild: Guild | null;
export default (async function run(message) {
  try {
    if (message.partial) return;
    const test = await executor;
    // console.log(test?.username);
    const author = message.author;
    if (!author)
      return await errorEmbed({
        client,
        title: "Cannot log deleted message.",
        reason: `Message ${message} lacks an author.`,
      });

    if (author.bot) return;
    guild = message.guild;
    if (!guild)
      return await errorEmbed({
        client,
        title: "Cannot log deleted message.",
        reason: `Message ${message} lacks the guild.`,
      });

    if (!(await getSetting(guild.id, "moderation", "log_messages"))) return;
    const avatar = author.displayAvatarURL();
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${pfpCheck(avatar)}${author.username}'s message got deleted${test ? ` by ${test.username}` : ""}`,
        iconURL: avatar,
      })
      .setDescription(
        message.content && message.content.length > 0 ? message.content : "*Empty message*",
      )
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

    await logChannel(guild, { embeds: [embed], components: [row] });
  } catch (error) {
    return await errorEmbed({ client, error, log: true, forward: true });
  }
} as Event<"messageDelete">);
