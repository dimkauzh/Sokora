import type { Client, Message } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { client } from "../bot.ts";
import { errorEmbed } from "../utils/embeds/errorEmbed.ts";

const events = [];
export async function loadEvents(client: Client) {
  const eventsPath = join(process.cwd(), "src", "events");

  for (const eventFile of readdirSync(eventsPath)) {
    if (!eventFile.endsWith("ts")) continue;

    const event = (await import(pathToFileURL(join(eventsPath, eventFile)).toString())).default;
    const eventName = eventFile.split(".ts")[0];
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
    return await errorEmbed({ client, error, title: `Error loading easter eggs`, forward: true });
  }
}
