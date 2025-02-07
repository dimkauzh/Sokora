import { EmbedBuilder } from "discord.js";
import { commands } from "../handlers/commands";
import { genColor } from "../utils/colorGen";
import { check } from "../utils/database/blocklist";
import { leavePlease } from "../utils/leavePlease";
import { replace } from "../utils/replace";
import { Event } from "../utils/types";

export default (async function run(guild) {
  const owner = await guild.fetchOwner();
  if (!check(owner.id)) return await leavePlease(guild, owner, "No.");

  const client = guild.client;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Welcome to ${client.user.username}!`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setDescription(
      [
        "Sokora is a multipurpose Discord bot that lets you manage your servers easily.",
        "To manage the bot, use the **/settings** command.\n",
        "Sokora is in an early stage of development. If you find bugs, please go to our [official server](https://discord.gg/c6C25P4BuY) and report them.",
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setThumbnail(client.user.displayAvatarURL())
    .setColor(genColor(200));

  await guild.commands.set(commands.map(command => command.data));
  try {
    const welcomeChannel = guild.systemChannel;
    if (!welcomeChannel) return;
    if (!welcomeChannel.permissionsFor(guild.client.user)?.has("SendMessages")) return;
    await welcomeChannel.send({ embeds: [embed] });
  } catch (e) {
    console.log(e);
  }
} as Event<"guildCreate">);
