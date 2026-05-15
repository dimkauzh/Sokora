import { getGuildLeaderboard } from "database/leveling";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ContainerBuilder,
  EmbedBuilder,
  type InteractionResponse,
  type Message,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buttonCheck, errorEmbed } from "embeds/errorEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { replace } from "utils/replace";
import { safeUser } from "utils/safeThings";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Displays the guild leaderboard.")
  .addNumberOption(option => option.setName("page").setDescription("Page number to display."))
  .setContexts(0);

export async function run(
  interaction: ChatInputCommandInteraction,
): Promise<ContainerBuilder | Message | InteractionResponse | undefined> {
  const guild = interaction.guild;
  const guildID = guild?.id;
  if (!guildID)
    return await errorEmbed({ interaction, title: "This command can only be used in a server." });

  const leaderboardData = await getGuildLeaderboard(guildID);
  if (leaderboardData.length === 0)
    return await errorEmbed({
      interaction,
      title: "No data found.",
      reason: "There is no leveling data for this server yet.",
    });

  leaderboardData.sort((a, b) => {
    return b.level == a.level ? b.xp - a.xp : b.level - a.level;
  });

  const totalPages = Math.ceil(leaderboardData.length / 6);
  let page = Math.max(1, Math.min(interaction.options.getNumber("page") ?? 1, totalPages));
  const generateEmbed = async (): Promise<EmbedBuilder> => {
    const start = (page - 1) * 6;
    const pageData = leaderboardData.slice(start, start + 6);
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Leaderboard" })
      .setFooter({ text: `Page ${page} of ${totalPages}` })
      .setColor(await colorize({ hue: Sokolors.Blue }));

    for (const [index, userData] of pageData.entries()) {
      embed.addFields({
        name: `#${start + index + 1} • ${(await safeUser(interaction.client, userData.userID)).tag}`,
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
  const collector = reply.createMessageComponentCollector({ time: 60_000 });

  collector.on("collect", async (interaction2: ButtonInteraction) => {
    if (await buttonCheck({ i: interaction2, interaction, reply })) return;
    collector.resetTimer({ time: 60_000 });

    if (interaction2.customId == "left") page = page > 1 ? page - 1 : totalPages;
    else page = page < totalPages ? page + 1 : 1;
    await interaction2.update({ embeds: [await generateEmbed()], components: [row] });
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
