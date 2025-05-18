import { Client } from "discord.js";
import ms from "ms";
import { checkAutokicks } from "./autokick";

export async function initializeTasks(client: Client) {
  await checkAutokicks(client);
  setInterval(() => checkAutokicks(client), ms("1h"));
}
