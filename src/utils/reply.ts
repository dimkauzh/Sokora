import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";

export async function reply(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  options: string | MessagePayload | InteractionReplyOptions,
) {
  if (interaction.replied) return await interaction.followUp(options);
  return await interaction.reply(options);
}
