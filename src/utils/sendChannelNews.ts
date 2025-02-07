/**
 * Sends news to a channel.
 * @param guild Guild where the channel is in.
 * @param id ID of the news.
 * @param interaction Command interaction.
 * @param title Title of the news.
 * @param body Content of the news.
 * @returns News message in a channel.
 */

import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Guild,
  type Role,
  type TextChannel,
} from "discord.js";
import { genColor } from "./colorGen";
import { get, updateNews } from "./database/news";
import { getSetting } from "./database/settings";

export async function sendChannelNews(
  guild: Guild,
  id: string,
  interaction: ChatInputCommandInteraction,
  title?: string,
  body?: string,
) {
  const news = get(guild.id, id)!;
  const role = getSetting(guild.id, "news", "role_id") as string;
  let roleToSend: Role | undefined;
  if (role) roleToSend = guild.roles.cache.get(role);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${news.author}`, iconURL: news.authorPFP })
    .setTitle(title ?? news.title)
    .setDescription(body ?? news.body)
    .setTimestamp(parseInt(news.updatedAt.toString()) ?? null)
    .setFooter({ text: `Latest news from ${guild.name}\nID: ${news.id}` })
    .setColor(genColor(200));

  const channel = guild.channels.cache.get(
    (getSetting(guild.id, "news", "channel_id") as string) ?? interaction.channel?.id,
  ) as TextChannel;
  if (!channel) return;
  if (!channel.permissionsFor(guild.client.user)?.has("ViewChannel")) return;

  return await channel
    .send({
      embeds: [embed],
      content: roleToSend ? `<@&${roleToSend.id}>` : undefined,
    })
    .then(message => updateNews(guild.id, id, undefined, undefined, message.id));
}
