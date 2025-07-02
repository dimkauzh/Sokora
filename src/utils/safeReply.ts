import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  InteractionUpdateOptions,
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
 *   error?: boolean;
 * }} options Options.
 * @returns {(Promise<Message<boolean> | InteractionResponse<boolean>>)}
 */
export async function safeReply(options: {
  interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction;
  replyOptions?: string | MessagePayload | InteractionReplyOptions;
  editOptions?: string | MessagePayload | InteractionEditReplyOptions;
  error?: boolean;
}): Promise<Message<boolean> | InteractionResponse<boolean>> {
  const { interaction, replyOptions, editOptions, error } = options;
  const reply = (replyOptions! || editOptions!) as
    | string
    | MessagePayload
    | InteractionReplyOptions;

  if (error) return await interaction.reply(replyOptions!);
  if (interaction.replied) {
    if (editOptions) return await interaction.editReply(editOptions);
    return await interaction.followUp(reply);
  }

  if (interaction.isButton() || interaction.isAnySelectMenu())
    return await interaction.update((replyOptions! || editOptions!) as InteractionUpdateOptions);

  return await interaction.reply(reply);
}
