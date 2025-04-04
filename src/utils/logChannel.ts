import {
  AttachmentBuilder,
  ChannelType,
  EmbedBuilder,
  Message,
  type Channel,
  type Guild,
  type TextChannel,
} from "discord.js";
import { getSetting } from "./database/settings";

/**
 * Sends a message in the log channel (if there is one set)
 * @param {Guild} guild The guild where the log channel is located.
 * @param {EmbedBuilder} embed Embed of the log.
 * @param {?AttachmentBuilder[]} files Optional array of attachments.
 * @returns {Promise<Message<boolean> | undefined>} Log message, or undefined if no log channel is set.
 */
export async function logChannel(
  guild: Guild,
  embed: EmbedBuilder,
  files?: AttachmentBuilder[]
): Promise<Message<boolean> | undefined> {
  const logChannel = getSetting(guild.id, "moderation", "channel");
  if (!logChannel) return;

  const channel = await guild.channels.cache
    .get(`${logChannel}`)
    ?.fetch()
    .then((channel: Channel) => {
      if (
        channel.type != ChannelType.GuildText &&
        ChannelType.PublicThread &&
        ChannelType.PrivateThread &&
        ChannelType.GuildVoice
      )
        return null;

      return channel as TextChannel;
    })
    .catch(() => null);

  if (!channel) return;
  if (!channel.permissionsFor(guild.client.user)?.has("ViewChannel")) return;
  if (Array.isArray(files) && files.length > 0) return await channel.send({ embeds: [embed], files });
  return await channel.send({ embeds: [embed] });
}
