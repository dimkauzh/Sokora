import { ShardingManager } from "discord.js";
import { client } from "./bot";
import { errorEmbed } from "./utils/embeds/errorEmbed";

const manager = new ShardingManager("./src/bot.ts", { token: process.env.TOKEN });
manager.on("shardCreate", shard => {
  shard.on("error", async error => await errorEmbed({ client, error, forward: true }));
  console.log(`Launched shard ${shard.id}!`);
});

await manager.spawn();
