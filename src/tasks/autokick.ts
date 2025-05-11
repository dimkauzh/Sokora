import { Client, EmbedBuilder, Guild, GuildMember } from "discord.js";
import ms from "ms";
import { genColor } from "../utils/colorGen";
import { getAutokickData, getAutokickSettings, trackActivityAdd } from "../utils/database/autokick";
import { errorEmbed } from "../utils/embeds/errorEmbed";
import { logChannel } from "../utils/logChannel";

export async function checkAutokicks(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    const autokickSettings = await getAutokickSettings(guild);
    if (!autokickSettings) continue;

    try {
      await processInactivityAutokicks(guild, autokickSettings.threshold);
    } catch (error) {
      return await errorEmbed({ client, error, forward: true });
    }
  }
}

async function processInactivityAutokicks(guild: Guild, threshold: number) {
  const delayMs = ms(`${threshold} days`);
  const client = guild.client;
  try {
    const members = await guild.members.fetch();
    for (const member of members.filter(member => !member.presence?.status).values()) {
      if (!getAutokickData(guild.id, member.id)) continue;

      const joinDate = member.joinedTimestamp;
      if (joinDate && Date.now() - joinDate >= delayMs)
        try {
          await kickMember(member, `Was inactive for ${threshold} days`, joinDate);
        } catch (error) {
          return await errorEmbed({
            client,
            error,
            title: `Failed to auto-kick member ${member.id} from guild ${guild.id}`,
            forward: true,
          });
        }
    }

    for (const member of members.values()) await trackActivityAdd(member);
  } catch (error) {
    return await errorEmbed({
      client,
      error,
      title: `Error processing activity checks for guild ${guild.id}`,
      forward: true,
    });
  }
}

async function kickMember(member: GuildMember, reason: string, timestamp: number) {
  await member.kick(reason);
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Member auto-kicked" })
    .setDescription(
      [
        `**Member**: ${member.user.tag}`,
        `**Reason**: ${reason}`,
        `**Join date**: <t:${Math.floor(timestamp / 1000)}:F>`,
      ].join("\n"),
    )
    .setColor(genColor(100));

  await logChannel(member.guild, { embeds: [embed] });
}
