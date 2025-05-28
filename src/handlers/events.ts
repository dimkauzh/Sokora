import type { Client, GuildAuditLogsEntry, Message } from "discord.js";
import { Events } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { client } from "../bot.ts";
import { errorEmbed } from "../utils/embeds/errorEmbed.ts";
import createAuditLogHandler from "../events/guildAuditLogEntryCreate.ts";

const events = [];
export async function loadEvents(client: Client) {
  const eventsPath = join(process.cwd(), "src", "events");

  for (const eventFile of readdirSync(eventsPath)) {
    if (!eventFile.endsWith("ts")) continue;

    const eventName = eventFile.split(".ts")[0];

    if (eventName === "guildAuditLogEntryCreate") {
      const event = createAuditLogHandler(client);
      const clientEvent = client.on(Events.GuildAuditLogEntryCreate, event);

      events.push({ name: eventName, event: clientEvent });
      continue;
    }

    const event = (await import(pathToFileURL(join(eventsPath, eventFile)).toString())).default;
    const clientEvent = client.on(eventName, event);

    events.push({ name: eventName, event: clientEvent });
  }
}

export interface EasterEgg {
  name: string;
  run: (message: Message) => Promise<void>;
}

export const easterEggs: EasterEgg[] = [];
export async function loadEasterEggs() {
  const eventsPath = join(process.cwd(), "src", "events", "easterEggs");

  try {
    for (const easterEggFile of readdirSync(eventsPath)) {
      if (!easterEggFile.endsWith(".ts")) continue;

      try {
        const eggModule = await import(pathToFileURL(join(eventsPath, easterEggFile)).toString());
        if (typeof eggModule.run !== "function") {
          await errorEmbed({
            client,
            title: `Easter egg ${easterEggFile} does not have a run function.`,
            forward: true,
          });
          continue;
        }

        const easterEgg: EasterEgg = {
          name: easterEggFile.split(".")[0],
          run: async (message: Message) => {
            return await eggModule.run(message);
          },
        };

        easterEggs.push(easterEgg);
      } catch (error) {
        return await errorEmbed({
          client,
          error,
          title: `Error loading easter egg ${easterEggFile}`,
          forward: true,
        });
      }
    }
  } catch (error) {
    return await errorEmbed({ client, error, title: `Error loading easter eggs.`, forward: true });
  }
}


export interface AuditEvent {
  name: string;
  run: (auditEntry: GuildAuditLogsEntry, client: Client) => Promise<void>;
}

export let auditEvents: AuditEvent[] = [];
export async function loadAuditEvents(client: Client) {
  const eventsPath = join(process.cwd(), "src", "events", "auditLogs");
  try {
    const files = readdirSync(eventsPath);
    for (const auditEventFile of files) {
      if (!auditEventFile.endsWith(".ts")) {
        continue;
      }

      const fullPath = join(eventsPath, auditEventFile);
      try {
        const auditEventModule = await import(pathToFileURL(fullPath).toString());

        if (typeof auditEventModule.run !== "function") {
          await errorEmbed({
            title: `Audit log event ${auditEventFile} does not have a run function, please fix this`,
            forward: true,
            client: client,
          });
          continue;
        }

        const auditEventName = auditEventFile.split(".")[0];

        const auditEvent: AuditEvent = {
          name: auditEventName,
          run: async (auditEntry: GuildAuditLogsEntry, client: Client) => {
            return await auditEventModule.run(auditEntry, client);
          },
        };
        
        auditEvents.push(auditEvent);
      } catch (error) {
        await errorEmbed({
          title: `Error loading audit log event ${auditEventFile}`,
          error: error,
          forward: true,
          client: client,
        });
      }
    }
  } catch (error) {
    await errorEmbed({ title: `Error loading audit log events`, error: error, forward: true, client: client });
  }
}
