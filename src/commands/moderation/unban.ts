import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unban")
  .setDescription("Unbans a user.")
  .addUserOption(user =>
    user
      .setName("id")
      .setDescription("The ID of the user that you want to unban.")
      .setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the unban."));

export async function run(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("id")!;
  const reason = interaction.options.getString("reason")!;
  const guild = interaction.guild;
  if (!guild)
    return await errorEmbed({
      interaction,
      title: "Error unbanning user.",
      reason: "Couldn't find the guild.",
    });

  if (
    await errorCheck("Ban Members", {
      interaction,
      user: target,
      action: "Unban",
      errorOptions: { allErrors: false, botError: true, ownerError: true, banCheckError: true },
    })
  )
    return;

  try {
    await Promise.all([
      modEmbed({ interaction, user: target, action: "Unbanned", dbAction: "UNBAN" }, reason),
      guild.members.unban(target.id, reason ?? undefined),
    ]);
  } catch (error) {
    await errorEmbed({ interaction, error, forward: true });
  }
}
