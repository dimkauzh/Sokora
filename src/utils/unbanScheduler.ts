import { getPendingBans, removeModeration } from "database/moderation";
import { Client, EmbedBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { colorize, Sokolors } from "./colorGen";
import { dotCheck } from "./dotCheck";
import { logChannel } from "./logChannel";
import { safeGuild, safeMember } from "./safeThings";

export function scheduleUnban(
  client: Client,
  guildID: string,
  userID: string,
  modID: string,
  delay: number,
) {
  const scheduledUnbans = new Map<string, Timer>();
  const key = `${guildID}-${userID}`;
  if (scheduledUnbans.has(key)) clearTimeout(scheduledUnbans.get(key)!);

  const timeout = setTimeout(
    async () => {
      try {
        const guild = await safeGuild(client, guildID);
        const user = (await guild.bans.fetch(userID)).user;
        if (!user) {
          removeModeration(guildID, userID);
          return await errorEmbed({
            client,
            title: `Failed to unban user ${userID} in guild ${guildID}.`,
            reason: "User not found in the guild's ban list's cache.",
            log: true,
            forward: true,
            fileName: "unbanScheduler.ts",
          });
        }

        const moderator = await safeMember(guild, modID);
        if (!moderator) {
          return await errorEmbed({
            client,
            title: `Failed to unban user ${userID} in guild ${guildID}.`,
            reason: "Moderator not found in the guild cache.",
            log: true,
            forward: true,
            fileName: "unbanScheduler.ts",
          });
        }

        const avatar = user.displayAvatarURL();
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `${dotCheck({ string: avatar, doubleSpace: true })}Unbanned ${user.displayName}`,
            iconURL: avatar,
          })
          .setDescription(
            [`**Moderator**: ${moderator.displayName}`, "*Temporary ban has expired*"].join("\n"),
          )
          .setFooter({ text: `User ID: ${user.id}` })
          .setColor(await colorize({ hue: Sokolors.Green }));

        await logChannel(guild, { embeds: [embed] });
        await guild.members.unban(userID, "Temporary ban has expired");
        removeModeration(guildID, userID);
        scheduledUnbans.delete(key);
      } catch (error) {
        if (String(error).toLowerCase().includes("unknown guild")) {
          removeModeration(guildID, userID);
          return await errorEmbed({
            client,
            title: `Failed to ban user(s) from guild ${guildID}.`,
            reason: "The guild is undefined.",
            log: true,
            forward: true,
            fileName: "unbanScheduler.ts",
          });
        }
        return await errorEmbed({
          client,
          error,
          title: `Failed to unban user ${userID} in guild ${guildID}.`,
          log: true,
          forward: true,
          fileName: "unbanScheduler.ts",
        });
      }
    },
    // this math.min exists because apparently "delay" may surpass the limit
    // by being bigger than a signed int32 in some cases
    Math.min(delay, 2147483646),
  );

  return scheduledUnbans.set(key, timeout);
}

export async function rescheduleUnbans(client: Client) {
  const now = Date.now();
  for (const ban of getPendingBans(now)) {
    if (!ban.expiresAt) continue;
    if (typeof ban.expiresAt != "number" || isNaN(ban.expiresAt)) {
      await errorEmbed({
        client,
        title: `Invalid expiresAt value for ban: ${ban.expiresAt}.`,
        log: true,
        forward: true,
        fileName: "unbanScheduler.ts",
      });
      continue;
    }

    const delay = ban.expiresAt - now;
    if (delay > 0) scheduleUnban(client, ban.guild, ban.user, ban.moderator, delay);
    else removeModeration(ban.guild, ban.id);
  }
}
