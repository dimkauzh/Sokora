import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import ms from "ms";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";
import { scheduleUnban } from "../../utils/unbanScheduler";

export const data = new SlashCommandSubcommandBuilder()
  .setName("ban")
  .setDescription("Bans a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to ban.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the ban."))
  .addStringOption(string =>
    string.setName("duration").setDescription("The duration of the ban (e.g 2mo, 1y)."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const guild = interaction.guild!;
  const duration = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason");
  if (
    await errorCheck(
      "BanMembers",
      { interaction, user, action: "Ban" },
      { allErrors: true, botError: true, ownerError: true },
      "Ban Members",
    )
  )
    return;

  if ((await guild.bans.fetch()).get(user.id))
    return await errorEmbed(
      interaction,
      `You can't ban ${user.displayName}.`,
      "This user is already banned.",
    );

  let expiresAt: number | undefined;
  if (duration) {
    const durationMs = ms(duration);
    if (!durationMs || durationMs <= 0)
      return await errorEmbed(
        interaction,
        `You can't ban ${user.displayName} temporarily.`,
        "The duration is invalid.",
      );

    expiresAt = Date.now() + durationMs;
    scheduleUnban(interaction.client, guild.id, user.id, interaction.member!.user.id, durationMs);
  }

  try {
    await modEmbed(
      { interaction, user, action: "Banned", duration, dm: true, dbAction: "BAN", expiresAt },
      reason,
    );
    await guild.members.ban(user.id, { reason: reason ?? undefined });
  } catch (err) {
    console.error("Failed to ban user:", err);
  }
}
