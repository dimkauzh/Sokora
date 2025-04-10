import {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  codeBlock,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../colorGen";
import { reply } from "../reply";
import { errorType } from "../errorType";

/**
 * Sends the embed containing an error.
 * @param interaction The interaction (slash command).
 * @param title The error.
 * @param reason The reason of the error.
 * @param forward Whether or not should the error embed be forwarded to the error log channel.
 * @returns Embed with the error description.
 */
export async function errorEmbed(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  title: string,
  reason?: string,
  forward?: boolean,
) {
  const content = [`**${title}**`];
  if (reason) content.push(reason);

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Something went wrong!" })
    .setDescription(content.join("\n"))
    .setColor(genColor(0));

  if (forward) {
    const channel = interaction.client.channels.cache.get("1343140645132308532");
    if (!channel?.isTextBased() || !channel.isSendable()) return;
    await channel.send({ embeds: [embed] });
  }

  return await reply(interaction, { embeds: [embed], flags: "Ephemeral" });
}

/**
 * Sends the embed containing an internal error and forwards it to the internal error log channel.
 * @param error The error log.
 * @param interaction The interaction (slash command).
 * @returns Embed with the internal error.
 */

export async function logError(options: {
  error: Error;
  interaction?: ChatInputCommandInteraction | ButtonInteraction;
  client?: Client;
}) {
  const { error, interaction, client } = options;
  const stack = errorType(error).stack;
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Something went wrong!" })
    .setDescription(
      "The bot has experienced an internal error.\nThe team has been informed. If you keep encountering this issue, you can go to our [support server](https://discord.gg/c6C25P4BuY) to report it.",
    )
    .addFields({ name: "💬 • Error message", value: codeBlock(error.message) })
    .addFields({
      name: "📜 • Error stack",
      value: stack
        ? stack.length <= 4096
          ? codeBlock(stack)
          : "The error stacktrace is an attachment below this embed due to it being too large."
        : "No error stacktrace.",
    })
    .setColor(genColor(0));

  const files: AttachmentBuilder[] = [];
  if (stack && stack.length >= 1024)
    files.push(new AttachmentBuilder(Buffer.from(stack, "utf8"), { name: "error.txt" }));

  const channel = (client ? client : interaction!.client).channels.cache.get("1343140645132308532");
  if (!channel?.isTextBased() || !channel.isSendable()) return;
  await channel.send({ embeds: [embed], files: files });

  if (interaction) await reply(interaction, { embeds: [embed], files: files, flags: "Ephemeral" });
}
