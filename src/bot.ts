import { Chart, registerables } from "chart.js";
import { ActivityType, Client } from "discord.js";
import { registerGuildCommands } from "./handlers/commands";
import { loadEasterEggs, loadAuditEvents, loadEvents } from "./handlers/events";
import { leavePlease } from "./utils/leavePlease";
import { rescheduleUnbans } from "./utils/unbanScheduler";

export const client = new Client({
  presence: {
    activities: [{ name: "your feedback!", type: ActivityType.Listening }],
  },
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "GuildModeration",
    "GuildEmojisAndStickers",
    "GuildBans",
    "GuildMessageReactions",
    "MessageContent",
  ],
});

client.once("ready", async () => {
  const guilds = client.guilds.cache;
  for (const id of guilds.keys())
    await leavePlease(guilds.get(id)!, await guilds.get(id)!.fetchOwner()!, "Not like that.");

  await loadEvents(client);
  await loadEasterEggs();
  await loadAuditEvents(client);
  // uncomment if you want to remove guild/global commands or register guild/global commands
  // await removeGuildCommands(client);
  // await removeGlobalCommands(client);
  await registerGuildCommands(client);
  // await registerGlobalCommands(client);

  Chart.register(...registerables);
  await rescheduleUnbans(client);
  console.log(Math.random() < 0.001 ? "こんにちは! (konichi whats upppppppp)" : "ちーっす！");
});

await client.login(process.env.TOKEN);
