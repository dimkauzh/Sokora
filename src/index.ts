import { ShardingManager } from "discord.js";
import { AutoPoster } from "topgg-autoposter";

const manager = new ShardingManager("./src/bot.ts", { token: process.env.TOKEN });

if (process.env.ENABLE_TOPGG === "true") {
  if (!process.env.TOPGG_TOKEN || process.env.TOPGG_TOKEN === "" || process.env.TOPGG_TOKEN === "YOUR_TOPGG_TOKEN") {
    console.log("You haven't set your top.gg token.");
    console.log("Please set it as part of your environment variables, or disable the top.gg autoposter entirely, and relaunch Sokora.")
    process.exit(1);
  }

  try {
    const epicAutoPoster = AutoPoster(process.env.TOPGG_TOKEN, manager);

    epicAutoPoster.on('posted', () => {
      console.log('Posted statistics to top.gg!')
    });
  } catch (error) {
    console.error("Failed to start top.gg autoposter:", error);
  }
}

manager.on("shardCreate", shard => {
  shard.on("error", error => console.error(error));
  console.log(`Launched shard ${shard.id}!`);
});

await manager.spawn();