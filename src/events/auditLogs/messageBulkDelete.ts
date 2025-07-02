import { AuditLogEvent, ChannelType, Client, EmbedBuilder, GuildAuditLogsEntry } from "discord.js";
import { genColor } from "utils/colorGen";
import { logChannel } from "utils/logChannel";
import { mention } from "utils/mention";
import { pfpCheck } from "utils/pfpCheck";
import { pluralOrNot } from "utils/pluralOrNot";

export async function run(
  auditEntry: GuildAuditLogsEntry<AuditLogEvent.MessageBulkDelete>,
  client: Client,
) {
  const executor = auditEntry.executor;
  if (!executor) return;

  const channel = await client.channels.fetch(auditEntry.target.id);
  if (!channel) return;
  if (channel.type == ChannelType.DM || channel.type == ChannelType.GroupDM) return;

  const deletedAmount = auditEntry.extra.count;
  const avatar = executor.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}Cleared ${deletedAmount} ${pluralOrNot("message", deletedAmount)}`,
      iconURL: avatar,
    })
    .setDescription(
      [`**Moderator**: ${executor.username}`, `**Channel**: ${mention(channel.id, "CHANNEL")}`]
        .filter(Boolean)
        .join("\n"),
    )
    .setTimestamp(new Date())
    .setFooter({ text: `Channel ID: ${channel.id}` })
    .setColor(genColor(0));

  await logChannel(channel.guild, { embeds: [embed] });
}
