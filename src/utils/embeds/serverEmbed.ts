/**
 * Sends an embed containing information about the guild.
 * @param options Options of the embed.
 * @returns Embed that contains the guild info.
 */

import { ChannelType, EmbedBuilder, Invite, type Guild } from "discord.js";
import { genColor } from "../colorGen";
import { imageColor } from "../imageColor";
import { pluralOrNot } from "../pluralOrNot";

type Options = {
  guild: Guild;
  invite?: {
    show: boolean;
    channel: string | null;
  };
  roles?: boolean;
  page?: number;
  pages?: number;
};

export async function serverEmbed(options: Options) {
  const { page, pages, guild } = options;
  const { premiumTier: boostTier, premiumSubscriptionCount: boostCount } = guild;
  const members = guild.members.cache;
  const boosters = members.filter(member => member.premiumSince);
  const bots = members.filter(member => member.user.bot);
  const formattedUserCount = (guild.memberCount - bots.size)?.toLocaleString("en-US");
  const icon = guild.iconURL()!;

  const roles = guild.roles.cache;
  const sortedRoles = [...roles].sort((role1, role2) => role2[1].position - role1[1].position);
  sortedRoles.pop();
  const rolesLength = sortedRoles.length;

  const channels = guild.channels.cache;
  const channelSizes = {
    text: channels.filter(channel => channel.type == 0 || channel.type == 15 || channel.type == 5)
      .size,
    voice: channels.filter(channel => channel.type == 2 || channel.type == 13).size,
    categories: channels.filter(channel => channel.type == 4).size,
  };

  const generalValues = [
    `Owned by **${(await guild.fetchOwner()).user.displayName}**`,
    `Created on **<t:${Math.round(guild.createdAt.valueOf() / 1000)}:D>**`,
  ];

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pages ? `#${page}  •  ` : icon ? "•  " : ""}${guild.name}`,
      iconURL: icon,
    })
    .setDescription(guild.description ? guild.description : null)
    .setFields({ name: "📃 • General", value: generalValues.join("\n") })
    .setFooter({ text: `${pages ? `Page ${page}/${pages}\n` : ""}Server ID: ${guild.id}` })
    .setThumbnail(icon)
    .setColor((await imageColor(icon)) ?? genColor(200));

  const channelCount = channelSizes.text + channelSizes.voice;

  if (options.roles) {
    embed.addFields({
      name: `🎭 • ${roles.size - 1} ${pluralOrNot("role", roles.size - 1)}`,
      value:
        roles.size == 1
          ? "*None*"
          : `${sortedRoles
              .slice(0, 5)
              .map(role => `<@&${role[0]}>`)
              .join(", ")}${rolesLength > 5 ? ` and **${rolesLength - 5}** more` : ""}`,
    });
  }

  embed.addFields(
    {
      name: `👥 • ${guild.memberCount?.toLocaleString("en-US")} members`,
      value: [
        `**${formattedUserCount}** ${pluralOrNot("user", guild.memberCount - bots.size)}`,
        `**${bots.size?.toLocaleString("en-US")}** ${pluralOrNot("bot", bots.size)}`,
      ].join("\n"),
      inline: true,
    },
    {
      name: `🗨️ • ${channelCount} ${pluralOrNot("channel", channelCount)}`,
      value: [
        `**${channelSizes.text}** text • **${channelSizes.voice}** voice`,
        `**${channelSizes.categories}** ${pluralOrNot("category", channelSizes.categories)}`,
      ].join("\n"),
      inline: true,
    },
    {
      name: `🌟 • ${!boostTier ? "No level" : `Level ${boostTier}`}`,
      value: [
        `**${boostCount}**${
          !boostTier ? "/2" : boostTier == 1 ? "/7" : boostTier == 2 ? "/14" : ""
        } ${pluralOrNot("boost", boostCount!)}`,
        `**${boosters.size}** ${pluralOrNot("booster", boosters.size)}`,
      ].join("\n"),
      inline: true,
    },
  );

  if (options.invite?.show) {
    const previousInvite: Invite | undefined = (await options.guild.invites.fetch()).find(
      invite =>
        invite.inviter?.id === "873918300726394960" &&
        invite.maxUses === null &&
        invite.expiresAt === null,
    );

    if (!options.guild.rulesChannel) return embed;

    const possiblyFetchedInviteChannel = await options.guild.channels.fetch(
      options.invite.channel ?? "hi",
    );

    const inviteChannel =
      possiblyFetchedInviteChannel &&
      possiblyFetchedInviteChannel.isTextBased() &&
      !possiblyFetchedInviteChannel.isThread()
        ? possiblyFetchedInviteChannel
        : options.guild.rulesChannel;

    if (!inviteChannel) return embed;

    const inviteUrl = previousInvite
      ? previousInvite.url
      : await inviteChannel.createInvite({
          maxAge: undefined,
          maxUses: undefined,
          reason: "Serverboard",
          temporary: false,
          unique: true,
        });

    embed.addFields({
      name: `🚪 • Join in!`,
      value: `This server allows you to join from here. ${inviteUrl}`,
      inline: true,
    });
  }

  return embed;
}
