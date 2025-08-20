import { getSetting } from "database/settings";
import { EmbedBuilder, type TextChannel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { channelCheck } from "utils/channelCheck";
import { colorize } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { kominator } from "utils/kominator";
import { replaceVariables } from "utils/replace";
import { Event } from "utils/types";

export default (async function run(member) {
  const guild = member.guild;
  const guildID = guild.id;
  const id =
    ((await getSetting(guildID, "welcome", "join_channel")) as string) ??
    ((await getSetting(guildID, "welcome", "leave_channel")) as string);

  if (!id) return;
  const roles = await getSetting(guildID, "welcome", "roles");
  const user = member.user;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${user.displayName} joined`,
      iconURL: avatar,
    })
    .setDescription(
      await replaceVariables(
        (await getSetting(guildID, "welcome", "join_text")) as string,
        guild,
        user,
      ),
    )
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(await colorize({ user, avatar, hue: 200 }));

  const channel = (await guild.channels.cache
    .find(channel => channel.id == id)
    ?.fetch()) as TextChannel;

  if (
    await channelCheck({
      guild,
      channel,
      permType: "Send",
      setting: { category: "welcome", setting: "join_channel" },
    })
  ) {
    if (roles) if (!user.bot) await member.roles.add([...kominator(roles as string)]);
    await channel.send({ embeds: [embed] });
  }

  if (!(await getSetting(guildID, "welcome", "join_dm")) as boolean) return;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel || user.bot) return;

  embed.setDescription(
    await replaceVariables(
      (await getSetting(guildID, "welcome", "dm_text")) as string,
      guild,
      user,
    ),
  );

  try {
    await dmChannel.send({ embeds: [embed] });
  } catch (error) {
    return await errorEmbed({ client: member.client, error, log: true, forward: true });
  }
} as Event<"guildMemberAdd">);
