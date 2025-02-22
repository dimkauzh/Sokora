import type { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

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

export let easterEggs: any[] = [];
export async function loadEasterEggs() {
  const eventsPath = join(process.cwd(), "src", "events", "easterEggs");

  for (const easterEggFile of readdirSync(eventsPath)) {
    const easterEgg = await import(pathToFileURL(join(eventsPath, easterEggFile)).toString());
    easterEggs.push(easterEgg);
  }
}
