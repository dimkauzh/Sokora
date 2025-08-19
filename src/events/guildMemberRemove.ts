import { getSetting } from "database/settings";
import { EmbedBuilder, type GuildMember, type TextChannel } from "discord.js";
import { subscribedUsers } from "src/bot";
import { channelCheck } from "utils/channelCheck";
import { colorize } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { replaceVariables } from "utils/replace";
import { Event } from "utils/types";

export default (async function run(member: GuildMember) {
  subscribedUsers.delete(member.id);
  const guild = member.guild;
  const guildID = guild.id;
  const id =
    ((await getSetting(guildID, "welcome", "leave_channel")) as string) ??
    ((await getSetting(guildID, "welcome", "join_channel")) as string);

  if (!id) return;
  const user = member.user;
  const avatar = user.displayAvatarURL();
  const channel = (await guild.channels.cache
    .find(channel => channel.id == id)
    ?.fetch()) as TextChannel;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${user.displayName} left`,
      iconURL: avatar,
    })
    .setDescription(
      replaceVariables((await getSetting(guildID, "welcome", "leave_text")) as string, guild, user),
    )
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(await colorize({ user, avatar, hue: 200 }));

  if (
    await channelCheck({
      guild,
      channel,
      permType: "Send",
      setting: { category: "welcome", setting: "leave_channel" },
    })
  )
    await channel.send({ embeds: [embed] });
} as Event<"guildMemberRemove">);
