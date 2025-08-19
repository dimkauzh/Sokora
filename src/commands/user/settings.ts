import { settingsDefinition, settingsKeys } from "database/userSettings";
import {
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { settingsEmbed } from "embeds/settingsEmbed";

export const data = new SlashCommandSubcommandGroupBuilder()
  .setName("settings")
  .setDescription("Configure Sokora to your liking.");

settingsKeys.forEach(key =>
  data.addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName(key)
      .setDescription(settingsDefinition[key].description),
  ),
);

export async function run(interaction: ChatInputCommandInteraction) {
  await settingsEmbed(interaction, "user");
}
