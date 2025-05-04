import type { Client, Message } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { errorEmbed } from "../utils/embeds/errorEmbed.ts";

let events = [];
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

export let easterEggs: EasterEgg[] = [];
export async function loadEasterEggs() {
  const eventsPath = join(process.cwd(), "src", "events", "easterEggs");

  try {
    const files = readdirSync(eventsPath);

    for (const easterEggFile of files) {
      if (!easterEggFile.endsWith(".ts")) {
        continue;
      }

      const fullPath = join(eventsPath, easterEggFile);

      try {
        const eggModule = await import(pathToFileURL(fullPath).toString());

        if (typeof eggModule.run !== 'function') {
          await errorEmbed({
            title: `Easter egg ${easterEggFile} does not have a run function, please fix this`,
            forward: true
          });
          continue;
        }

        const eggName = easterEggFile.split(".")[0];

        const easterEgg: EasterEgg = {
          name: eggName,
          run: async (message: Message) => {
            return await eggModule.run(message);
          }
        };

        easterEggs.push(easterEgg);
      } catch (error) {
        await errorEmbed({ title: `Error loading easter egg ${easterEggFile}`, error: error, forward: true });
      }
    }
  } catch (error) {
    await errorEmbed({ title: `Error loading easter eggs`, error: error, forward: true});
  }
}
