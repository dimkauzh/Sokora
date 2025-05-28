import { AuditLogEvent, Client, GuildAuditLogsEntry } from "discord.js";
// import { genColor } from "../../utils/colorGen";
// import { getSetting } from "../../utils/database/settings";
// import { logChannel } from "../../utils/logChannel";
// import { errorEmbed } from "../../utils/embeds/errorEmbed";

export async function run(auditEntry: GuildAuditLogsEntry<AuditLogEvent.MessageDelete>, client: Client) {
  // console.log("audit: ", Date.now());
  const author = await client.users.fetch(auditEntry.targetId!).catch(() => null);
  const executor = await client.users.fetch(auditEntry.executorId!).catch(() => null);
  console.log(author?.displayName, executor?.displayName);

  /*
  if (!author)
    return await errorEmbed({
      title: "Cannot log deleted message.",
      reason: `Message ${message} lacks an author.`,
      client,
    });

  if (author.bot) return;
  const guild = message.guild;
  if (!guild)
    return await errorEmbed({
      title: "Cannot log deleted message.",
      reason: `Message ${message} lacks the guild.`,
      client,
    });

  if (!getSetting(guild.id, "moderation", "log_messages")) return;
  const value = message.content && message.content.length > 0 ? message.content : "*Empty message*";
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName}'s message has been deleted.`,
      iconURL: author.displayAvatarURL(),
    })
    .setDescription(
      `[Jump to message](${message.url}) • [See ${author.displayName}'s profile](https://discord.com/users/${author.id})`,
    )
    .setTimestamp(new Date())
    .addFields({
      name: "🗑️ • Deleted message",
      value,
    })
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(0));

  await logChannel(guild, { embeds: [embed] });
  */
};
