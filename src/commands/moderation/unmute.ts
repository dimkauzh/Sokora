import { getSetting } from "database/settings";
import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unmute")
  .setDescription("Unmutes a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to unmute.").setRequired(true),
  )
  .addStringOption(reason =>
    reason.setName("reason").setDescription("The reason for unmuting the user."),
  )
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
  const target = guild.members.cache.get(user.id);

  if (
    await errorCheck("Moderate Members", {
      interaction,
      user,
      action: "Unmute",
      errorOptions: { allErrors: false, botError: true, outsideError: true },
    })
  )
    return;

  if (!target?.isCommunicationDisabled())
    return await errorEmbed({
      interaction,
      title: "You can't unmute this user.",
      reason: "The user was never muted.",
    });

  const silent =
    interaction.options.getBoolean("silent") ??
    ((await getSetting(guild.id, "moderation", "silent")) as boolean);

  try {
    await modEmbed(
      { interaction, user, action: "Unmuted", dm: true, dbAction: "UNMUTE", silent },
      reason,
    );
    await target?.edit({ communicationDisabledUntil: null });
  } catch (error) {
    await errorEmbed({ interaction, error, forward: true, fileName: "unmute.ts" });
  }
}
