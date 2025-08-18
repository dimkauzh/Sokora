import { getSetting } from "database/settings";
import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";
import ms from "ms";
import { scheduleUnban } from "utils/unbanScheduler";

export const data = new SlashCommandSubcommandBuilder()
  .setName("ban")
  .setDescription("Bans a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to ban.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the ban."))
  .addStringOption(string =>
    string.setName("duration").setDescription("The duration of the ban (e.g 2mo, 1y)."),
  )
  .addBooleanOption(bool =>
    bool.setName("silent").setDescription("If true, the user won't be notified about this action."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const guild = interaction.guild!;
  const duration = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason");

  if (
    await errorCheck("Ban Members", {
      interaction,
      user,
      action: "Ban",
      errorOptions: {
        allErrors: true,
        banCheckError: true,
        botError: true,
        ownerError: true,
      },
    })
  )
    return;

  let expiresAt: number | undefined;
  if (duration) {
    const durationMs = ms(duration);
    if (!durationMs || durationMs <= 0)
      return await errorEmbed({
        interaction,
        title: `You can't ban ${user.username} temporarily.`,
        reason: "The duration is invalid.",
      });

    expiresAt = Date.now() + durationMs;
    scheduleUnban(interaction.client, guild.id, user.id, interaction.member!.user.id, durationMs);
  }

  const silent =
    interaction.options.getBoolean("silent") ||
    false ||
    ((await getSetting(guild.id, "moderation", "silent")) as boolean);

  try {
    await modEmbed(
      {
        interaction,
        user,
        action: "Banned",
        duration,
        dm: true,
        dbAction: "BAN",
        expiresAt,
        silent,
      },
      reason,
    );
    await guild.members.ban(user.id, { reason: reason ?? undefined });
  } catch (error) {
    return await errorEmbed({ interaction, error, forward: true });
  }
}
