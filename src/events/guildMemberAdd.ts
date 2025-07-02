import { getSetting } from "database/settings";
import { EmbedBuilder, type TextChannel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor, genImageColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { kominator } from "utils/kominator";
import { replaceVariables } from "utils/replace";
import { Event } from "utils/types";

export default (async function run(member) {
  const guildID = member.guild.id;
  const id =
    ((await getSetting(guildID, "welcome", "join_channel")) as string) ??
    ((await getSetting(guildID, "welcome", "leave_channel")) as string);
  const roles = await getSetting(guildID, "welcome", "roles");
  const user = member.user;
  const avatar = member.user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${user.displayName} joined`,
      iconURL: avatar,
    })
    .setFooter({ text: `User ID: ${member.id}` })
    .setColor(
      member.user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(200),
    );

  if (id) {
    const channel = (await member.guild.channels.cache
      .find(channel => channel.id == id)
      ?.fetch()) as TextChannel;

    embed.setDescription(
      replaceVariables(
        (await getSetting(guildID, "welcome", "join_text")) as string,
        member.guild,
        member.user,
      ),
    );

    await channel.send({ embeds: [embed] });
  }

  if (roles) await member.roles.add([...kominator(roles as string)]);

  if (!(await getSetting(guildID, "welcome", "join_dm")) as boolean) return;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel) return;
  if (user.bot) return;

  embed.setDescription(
    replaceVariables(
      (await getSetting(guildID, "welcome", "dm_text")) as string,
      member.guild,
      member.user,
    ),
  );

  try {
    await dmChannel.send({ embeds: [embed] });
  } catch (error) {
    return await errorEmbed({ client: member.client, error, log: true, forward: true });
  }
} as Event<"guildMemberAdd">);
