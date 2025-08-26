import { type Client, type Message } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
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
    const event = (await import(pathToFileURL(join(eventsPath, eventFile)).toString())).default;
    events.push({ name: eventName, event: client.on(eventName, event) });
  }
}

interface EasterEgg {
  name: string;
  run: (message: Message) => Promise<void>;
}

export const easterEggs: EasterEgg[] = [];
export const easterEggNames: string[] = [];
export async function loadEasterEggs() {
  const eventsPath = join(process.cwd(), "src", "events", "easterEggs");
  for (const easterEggFile of readdirSync(eventsPath)) {
    if (!easterEggFile.endsWith(".ts")) continue;
    try {
      const easterEggName = easterEggFile.split(".")[0];
      const eggModule = await import(pathToFileURL(join(eventsPath, easterEggFile)).toString());
      if (typeof eggModule.run == "function") {
        const easterEgg: EasterEgg = {
          name: easterEggName,
          run: async (message: Message) => {
            return await eggModule.run(message);
          },
        };

        easterEggs.push(easterEgg);
        easterEggNames.push(easterEggName);
      }
    } catch (error) {
      return await errorEmbed({
        client,
        error,
        title: `Error loading easter egg ${easterEggFile}.`,
        log: true,
        forward: true,
        fileName: "events.ts",
      });
    }
  }
}
