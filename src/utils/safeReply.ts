import type {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";

export async function safeReply(options: {
  interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction;
  replyOptions?: string | MessagePayload | InteractionReplyOptions;
  editOptions?: string | MessagePayload | InteractionEditReplyOptions;
}) {
  const { interaction, replyOptions, editOptions } = options;
  if (interaction.replied) {
    if (editOptions) return await interaction.editReply(editOptions);
    return await interaction.followUp(replyOptions!);
  }

  return await interaction.reply(replyOptions!);
}
