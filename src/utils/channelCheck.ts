import {
  EmbedBuilder,
  Guild,
  PermissionResolvable,
  Channel,
  ChannelType,
  GuildBasedChannel,
  type TextChannel,
  NewsChannel,
} from "discord.js";
import { dotCheck } from "./dotCheck";
import { genColor } from "./colorGen";
import { mention } from "./mention";
import { resetSettingCategory } from "database/settings";

/** Checks if a channel that the user specified as the value of any setting (moderation.channel for example) is valid.
 *
 * "Valid" = Exists, is either a Text or News channel, and Sokora has the requested permissions for it (either send, view, or both).
 */
export async function channelCheck(options: {
  /** Channel. It may be null as it may not exist. */
  channel: Channel | GuildBasedChannel | null;
  setting: {
    /** Setting category, e.g. `moderation` */
    category: string;
    /** Setting, e.g. `channel` */
    setting: string;
  };
  /** Permission(s) needed. */
  permType: "View" | "Send" | "Both";
  guild: Guild;
}): Promise<boolean> {
  const { channel, permType, guild, setting } = options;

  async function reset() {
    await dm?.send({
      embeds: [embed],
    });
    await resetSettingCategory(guild.id, setting.category);
  }

  function isValid(channel: any): channel is TextChannel | NewsChannel {
    return channel.type == ChannelType.GuildText || channel.type == ChannelType.GuildAnnouncement;
  }
  const user = guild.client.user!;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}A channel is misconfigured in your server!`,
      iconURL: avatar,
    })
    .setFields({
      name: "What happened",
      value: channel
        ? isValid(channel)
          ? `Sokora needs **${permType == "View" ? "ViewChannel" : permType == "Send" ? "SendMessages" : "both ViewChannel and SendMessages"}** permission in ${mention(channel.id, "CHANNEL")}, requested by setting \`${setting.category}.${setting.setting}\`, but it doesn't have it anymore. **The entire *${setting.category}* settings category will reset to defaults.**`
          : `Sokora's \`${setting.category}.${setting.setting}\` setting was configured to send messages to a channel that is neither a text nor an announcements channel! We cannot send messages to ${mention(channel.id, "CHANNEL")}. **The entire *${setting.category}* settings category will reset to defaults.**`
        : `Sokora's \`${setting.category}.${setting.setting}\` setting was configured to send messages to a channel that no longer exists! **The entire *${setting.category}* settings category will reset to defaults.**`,
    })
    .setFooter({ text: `This is coming from ${guild.name} · ID: ${guild.id}` })
    .setColor(genColor(0));

  const owner = await guild.fetchOwner();
  const dm = await owner?.createDM().catch(() => null);

  if (!channel || !isValid(channel)) {
    await reset();
    return false;
  }

  const permissions: PermissionResolvable[] = [];

  if (permType == "View" || permType == "Both") permissions.push("ViewChannel");
  if (permType == "Send" || permType == "Both") permissions.push("SendMessages");

  const perms = channel.permissionsFor(channel.client.user);
  if (!perms) {
    await reset();
    return false;
  }
  if (permissions.every(p => perms.has(p))) return true;
  await reset();
  return false;
}
