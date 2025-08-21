import { Api } from "@top-gg/sdk";
import { Chart, registerables } from "chart.js";
import { getUserSettingsTable } from "database/userSettings";
import { ActivityType, Client, Partials } from "discord.js";
import { registerGuildCommands } from "handlers/commands";
import { loadAuditEvents, loadEasterEggs, loadEvents } from "handlers/events";
import ms from "enhanced-ms";
import { rescheduleUnbans } from "utils/unbanScheduler";

export const client = new Client({
  presence: {
    activities: [{ name: "your feedback!", type: ActivityType.Listening }],
  },
  partials: [Partials.Message, Partials.Reaction, Partials.User],
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

export const subscribedUsers = new Set(
  (await getUserSettingsTable("topgg", "remind"))?.filter(i => i.value == "1").map(i => i.userID),
);

client.once("ready", async () => {
  if (process.env.TOPGG_TOKEN)
    setInterval(async () => {
      const topgg = new Api(process.env.TOPGG_TOKEN!);
      try {
        await topgg.postStats({
          serverCount: (await client.guilds.fetch()).size,
        });
        console.log("Posted statistics to top.gg!");
      } catch (error) {
        console.error(`Failed to start top.gg autoposter: ${error}`);
      }

      for (const user of subscribedUsers) {
        if (await topgg.hasVoted(user)) continue;
        await client.users.send(
          JSON.parse(user),
          "Reminder that **you can vote for Sokora** on [top.gg](https://top.gg/bot/873918300726394960/vote) - go vote!!",
        );
      }
    }, ms("6h"));

  await Promise.all([
    loadEvents(client),
    loadEasterEggs(),
    loadAuditEvents(client),
    registerGuildCommands(client),
    rescheduleUnbans(client),
  ]).then(() =>
    console.log(Math.random() < 0.001 ? "こんにちは! (konichi whats upppppppp)" : "ちーっす！"),
  );

  // if you want to register/remove guild/global commands, replace registerGuildCommands() with:
  // removeGuildCommands(client)
  // removeGlobalCommands(client)
  // registerGlobalCommands(client)
  Chart.register(...registerables);
});

await client.login(process.env.TOKEN);
