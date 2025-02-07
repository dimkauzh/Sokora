import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unban")
  .setDescription("Unbans a user.")
  .addStringOption(string =>
    string
      .setName("id")
      .setDescription("The ID of the user that you want to unban.")
      .setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the unban."));

export async function run(interaction: ChatInputCommandInteraction) {
  const id = interaction.options.getString("id")!;
  const reason = interaction.options.getString("reason")!;
  const guild = interaction.guild!;
  const target = (await guild.bans.fetch()).get(id)?.user!;

  if (
    await errorCheck(
      "BanMembers",
      { interaction, user: target, action: "Unban" },
      { allErrors: false, botError: true, ownerError: true, unbanError: true },
      "Ban Members",
    )
  )
    return;

  await modEmbed({ interaction, user: target, action: "Unbanned" }, reason);
  await guild.members.unban(id, reason ?? undefined).catch(error => console.error(error));
}
