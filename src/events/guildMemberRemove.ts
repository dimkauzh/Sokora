import { EmbedBuilder, type GuildMember, type TextChannel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { imageColor } from "../utils/imageColor";
import { replace } from "../utils/replace";
import { Event, Replacements } from "../utils/types";

export default (async function run(member: GuildMember) {
  const guildID = member.guild.id;
  const id = getSetting(guildID, "welcome", "channel") as string;
  if (!id) return;
  const user = member.user;
  const avatar = member.displayAvatarURL();
  const replacement: Replacements = [
    { text: "(name)", replacement: user.displayName },
    { text: "(count)", replacement: member.guild.memberCount },
    { text: "(servername)", replacement: member.guild.name },
    { text: "(serverowner)", replacement: (await member.guild.fetchOwner()).displayName },
    { text: "(currentdate)", replacement: `<t:${Math.floor(Date.now() / 1000)}>` },
  ];

  const channel = (await member.guild.channels.cache
    .find(channel => channel.id == id)
    ?.fetch()) as TextChannel;

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${member.user.displayName} has left.`, iconURL: avatar })
    .setDescription(replace(getSetting(guildID, "welcome", "join_text") as string, replacement))
    .setFooter({ text: `User ID: ${member.id}` })
    .setThumbnail(avatar)
    .setColor(member.user.hexAccentColor ?? (await imageColor(undefined, avatar)) ?? genColor(200));

  await channel.send({ embeds: [embed] });
} as Event<"guildMemberRemove">);
