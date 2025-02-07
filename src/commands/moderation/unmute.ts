import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unmute")
  .setDescription("Unmutes a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to unmute.").setRequired(true),
  )
  .addStringOption(reason =>
    reason.setName("reason").setDescription("The reason for unmuting the user."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const target = interaction.guild?.members.cache.get(user.id);
  const reason = interaction.options.getString("reason");

  if (
    await errorCheck(
      "ModerateMembers",
      { interaction, user, action: "Unmute" },
      { allErrors: false, botError: true },
      "Moderate Members",
    )
  )
    return;

  if (!target?.communicationDisabledUntil)
    return await errorEmbed(
      interaction,
      "You can't unmute this user.",
      "The user was never muted.",
    );

  await modEmbed({ interaction, user, action: "Unmuted", dm: true, dbAction: "UNMUTE" }, reason);
  await target?.edit({ communicationDisabledUntil: null }).catch(error => console.error(error));
}
