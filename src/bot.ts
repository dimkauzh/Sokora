import { ActivityType, Client } from "discord.js";
import { registerGuildCommands } from "./handlers/commands";
import { loadEasterEggs, loadEvents } from "./handlers/events";
import { leavePlease } from "./utils/leavePlease";
import { rescheduleUnbans } from "./utils/unbanScheduler";

const client = new Client({
  presence: {
    activities: [{ name: "your feedback!", type: ActivityType.Listening }],
  },
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "GuildEmojisAndStickers",
    "GuildBans",
    "MessageContent",
  ],
});

client.on("ready", async () => {
  const guilds = client.guilds.cache;
  for (const id of guilds.keys())
    await leavePlease(guilds.get(id)!, await guilds.get(id)?.fetchOwner()!, "Not like that.");

  await loadEvents(client);
  await loadEasterEggs();
  // uncomment if you want to remove guild/global commands or register guild/global commands
  // await removeGuildCommands(client);
  // await removeGlobalCommands(client);
  await registerGuildCommands(client);
  // await registerGlobalCommands(client);
  console.log("ちーっす！");
  rescheduleUnbans(client);
});

client.login(process.env.TOKEN);
