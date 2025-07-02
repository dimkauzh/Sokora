import type {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  Message,
  MessagePayload,
} from "discord.js";

/**
 * Properly handles replying / following up to an interaction.
 *
 * @async
 * @param {{
 *   interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction;
 *   replyOptions?: string | MessagePayload | InteractionReplyOptions;
 *   editOptions?: string | MessagePayload | InteractionEditReplyOptions;
 * }} options Options.
 * @returns {(Promise<Message<boolean> | InteractionResponse<boolean>>)}
 */
export async function safeReply(options: {
  interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction;
  replyOptions?: string | MessagePayload | InteractionReplyOptions;
  editOptions?: string | MessagePayload | InteractionEditReplyOptions;
}): Promise<Message<boolean> | InteractionResponse<boolean>> {
  const { interaction, replyOptions, editOptions } = options;
  if (interaction.replied) {
    if (editOptions) return await interaction.editReply(editOptions);
    return await interaction.followUp(replyOptions!);
  }

  return await interaction.reply(replyOptions!);
}
