import { EmbedBuilder, type GuildMember, type TextChannel } from "discord.js";
import { genColor, genImageColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { replaceVariables } from "../utils/replace";
import { Event } from "../utils/types";

export default (async function run(member: GuildMember) {
  const guildID = member.guild.id;
  const id =
    (await getSetting(guildID, "welcome", "leave_channel") as string) ??
    (await getSetting(guildID, "welcome", "join_channel") as string);
  if (!id) return;
  const user = member.user;
  const avatar = member.displayAvatarURL();

  const channel = (await member.guild.channels.cache
    .find(channel => channel.id == id)
    ?.fetch()) as TextChannel;

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${member.user.displayName} has left`, iconURL: avatar })
    .setDescription(
      await replaceVariables(
        await getSetting(guildID, "welcome", "leave_text") as string,
        member.guild,
        user,
      ),
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setThumbnail(avatar)
    .setColor(
      member.user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(200),
    );

  await channel.send({ embeds: [embed] });
} as Event<"guildMemberRemove">);
