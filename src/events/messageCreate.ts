import { EmbedBuilder, type TextChannel } from "discord.js";
import { easterEggs } from "../handlers/events.ts";
import { genColor } from "../utils/colorGen";
import { add, check, remove } from "../utils/database/blocklist";
import { getLevel, setLevel } from "../utils/database/leveling";
import { getSetting } from "../utils/database/settings";
import { kominator } from "../utils/kominator";
import { leavePlease } from "../utils/leavePlease";
import { Event } from "../utils/types";

const cooldowns = new Map<string, number>();
export default (async function run(message) {
  if (message.content.startsWith("!SYSTEM")) {
    if (message.author.id != process.env.OWNER) return;
    let args = message.content.split(" ");

    if (!args[2]) return message.reply("ERROR: Expected three arguments");
    const username = (await message.client.users.fetch(args[2])).username;
    switch (args[1]) {
      case "add": {
        add(args[2]);
        await message.reply(`${username} has been blocklisted from Sokora.`);

        const guilds = message.client.guilds.cache;
        for (const id of guilds.keys())
          await leavePlease(guilds.get(id)!, await guilds.get(id)?.fetchOwner()!, "No.");
        break;
      }
      case "remove":
        remove(args[2]);
        await message.reply(`${username} has been removed from the Sokora blocklist.`);
        break;
      case "check":
        await message.reply(`${!check(args[2])}`);
        break;
      default:
        await message.reply(
          "Hello, this is the system interface to control top level Sokora moderation utilities."
        );
    }
  }

  const author = message.author;
  if (author.bot) return;
  if (!check(author.id)) return;
  const guild = message.guild!;

  // Easter egg handler
  if (getSetting(guild.id, "easter", "enabled"))
    for (const easterEgg of easterEggs) easterEgg.run(message);

  // Leveling
  if (!getSetting(guild.id, "leveling", "enabled")) return;

  const blockedChannels = getSetting(guild.id, "leveling", "block_channels") as string;
  if (blockedChannels != undefined)
    for (const channelID of kominator(blockedChannels)) if (message.channelId == channelID) return;

  const cooldown = getSetting(guild.id, "leveling", "cooldown") as number;
  if (cooldown > 0) {
    const key = `${guild.id}-${author.id}`;
    const lastExpTime = cooldowns.get(key) || 0;
    const now = Date.now();

    if (now - lastExpTime < cooldown * 1000) return;
    else cooldowns.set(key, now);
  }

  const xpGain = getSetting(guild.id, "leveling", "xp_gain") as number;
  const levelChannelId = getSetting(guild.id, "leveling", "channel");
  const difficulty = getSetting(guild.id, "leveling", "difficulty") as number;
  const [level, xp] = getLevel(guild.id, author.id);
  const newLevelData = { level: level ?? 0, xp: xp + xpGain };

  while (
    newLevelData.xp <
    100 * difficulty * (newLevelData.level + 1) ** 2 - 80 * difficulty * newLevelData.level ** 2
  )
    newLevelData.level--;

  while (
    newLevelData.xp >=
    100 * difficulty * (newLevelData.level + 1) ** 2 - 80 * difficulty * newLevelData.level ** 2
  )
    newLevelData.level++;

  setLevel(guild.id, author.id, newLevelData.level, newLevelData.xp);
  if (newLevelData.level == level || newLevelData.level < level) return;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `•  ${author.displayName} has levelled up!`,
      iconURL: author.displayAvatarURL()
    })
    .setDescription(
      [
        `**Congratulations, ${author.displayName}**!`,
        `You made it to **level ${newLevelData.level}**.`,
        `You need ${100 * difficulty * (newLevelData.level + 1) ** 2 - 80 * difficulty * newLevelData.level ** 2} XP to level up again.`
      ].join("\n")
    )
    .setThumbnail(author.displayAvatarURL())
    .setTimestamp()
    .setColor(genColor(200));

  if (levelChannelId)
    (guild.channels.cache.get(`${levelChannelId}`) as TextChannel).send({
      embeds: [embed],
      content: `<@${author.id}>`
    });
} as Event<"messageCreate">);
