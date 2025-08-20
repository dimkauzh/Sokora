import { getSetting } from "database/settings";
import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("kick")
  .setDescription("Kicks a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to kick.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the kick."))
  .addBooleanOption(bool =>
    bool
      .setName("silent")
      .setDescription(
        "If true, the user won't be notified about this action (overrides the server setting).",
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const reason = interaction.options.getString("reason");
  const guild = interaction.guild!;

  if (
    await errorCheck("Kick Members", {
      interaction,
      user,
      action: "Kick",
      errorOptions: { allErrors: true, botError: true, ownerError: true, outsideError: true },
    })
  )
    return;

  const silent =
    interaction.options.getBoolean("silent") ??
    ((await getSetting(guild.id, "moderation", "silent")) as boolean);

  try {
    await modEmbed(
      { interaction, user, action: "Kicked", dm: true, dbAction: "KICK", silent },
      reason,
    );
    await guild.members.cache.get(user.id)?.kick(reason ?? undefined);
  } catch (error) {
    return await errorEmbed({ interaction, error, forward: true, fileName: "kick.ts" });
  }
}
