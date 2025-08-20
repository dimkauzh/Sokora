import { EmbedBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { commands } from "handlers/commands";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { replace } from "utils/replace";
import type { Event } from "utils/types";

export default (async function run(guild) {
  const client = guild.client;
  const avatar = client.user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}Welcome to ${client.user.username}!`,
      iconURL: avatar,
    })
    .setDescription(
      [
        "Sokora is a multipurpose Discord bot that lets you manage your servers easily.",
        "To configure the bot, use the **/settings** command.\n",
        "Sokora is in an early stage of development. If you find bugs, please go to our [official server](https://discord.gg/c6C25P4BuY).",
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(genColor(200));

  await guild.commands.set(commands.map(command => command.data));
  try {
    const welcomeChannel = guild.systemChannel;
    if (!welcomeChannel) return;
    if (!welcomeChannel.permissionsFor(guild.client.user)?.has("SendMessages")) return;
    await welcomeChannel.send({ embeds: [embed] });
  } catch (error) {
    return await errorEmbed({
      client,
      error,
      log: true,
      forward: true,
      fileName: "guildCreate.ts",
    });
  }
} as Event<"guildCreate">);
