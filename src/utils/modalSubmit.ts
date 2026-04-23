import type {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
} from "discord.js";

export async function modalSubmit(
  i: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction,
) {
  try {
    return await i.awaitModalSubmit({
      time: 60000,
      filter: m => m.user.id === i.user.id,
    });
  } catch {
    /* In case of timeout */
  }
}
