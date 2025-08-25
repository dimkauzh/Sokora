import { getLevel, setLevel } from "database/leveling";
import { getSetting } from "database/settings";
import { EmbedBuilder, type TextChannel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { easterEggs } from "handlers/events";
import { channelCheck } from "utils/channelCheck";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { kominator } from "utils/kominator";
import { mention } from "utils/mention";
import { safeChannel } from "utils/safeChannel";
import { Event } from "utils/types";

const cooldowns = new Map<string, number>();
export default (async function run(message) {
  const client = message.client;
  const author = message.author;
  if (author.bot) return;
  const guild = message.guild!;
  const avatar = author.displayAvatarURL();

  if (await getSetting(guild.id, "easter", "enabled")) {
    const enabledEggs = (await getSetting(guild.id, "easter", "enabled_eggs")) as string;
    const allowedChannels = (await getSetting(guild.id, "easter", "allowed_channels")) as string;
    const isChannelAllowed =
      !allowedChannels || kominator(allowedChannels).includes(message.channel.id);

    if (isChannelAllowed) {
      for (const easterEgg of easterEggs) {
        const shouldRunEgg = !enabledEggs || kominator(enabledEggs).includes(easterEgg.name);

        if (!shouldRunEgg) continue;
        try {
          if (typeof easterEgg.run != "function") {
            await errorEmbed({
              client,
              title: `Easter egg ${easterEgg.name} does not have a valid run function: ${easterEgg}.`,
              log: true,
              forward: true,
              fileName: "messageCreate.ts",
            });
            continue;
          }

          if (Math.random() <= 0.15) await easterEgg.run(message);
        } catch (error) {
          return await errorEmbed({
            client,
            error,
            title: `Error running easter egg ${easterEgg.name}.`,
            log: true,
            forward: true,
            fileName: "messageCreate.ts",
          });
        }
      }
    }
  }

  if (!(await getSetting(guild.id, "leveling", "enabled"))) return;
  const blockedChannels = (await getSetting(guild.id, "leveling", "block_channels")) as string;
  if (blockedChannels != undefined)
    for (const channelID of kominator(blockedChannels)) if (message.channelId == channelID) return;

  const cooldown = (await getSetting(guild.id, "leveling", "cooldown")) as number;
  if (cooldown > 0) {
    const key = `${guild.id}-${author.id}`;
    const lastExpTime = cooldowns.get(key) || 0;
    const now = Date.now();

    if (now - lastExpTime < cooldown * 1000) return;
    cooldowns.set(key, now);
  }

  const xpGain = (await getSetting(guild.id, "leveling", "xp_gain")) as number;
  const levelChannelId = await getSetting(guild.id, "leveling", "channel");
  const difficulty = (await getSetting(guild.id, "leveling", "difficulty")) as number;
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
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${author.displayName} leveled up!`,
      iconURL: avatar,
    })
    .setDescription(
      [
        `**Congratulations, ${author.displayName}**!`,
        `You made it to **level ${newLevelData.level}**.`,
        `You need ${
          100 * difficulty * (newLevelData.level + 1) ** 2 -
          80 * difficulty * newLevelData.level ** 2
        } XP to level up again.`,
      ].join("\n"),
    )
    .setTimestamp()
    .setColor(genColor(200));

  if (levelChannelId) {
    const channel = (await safeChannel(guild, `${levelChannelId}`)) as TextChannel;
    if (
      await channelCheck({
        channel,
        guild,
        permType: "Send",
        setting: { category: "leveling", setting: "channel" },
      })
    )
      await channel.send({
        embeds: [embed],
        content: mention(author.id, "USER"),
      });
  }
} as Event<"messageCreate">);
