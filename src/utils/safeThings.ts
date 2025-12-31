import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Guild,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  InteractionUpdateOptions,
  Message,
  MessagePayload,
  ModalSubmitInteraction,
} from "discord.js";

/**
 * Ensures that the channel that you're getting will be gotten.
 * @param guild The guild where the channel resides.
 * @param id The ID of the channel.
 * @returns A channel.
 */
export async function safeChannel(guild: Guild, id: string) {
  return (guild.channels.cache.get(id) ?? (await guild.channels.fetch(id)))!;
}

/**
 * Ensures that the role that you're getting will be gotten.
 * @param guild The guild where the role resides.
 * @param id The ID of the role.
 * @returns A role.
 */
export async function safeRole(guild: Guild, id: string) {
  return (guild.roles.cache.get(id) ?? (await guild.roles.fetch(id)))!;
}

/**
 * Ensures that the user that you're getting will be gotten.
 * @param guild The guild where the user resides.
 * @param id The ID of the user.
 * @returns A user.
 */
export async function safeMember(guild: Guild, id: string) {
  return guild.members.cache.get(id) ?? (await guild.members.fetch(id));
}

/**
 * Properly handles replying/following up to an interaction.
 * @param {{
 *   interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction;
 *   replyOptions?: string | MessagePayload | InteractionReplyOptions;
 *   editOptions?: string | MessagePayload | InteractionEditReplyOptions;
 * }} options Options.
 * @returns {(Promise<Message<boolean> | InteractionResponse<boolean>>)}
 */
export async function safeReply(options: {
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | AnySelectMenuInteraction
    | ModalSubmitInteraction;
  replyOptions?: string | MessagePayload | InteractionReplyOptions;
  editOptions?: string | MessagePayload | InteractionEditReplyOptions;
}): Promise<Message<boolean> | InteractionResponse<boolean>> {
  const { interaction, replyOptions, editOptions } = options;
  const reply = (replyOptions! || editOptions!) as
    | string
    | MessagePayload
    | InteractionReplyOptions;

  if (interaction.replied) {
    if (editOptions) return await interaction.editReply(editOptions);
    return await interaction.followUp(reply);
  }

  if (interaction.isButton() || interaction.isAnySelectMenu())
    return await interaction.update((replyOptions! || editOptions!) as InteractionUpdateOptions);

  return await interaction.reply(reply);
}
