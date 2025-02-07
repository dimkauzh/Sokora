import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("kick")
  .setDescription("Kicks a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to kick.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the kick."));

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  if (
    await errorCheck(
      "KickMembers",
      { interaction, user, action: "Kick" },
      { allErrors: true, botError: true, ownerError: true, outsideError: true },
      "Kick Members",
    )
  )
    return;

  if (!interaction.guild?.members.cache.get(user.id))
    return await errorEmbed(
      interaction,
      `You can't kick ${user.displayName}.`,
      "This user is not in the server.",
    );

  const reason = interaction.options.getString("reason");
  await modEmbed({ interaction, user, action: "Kicked", dm: true, dbAction: "KICK" }, reason);
  await interaction.guild?.members.cache
    .get(user.id)
    ?.kick(reason ?? undefined)
    .catch(error => console.error(error));
}
