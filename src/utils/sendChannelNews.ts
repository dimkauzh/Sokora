import { get, updateNews } from "database/news";
import { getSetting } from "database/settings";
import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Guild,
  type Role,
  type TextChannel,
} from "discord.js";
import { genColor } from "./colorGen";
import { dotCheck } from "./dotCheck";
import { mention } from "./mention";

/**
 * Sends news to a channel.
 * @param {Guild} guild Guild where the channel is in.
 * @param {string} id ID of the news.
 * @param {ChatInputCommandInteraction} interaction Command interaction.
 * @param {?string} title Title of the news.
 * @param {?string} body Content of the news.
 * @returns News message in a channel.
 */
export async function sendChannelNews(
  guild: Guild,
  id: string,
  interaction: ChatInputCommandInteraction,
  title?: string,
  body?: string,
): Promise<void> {
  const news = get(guild.id, id)!;
  const role = (await getSetting(guild.id, "news", "role")) as string;
  let roleToSend: Role | undefined;
  if (role) roleToSend = guild.roles.cache.get(role);
  const avatar = news.authorPFP;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${news.author}`,
      iconURL: avatar,
    })
    .setTitle(title ?? news.title)
    .setDescription(body ?? news.body)
    .setTimestamp(parseInt(news.updatedAt.toString()) ?? null)
    .setFooter({ text: `Latest news from ${guild.name} • ID: ${news.id}` })
    .setColor(genColor(200));

  const channel = guild.channels.cache.get(
    ((await getSetting(guild.id, "news", "channel")) as string) ?? interaction.channel?.id,
  ) as TextChannel;
  if (!channel) return;
  if (!channel.permissionsFor(guild.client.user)?.has("ViewChannel")) return;

  return await channel
    .send({
      embeds: [embed],
      content: roleToSend ? mention(roleToSend.id, "ROLE") : undefined,
    })
    .then(message => updateNews(guild.id, id, undefined, undefined, message.id));
}
