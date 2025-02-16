import { EmbedBuilder } from "discord.js";
import { genColor } from "../colorGen";

/**
 * Creates an embed for a moderator's action. Does _not_ send it.
 *
 * @param {string} title Title of the embed (set as `author.name`).
 * @param {(string | string[])} body Description of the embed.
 * @returns {EmbedBuilder} An `EmbedBuilder` you can build on top of.
 */
export function modActionEmbed(title: string, body: string | string[]): EmbedBuilder {
  return new EmbedBuilder()
    .setAuthor({ name: title })
    .setDescription(Array.isArray(body) ? body.join("\n") : body)
    .setColor(genColor(100));
}
