import { resetSetting } from "database/settings";
import {
  EmbedBuilder,
  NewsChannel,
  StageChannel,
  TextChannel,
  VoiceChannel,
  type Guild,
} from "discord.js";
import { logChannel } from "utils/logChannel";
import { safeChannel, safeMember } from "utils/safeThings";
import { colorize } from "../colorGen";
import { dotCheck } from "../dotCheck";
import { mention } from "../mention";
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

/**
 * Sends an embed containing information about the guild.
 * @param options Options of the embed.
 * @returns Embed that contains the guild info.
 */
export async function serverEmbed(options: Options) {
  const { page, pages, guild, invite } = options;
  const { premiumTier: boostTier, premiumSubscriptionCount: boostCount } = guild;
  const boosters = guild.members.cache.filter(member => member.premiumSince);
  const client = guild.client.user.id;
  const owner = await guild.fetchOwner();
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
  };
  const channelCount = channelSizes.text + channelSizes.voice;

  const generalValues = [
    `Owned by **${owner.user.displayName}**`,
    `Created on **<t:${Math.round(guild.createdAt.valueOf() / 1000)}:D>**`,
  ];

  const vl = guild.verificationLevel;
  const nsfw = guild.nsfwLevel;
  const safetyValues: (string | null)[] = [
    `**${vl == 0 ? "Unrestricted" : vl == 1 ? "Low" : vl == 2 ? "Mid" : vl == 3 ? "High" : "Very high"}** level`,
    `**${guild.mfaLevel == 1 ? "No" : "Has"}** 2FA`,
  ];

  if (nsfw != 0)
    safetyValues.push(`**${nsfw == 1 ? "Explicit" : nsfw == 2 ? "Safe" : "Age restricted"}**`);

  const statValues: (string | null)[] = [
    `**${guild.memberCount?.toLocaleString("en-US")}** members`,
    channelSizes.voice > 0
      ? `**${channelCount}** ${pluralOrNot("channel", channelCount)} • **${channelSizes.text}** text and **${channelSizes.voice}** voice`
      : `**${channelCount}** text ${pluralOrNot("channel", channelCount)}`,
  ];

  if (boostTier)
    statValues.push(
      `${!boostTier ? "**No** level" : `Level **${boostTier}**`} • **${boostCount}**${
        !boostTier ? "/2" : boostTier == 1 ? "/7" : boostTier == 2 ? "/14" : ""
      } ${pluralOrNot("boost", boostCount!)} • **${boosters.size}** ${pluralOrNot("booster", boosters.size)}`,
    );

  if (options.roles)
    statValues.push(
      `**${roles.size - 1}** ${pluralOrNot("role", roles.size - 1)} • ${
        roles.size == 1
          ? "*None*"
          : `${sortedRoles
              .slice(0, 5)
              .map(role => mention(role[0], "ROLE"))
              .join(" • ")}${rolesLength > 5 ? ` and **${rolesLength - 5}** more` : ""}`
      }`,
    );

  const dot = dotCheck({ string: icon, doubleSpace: true });
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pages ? `#${page}  •  ` : dot}${guild.name}`,
      iconURL: icon,
    })
    .setDescription(guild.description ? `> ${guild.description}` : null)
    .setFields(
      {
        name: "📃 • General",
        value: generalValues.join("\n"),
        inline: true,
      },
      {
        name: "🛡 • Safety setup",
        value: safetyValues.join("\n"),
        inline: true,
      },
      {
        name: "📈 • Stats",
        value: statValues.join("\n"),
      },
    )
    .setFooter({
      text: `${pages && pages > 1 ? `Page ${page} of ${pages} • ` : ""}Server ID: ${guild.id}`,
    })
    .setColor(await colorize({ avatar: icon, hue: 200 }));

  if (invite?.show) {
    async function noPerms(channel?: NewsChannel | TextChannel | StageChannel | VoiceChannel) {
      resetSetting(guild.id, "serverboard", "server_invite");
      resetSetting(guild.id, "serverboard", "invite_channel");
      const errEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${dot}Serverboard is misconfigured in your server!`,
          iconURL: icon,
        })
        .setFields({
          name: "⁉️ • What happened",
          value: [
            "Sokora does not have the **Create Invite** and/or **Manage Server** permissions to create an invitation, but `serverboard.server_invite` is enabled.",
            `Please give Sokora the permission${channel ? ` for ${channel.name}` : ""} and enable the settings again in **/settings serverboard**.`,
          ].join("\n"),
        })
        .setColor(await colorize({ hue: 60 }));

      await logChannel(guild, { embeds: [errEmbed] }, true, {
        silent: false,
        user: owner.user,
        options: {
          embeds: [
            errEmbed.setFooter({ text: `This is coming from ${guild.name} • ID: ${guild.id}` }),
          ],
        },
      });

      return embed;
    }

    const clientMember = await safeMember(guild, client);
    if (
      !clientMember.permissions.has("CreateInstantInvite") ||
      !clientMember.permissions.has("ManageGuild")
    )
      return noPerms();

    const invites = await guild.invites.fetch();
    const previousInvite = invites.find(invite => invite.inviter?.id == client);
    const possibleInviteChannel = await safeChannel(
      guild,
      invite.channel ??
        guild.channels.cache
          .filter(channel => channel.isTextBased() && !channel.isThread())
          .find(channel => channel.position == 0)!.id,
    );

    const inviteChannel =
      possibleInviteChannel &&
      possibleInviteChannel.isTextBased() &&
      !possibleInviteChannel.isThread()
        ? possibleInviteChannel
        : guild.rulesChannel;

    if (!inviteChannel) return embed;
    if (!inviteChannel.permissionsFor(client)?.has("CreateInstantInvite"))
      return noPerms(inviteChannel);

    const inviteUrl = previousInvite
      ? previousInvite.url
      : await inviteChannel.createInvite({ maxAge: 0, reason: "Serverboard invite" });

    embed.addFields({
      name: `🚪 • Join in!`,
      value: `This server allows you to join from here! ${inviteUrl}`,
    });
  }

  return embed;
}
