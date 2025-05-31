import { getSetting } from "database/settings";
import { AuditLogEvent, Client, GuildAuditLogsEntry, User } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { guild } from "events/messageDelete";

// todo: somehow make this work with messagedelete
export let executor: Promise<User | null>;
export async function run(
  auditEntry: GuildAuditLogsEntry<AuditLogEvent.MessageDelete>,
  client: Client,
) {
  try {
    /*
    console.log("hey");
    console.log(auditEntry.targetId);
    console.log(auditEntry.executorId);
    */

    if (!(await getSetting(guild!.id, "moderation", "log_messages"))) return;
    const target = await client.users.fetch(auditEntry.targetId!);
    executor = client.users.fetch(auditEntry.executorId!);

    if (target?.bot) return;
    if (target?.id == (await executor)?.id) return;
    // console.log(target?.displayName, executor?.displayName);
  } catch (error) {
    return await errorEmbed({ client, error, log: true, forward: true });
  }
}
