import { calculateLevel, getUserXp, getXpForNextLevel, setUserXp } from "database/leveling";
import { getSetting } from "database/settings";
import { EmbedBuilder, type TextChannel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { easterEggs } from "handlers/events";
import { channelCheck } from "utils/channelCheck";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { kominator } from "utils/kominator";
import { mention } from "utils/mention";
import { safeChannel } from "utils/safeThings";
import { Event } from "utils/types";

const cooldowns = new Map<string, number>();
export default (async function run(message) {
  const author = message.author;
  const guild = message.guild;
  if (author.bot) return;
  if (!guild) return;

  if (await getSetting(guild.id, "easter", "enabled")) {
    const enabledEggs = (await getSetting(guild.id, "easter", "enabled_eggs")) as string;
    const allowedChannels = (await getSetting(guild.id, "easter", "allowed_channels")) as string;

    if (!allowedChannels || kominator(allowedChannels).includes(message.channel.id))
      for (const easterEgg of easterEggs) {
        if (!(!enabledEggs || kominator(enabledEggs).includes(easterEgg.name))) continue;
        try {
          if (typeof easterEgg.run == "function")
            if (Math.random() <= 0.15) await easterEgg.run(message);
        } catch (error) {
          return await errorEmbed({
            client: message.client,
            error,
            title: `Error running easter egg ${easterEgg.name}.`,
            log: true,
            forward: true,
            fileName: "messageCreate.ts",
          });
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
    const now = Date.now();
    if (now - (cooldowns.get(key) || 0) < cooldown * 1000) return;
    cooldowns.set(key, now);
  }

  const xpGain = (await getSetting(guild.id, "leveling", "xp_gain")) as number;
  const difficulty = (await getSetting(guild.id, "leveling", "difficulty")) as number;
  const levelChannelId = await getSetting(guild.id, "leveling", "channel");
  const xp = getUserXp(guild.id, author.id);
  const newXp = xp + xpGain;
  setUserXp(guild.id, author.id, newXp);
  const newLevel = calculateLevel({ xp: newXp, difficulty });
  if (newLevel <= calculateLevel({ xp, difficulty })) return;
  const avatar = author.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${author.displayName} leveled up!`,
      iconURL: avatar,
    })
    .setDescription(
      [
        `**Congratulations, ${author.displayName}**!`,
        `You made it to **level ${newLevel}**.`,
        `You need ${await getXpForNextLevel(guild.id, author.id)} XP to level up again.`,
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
