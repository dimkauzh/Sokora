import { Client, EmbedBuilder, Guild, GuildMember } from "discord.js";
import ms from "ms";
import { genColor } from "../utils/colorGen";
import { getAllAutokicks } from "../utils/database/autokick";
import { logChannel } from "../utils/logChannel";
import { errorEmbed } from "./embeds/errorEmbed";

export async function checkAutokicks(client: Client): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    for (const autokick of getAllAutokicks(guild.id))
      try {
        const member = await guild.members.fetch(autokick.user as string).catch(() => null);
        if (!member) continue;

        if (
          Date.now() - new Date(autokick.last_message as string).getTime() >=
          ms(`${autokick.delay} days`)
        )
          await handleAutokick(guild, member, autokick.delay as number);
      } catch (error) {
        await errorEmbed({
          client,
          error,
          title: `Error processing autokick for user ${autokick.user} in guild ${guild.id}`,
          forward: true,
        });
      }
  }
}

async function handleAutokick(guild: Guild, member: GuildMember, days: number): Promise<void> {
  try {
    await member.kick(`Inactive for ${days} days`);
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Member auto-kicked" })
      .setDescription(
        [
          `**Member**: ${member.user.tag}`,
          `**Reason**: Inactive for ${days} days`,
          `**Last active**: <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      )
      .setColor(genColor(100));

    await logChannel(guild, { embeds: [embed] });
  } catch (error) {
    await errorEmbed({
      client: guild.client,
      error,
      title: `Failed to auto-kick member ${member.id} from guild ${guild.id}`,
      forward: true,
    });
  }
}
