import { getGuildLeaderboard } from "database/leveling";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buttonCheck, errorEmbed } from "embeds/errorEmbed";
import { colorize } from "utils/colorGen";
import { replace } from "utils/replace";
import { safeUser } from "utils/safeThings";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Displays the guild leaderboard.")
  .addNumberOption(option => option.setName("page").setDescription("Page number to display."))
  .setContexts(0);

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  const guildID = guild?.id;
  if (!guildID)
    return await errorEmbed({ interaction, title: "This command can only be used in a server." });

  const leaderboardData = await getGuildLeaderboard(guildID);
  if (!leaderboardData.length)
    return await errorEmbed({
      interaction,
      title: "No data found.",
      reason: "There is no leveling data for this server yet.",
    });

  leaderboardData.sort((a, b) => {
    if (b.level != a.level) return b.level - a.level;
    else return b.xp - a.xp;
  });

  const totalPages = Math.ceil(leaderboardData.length / 6);
  let page = Math.max(1, Math.min(interaction.options.getNumber("page") || 1, totalPages));
  const generateEmbed = async () => {
    const start = (page - 1) * 6;
    const pageData = leaderboardData.slice(start, start + 6);
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Leaderboard" })
      .setFooter({ text: `Page ${page} of ${totalPages}` })
      .setColor(await colorize({ hue: 200 }));

    for (let i = 0; i < pageData.length; i++) {
      const userData = pageData[i];
      embed.addFields({
        name: `#${start + i + 1} • ${(await safeUser(interaction.client, userData.user)).tag}`,
        value: `Level **${Math.floor(userData.level)}** • **${Math.floor(userData.xp)}** XP`,
      });
    }

    return embed;
  };

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("left")
      .setEmoji(replace("(leftArrow)"))
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("right")
      .setEmoji(replace("(rightArrow)"))
      .setStyle(ButtonStyle.Primary),
  );

  const reply = await interaction.reply({
    embeds: [await generateEmbed()],
    components: totalPages > 1 ? [row] : [],
  });

  if (totalPages <= 1) return;
  const collector = reply.createMessageComponentCollector({ time: 30000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (await buttonCheck({ i, interaction, reply, cv2: false })) return;
    collector.resetTimer({ time: 30000 });

    if (i.customId == "left") page = page > 1 ? page - 1 : totalPages;
    else page = page < totalPages ? page + 1 : 1;
    await i.update({ embeds: [await generateEmbed()], components: [row] });
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (error) {
      if (Error.isError(error) && error.message.toLowerCase().includes("unknown message")) return;
      throw error;
    }
  });
}
