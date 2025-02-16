import { ChatInputCommandInteraction, EmbedBuilder, Guild } from "discord.js";
import { genColor } from "../colorGen";
import { logChannel } from "../logChannel";

/**
 * Creates an embed for a moderator's action and replies to the given interaction with it.
 *
 * @async
 * @param {string} title Title of the embed (set as `author.name`).
 * @param {(string | string[])} body Description of the embed.
 * @param {Guild} guild Guild to `logChannel()` to.
 * @param {ChatInputCommandInteraction} i Interaction to reply to.
 * @returns {EmbedBuilder} An `EmbedBuilder` you can build on top of.
 */
export async function modActionEmbed(
  title: string,
  body: string | string[],
  guild: Guild,
  i: ChatInputCommandInteraction,
): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setAuthor({ name: title })
      .setDescription(Array.isArray(body) ? body.join("\n") : body)
      .setColor(genColor(100));

    await logChannel(guild, embed);
    await i.reply({ embeds: [embed] });
  } catch (e) {
    console.error(e);
  }
}
