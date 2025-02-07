import { Client, EmbedBuilder, Guild, GuildMember } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getAllAutokicks } from "../utils/database/autokick";
import { logChannel } from "../utils/logChannel";

export async function checkAutokicks(client: Client): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    for (const autokick of getAllAutokicks(guild.id))
      try {
        const member = await guild.members.fetch(autokick.user as string).catch(() => null);
        if (!member) continue;

        const delay = (autokick.delay as number) * 24 * 60 * 60 * 1000; // Convert days to ms
        if (Date.now() - new Date(autokick.last_message as string).getTime() >= delay)
          await handleAutokick(guild, member, autokick.delay as number);
      } catch (error) {
        console.error(
          `Error processing autokick for user ${autokick.user} in guild ${guild.id}:`,
          error,
        );
      }
  }
}

async function handleAutokick(guild: Guild, member: GuildMember, days: number): Promise<void> {
  try {
    await member.kick(`Inactive for ${days} days`);
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Member Auto-kicked" })
      .setDescription(
        [
          `**Member**: ${member.user.tag}`,
          `**Reason**: Inactive for ${days} days`,
          `**Last Active**: <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      )
      .setColor(genColor(100));

    await logChannel(guild, embed);
  } catch (error) {
    console.error(`Failed to auto-kick member ${member.id} from guild ${guild.id}:`, error);
  }
}
