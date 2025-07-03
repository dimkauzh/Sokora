import { ShardingManager } from "discord.js";

const manager = new ShardingManager("./src/bot.ts", { token: process.env.TOKEN });

manager.on("shardCreate", shard => {
  shard.on("error", error => console.error(error));
  console.log(`Launched shard ${shard.id}!`);
  if (process.env.ENABLE_META_FETCHING === "true") console.warn("<meta> tag fetching is enabled; tread lightly!");
});

await manager.spawn();