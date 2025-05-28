import { auditEvents } from "../handlers/events.ts";
//import { logChannel } from "../utils/logChannel.ts";
import { Event } from "../utils/types";
import { errorEmbed } from "../utils/embeds/errorEmbed.ts";
import { AuditLogEvent, Client, GuildAuditLogsEntry } from "discord.js";
import { capitalize } from "../utils/capitalize.ts";

export default function createAuditLogHandler(client: Client) {
    return async function(auditEntry: GuildAuditLogsEntry) {
        const auditEventPos = auditEvents.findIndex(event => AuditLogEvent[capitalize(event.name) as keyof typeof AuditLogEvent] === auditEntry.action);
        
        if (auditEventPos != -1) {
            const auditEventName = auditEvents[auditEventPos].name;
            try {
                if (typeof auditEvents[auditEventPos].run !== "function") {
                    await errorEmbed({
                        title: `Audit log event ${auditEventName} does not have a valid run function`,
                        client: client,
                        forward: true,
                    });
                }
                
                await auditEvents[auditEventPos].run(auditEntry, client);
            } catch (error) {
                await errorEmbed({
                    title: `Error running audit log event ${auditEventName}`,
                    client: client,
                    error: error,
                    forward: true,
                });
            }
        }
    } as Event<"guildAuditLogEntryCreate">
};
