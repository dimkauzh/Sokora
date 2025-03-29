import { EmbedBuilder, type ButtonInteraction, type ChatInputCommandInteraction } from "discord.js";
import { genColor } from "../colorGen";

/**
 * Sends the embed containing an error.
 * @param {ChatInputCommandInteraction | ButtonInteraction} interaction The interaction (slash command).
 * @param {string} title The error.
 * @param {?string} reason The reason of the error.
 * @param {?string} errorLog The error's log.
 * @returns Embed with the error description.
 */
export async function errorEmbed(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  title: string,
  reason?: string,
  errorLog?: string,
) {
  const content = [`**${title}**`];
  if (reason) content.push(reason);
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Something went wrong!" })
    .setDescription(content.join("\n"))
    .setColor(genColor(0));

  if (errorLog) embed.addFields({ name: "Error log", value: errorLog });
  if (interaction.replied)
    return await interaction.followUp({ embeds: [embed], flags: "Ephemeral" });
  return await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
}
