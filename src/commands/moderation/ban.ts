import { getSetting } from "database/settings";
import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";
import ms from "enhanced-ms";
import { safeMembers } from "utils/safeThings";
import { scheduleUnban } from "utils/unbanScheduler";

export const data = new SlashCommandSubcommandBuilder()
  .setName("ban")
  .setDescription("Bans a user.")
  .addUserOption(user =>
    user
      .setName("user")
      .setDescription("The user that you want to ban. (you can provide a user ID)")
      .setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the ban."))
  .addStringOption(string =>
    string.setName("duration").setDescription("The duration of the ban (e.g 2mo, 1y)."),
  )
  .addBooleanOption(bool =>
    bool.setName("del").setDescription("If true, the user's messages will be deleted."),
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
  const guild = interaction.guild!;
  const userOrMember = (await safeMembers(guild)).has(user.id);
  const duration = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason");
  const del = interaction.options.getBoolean("del");

  if (
    await errorCheck("Ban Members", {
      interaction,
      user,
      action: "Ban",
      errorOptions: {
        allErrors: userOrMember,
        banCheckError: true,
        botError: true,
        ownerError: true,
      },
    })
  )
    return;

  if (duration) {
    const durationMs = ms(duration);
    if (!durationMs || durationMs <= 0)
      return await errorEmbed({
        interaction,
        title: `You can't ban ${user.username} temporarily.`,
        reason: "The duration is invalid.",
      });

    scheduleUnban(interaction.client, guild.id, user.id, interaction.member!.user.id, durationMs);
  }

  const silent =
    interaction.options.getBoolean("silent") ??
    ((await getSetting(guild.id, "moderation", "silent")) as boolean);

  try {
    await modEmbed(
      {
        interaction,
        user,
        action: "Banned",
        duration: duration ? ms(duration) : undefined,
        dm: userOrMember,
        dbAction: "BAN",
        expiresAt: duration ? ms(duration) : undefined,
        silent,
      },
      reason,
    );
    await guild.members.ban(user.id, { reason: reason ?? undefined });
    if (del) {
      for await (const channel of await guild.channels.fetch()) {
        if (!channel[1] || !channel[1].isTextBased()) continue;
        const messages = (await channel[1].messages.fetch({ limit: 100 })).filter(
          m => m.author.id == user.id && !m.partial,
        );
        await channel[1].bulkDelete(messages, true);
      }
    }
  } catch (error) {
    return await errorEmbed({ interaction, error, forward: true, fileName: "ban.ts" });
  }
}
