import { getNews, updateNews } from "database/news";
import { getSetting } from "database/settings";
import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Guild,
  type Role,
  type TextChannel,
} from "discord.js";
import { channelCheck } from "./channelCheck";
import { colorize, Sokolors } from "./colorize";
import { dotCheck } from "./dotCheck";
import { mention } from "./mention";
import { safeChannel, safeRole } from "./safeThings";

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
  imageURL?: string,
): Promise<void> {
  const news = (await getNews(guild.id, id))!;
  console.log(news.createdAt);
  const role = (await getSetting(guild.id, "news", "role")) as string;
  let roleToSend: Role | undefined;
  if (role) roleToSend = await safeRole(guild, role);
  const avatar = news.authorPFP;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${news.author}`,
      iconURL: avatar,
    })
    .setTitle(title ?? news.title)
    .setDescription(body ?? news.body)
    .setImage(imageURL ?? news.imageURL ?? null)
    .setTimestamp(Number(news.updatedAt) || Number(news.createdAt))
    .setFooter({ text: `Latest news from ${guild.name} • ID: ${news.id}` })
    .setColor(await colorize({ hue: Sokolors.Blue }));

  const channel = (await safeChannel(
    guild,
    ((await getSetting(guild.id, "news", "channel")) as string) ?? interaction.channel?.id,
  )) as TextChannel;

  if (
    !(await channelCheck({
      channel,
      guild,
      permType: "View",
      setting: { category: "news", setting: "channel" },
    }))
  )
    return;

  return await channel
    .send({
      embeds: [embed],
      content: roleToSend ? mention(roleToSend.id, "ROLE") : undefined,
    })
    .then(async message => await updateNews(guild.id, id, undefined, undefined, message.id));
}
