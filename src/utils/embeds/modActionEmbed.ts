import { ChatInputCommandInteraction, EmbedBuilder, Guild } from "discord.js";
import { genColor } from "../colorGen";
import { logChannel } from "../logChannel";

type Content = {
  title: string;
  iconURL?: string;
  body: string | string[];
  footer?: string;
};

/**
 * Creates an embed for a moderator's action and replies to the given interaction with it.
 *
 * @async
 * @param {Content} content Content of your embed.
 * @param {Guild} guild Guild to `logChannel()` to.
 * @param {ChatInputCommandInteraction} i Interaction to reply to.
 * @returns {Promise<EmbedBuilder>} An `EmbedBuilder` you can build on top of.
 */
export async function modActionEmbed(
  content: Content,
  guild: Guild,
  i: ChatInputCommandInteraction,
): Promise<EmbedBuilder> {
  const { title, iconURL, body, footer } = content;

  const embed = new EmbedBuilder()
    .setAuthor({ name: title, iconURL: iconURL })
    .setDescription(Array.isArray(body) ? body.join("\n") : body)
    .setColor(genColor(100));

  if (footer) embed.setFooter({ text: footer });

  await logChannel(guild, embed).catch(e => console.error(e));
  await i.reply({ embeds: [embed] }).catch(e => console.error(e));

  return embed;
}
