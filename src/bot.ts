import { Api } from "@top-gg/sdk";
import { Chart, registerables } from "chart.js";
import { getUserSetting, getUserSettingsTable } from "database/userSettings";
import { ActivityType, Client, Partials } from "discord.js";
import { registerGuildCommands } from "handlers/commands";
import { loadAuditEvents, loadEasterEggs, loadEvents } from "handlers/events";
import { leavePlease } from "utils/leavePlease";
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

client.once("ready", async () => {
  function hasToken(token: any): token is string {
    return token && token !== "" && token !== "YOUR_TOPGG_TOKEN";
  }
  if (!hasToken(process.env.TOPGG_TOKEN)) throw new Error("No TOP.GG token");
  const topgg = new Api(process.env.TOPGG_TOKEN);

  if (process.env.ENABLE_TOPGG == "true") {
    if (!hasToken(process.env.TOPGG_TOKEN)) {
      console.log(
        "You haven't set your top.gg token.\nPlease set it as part of your environment variables, or disable the top.gg autoposter entirely, and relaunch Sokora.",
      );
      process.exit(1);
    }

    try {
      await topgg.postStats({
        serverCount: (await client.guilds.fetch()).size,
      });
      console.log("Posted statistics to top.gg!");
    } catch (error) {
      console.error("Failed to start top.gg autoposter:", error);
    }
  }

  const guilds = client.guilds.cache;
  for (const id of guilds.keys())
    await leavePlease(guilds.get(id)!, await guilds.get(id)!.fetchOwner()!, "Not like that.");

  // get all currently subscribed users (once per restart)
  const subscribedUsers = new Set(
    (await getUserSettingsTable("topgg", "remind"))?.filter(i => i.value == "1").map(i => i.userID),
  );

  // instead of running getUserSettingsTable() again,
  // we just listen to new  and update the Set
  // and HOPEFULLY this will work
  client.on("interactionCreate", async i => {
    if (!i.isChatInputCommand()) return;
    if (await getUserSetting(i.user.id, "topgg", "remind")) subscribedUsers.add(i.user.id);
  });

  client.on("guildMemberRemove", async user => {
    subscribedUsers.delete(user.id);
  });

  setInterval(async () => {
    for (const user of subscribedUsers) {
      if (await topgg.hasVoted(user)) continue;
      console.debug(`reminding ${user} to vote on top.gg`);
      await client.users.send(
        JSON.parse(user),
        "Reminder that **you can vote for Sokora** on [top.gg](https://top.gg/bot/873918300726394960/vote) - go vote!!",
      );
    }
  }, 3600000); // 1h

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
