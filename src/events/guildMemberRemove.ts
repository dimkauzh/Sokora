import { EmbedBuilder, type GuildMember, type TextChannel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { imageColor } from "../utils/imageColor";
import { replaceCodes } from "../utils/replace";
import { Event } from "../utils/types";

export default (async function run(member: GuildMember) {
  const guildID = member.guild.id;
  const id = getSetting(guildID, "welcome", "channel") as string;
  if (!id) return;
  const user = member.user;
  const avatar = member.displayAvatarURL();

  const channel = (await member.guild.channels.cache
    .find(channel => channel.id == id)
    ?.fetch()) as TextChannel;

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${member.user.displayName} has left.`, iconURL: avatar })
    .setDescription(
      await replaceCodes(getSetting(guildID, "welcome", "join_text") as string, member.guild, user),
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setThumbnail(avatar)
    .setColor(member.user.hexAccentColor ?? (await imageColor(undefined, avatar)) ?? genColor(200));

  await channel.send({ embeds: [embed] });
} as Event<"guildMemberRemove">);
