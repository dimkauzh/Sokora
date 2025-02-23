import {
  EmbedBuilder,
  codeBlock,
  type ButtonInteraction,
  type ChatInputCommandInteraction
} from "discord.js";
import { genColor } from "../colorGen";
import { reply } from "../reply";

/**
 * Sends the embed containing an error.
 * @param interaction The interaction (slash command).
 * @param title The error.
 * @param reason The reason of the error.
 * @param error The error log.
 * @param forward Whether or not should the error embed be forwarded to the error log channel.
 * @returns Embed with the error description.
 */

export async function errorEmbed(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  title: string,
  reason?: string,
  error?: any,
  forward?: boolean
) {
  const content = [`**${title}**`];
  if (reason) content.push(reason);

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Something went wrong!" })
    .setDescription(content.join("\n"))
    .setColor(genColor(0));

  if (error) embed.addFields({ name: "📜 • Error log", value: codeBlock(error) });
  if (forward) {
    const channel = interaction.client.channels.cache.get("1343140645132308532");
    if (!channel?.isTextBased() || !channel.isSendable()) return;
    await channel.send({ embeds: [embed] });
  }

  return await reply(interaction, { embeds: [embed], flags: "Ephemeral" });
}

/**
 * Sends the embed containing an internal error and forwards it to the internal error log channel.
 * @param interaction The interaction (slash command).
 * @param error The error log.
 * @returns Embed with the internal error.
 */

export async function logError(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  error: Error
) {
  return await errorEmbed(
    interaction,
    "The bot has experienced an internal error.",
    "If you want to, you can go to our [support server](https://discord.gg/c6C25P4BuY) to report this issue.",
    error.stack,
    true
  );
}
