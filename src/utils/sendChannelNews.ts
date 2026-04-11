import { addNews, getNews, updateNews } from "database/news";
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
 * @param {ChatInputCommandInteraction} interaction Command interaction.
 * @param {{
   title: string;
   body: string;
   author: string;
   authorPFP: string;
   id: string;
   imageURL?: string | null;
 }} newsOptions Options to send the news post.
 * @param {?boolean} edit Whether or not should the function make a new message with some reused elements.
 * @returns News message in a channel.
 */
export async function sendChannelNews(
  guild: Guild,
  interaction: ChatInputCommandInteraction,
  newsOptions: {
    title: string;
    body: string;
    author: string;
    authorPFP: string;
    id: number;
    imageURL?: string | null;
  },
  edit?: boolean,
) {
  const { title, body, author, authorPFP, imageURL, id } = newsOptions;
  const role = (await getSetting(guild.id, "news", "role")) as string;
  let roleToSend: Role | undefined;
  if (role) roleToSend = await safeRole(guild, role);

  const news = (await getNews(guild.id, id))!;
  const avatar = authorPFP;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${author}`,
      iconURL: avatar,
    })
    .setTitle(title)
    .setDescription(body)
    .setImage(edit ? (news.imageURL ?? null) : (imageURL ?? null))
    .setTimestamp(edit ? news.createdAt : new Date())
    .setFooter({ text: `Latest news from ${guild.name} • ID: ${id}` })
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

  const message = await channel.send({
    embeds: [embed],
    content: roleToSend ? mention(roleToSend.id, "ROLE") : undefined,
  });

  if (edit) return await updateNews(guild.id, id, title, body, message.id);
  return await addNews(guild.id, title, body, author, authorPFP, message.id, imageURL, id);
}
// We should have some sort of a middleware folder where we place all functions like this (interacts with the db but looks like it comes from a command file)
