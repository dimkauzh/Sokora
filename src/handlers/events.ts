import { Events, type Client, type GuildAuditLogsEntry, type Message } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import createAuditLogHandler from "events/guildAuditLogEntryCreate";
import { readdirSync } from "fs";
import { join } from "path";
import { client } from "src/bot";
import { pathToFileURL } from "url";

const events = [];
export async function loadEvents(client: Client) {
  const eventsPath = join(process.cwd(), "src", "events");

  for (const eventFile of readdirSync(eventsPath)) {
    if (!eventFile.endsWith("ts")) continue;

    const eventName = eventFile.split(".ts")[0];
    if (eventName == "guildAuditLogEntryCreate") {
      events.push({
        name: eventName,
        event: client.on(Events.GuildAuditLogEntryCreate, createAuditLogHandler(client)),
      });
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
export const easterEggNames: string[] = [];
export async function loadEasterEggs() {
  const eventsPath = join(process.cwd(), "src", "events", "easterEggs");

  try {
    for (const easterEggFile of readdirSync(eventsPath)) {
      if (!easterEggFile.endsWith(".ts")) continue;

      try {
        const easterEggName = easterEggFile.split(".")[0];
        const eggModule = await import(pathToFileURL(join(eventsPath, easterEggFile)).toString());
        if (typeof eggModule.run != "function") {
          await errorEmbed({
            client,
            title: `Easter egg ${easterEggFile} does not have a run function.`,
            log: true,
            forward: true,
          });
          continue;
        }

        const easterEgg: EasterEgg = {
          name: easterEggName,
          run: async (message: Message) => {
            return await eggModule.run(message);
          },
        };

        easterEggs.push(easterEgg);
        easterEggNames.push(easterEggName);
      } catch (error) {
        return await errorEmbed({
          client,
          error,
          title: `Error loading easter egg ${easterEggFile}`,
          log: true,
          forward: true,
        });
      }
    }
  } catch (error) {
    return await errorEmbed({
      client,
      error,
      title: `Error loading easter eggs.`,
      log: true,
      forward: true,
    });
  }
}

export interface AuditEvent {
  name: string;
  run: (auditEntry: GuildAuditLogsEntry, client: Client) => Promise<void>;
}

export const auditEvents: AuditEvent[] = [];
export const auditEventNames: string[] = ["messageUpdate"];
export async function loadAuditEvents(client: Client) {
  const eventsPath = join(process.cwd(), "src", "events", "auditLogs");

  try {
    for (const auditEventFile of readdirSync(eventsPath)) {
      if (!auditEventFile.endsWith(".ts")) continue;
      const fullPath = join(eventsPath, auditEventFile);

      try {
        const auditEventName = auditEventFile.split(".")[0];
        const auditEventModule = await import(pathToFileURL(fullPath).toString());
        if (typeof auditEventModule.run != "function") {
          await errorEmbed({
            client,
            title: `Audit log event ${auditEventFile} does not have a run function.`,
            log: true,
            forward: true,
          });
          continue;
        }

        const auditEvent: AuditEvent = {
          name: auditEventName,
          run: async (auditEntry: GuildAuditLogsEntry, client: Client) => {
            return await auditEventModule.run(auditEntry, client);
          },
        };

        auditEvents.push(auditEvent);
        if (auditEventName != "messageBulkDelete") auditEventNames.push(auditEventName);
      } catch (error) {
        return await errorEmbed({
          client,
          error,
          title: `Error loading audit log event ${auditEventFile}.`,
          log: true,
          forward: true,
        });
      }
    }
  } catch (error) {
    return await errorEmbed({
      client,
      error,
      title: `Error loading audit log events.`,
      log: true,
      forward: true,
    });
  }
}
