import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../../utils/colorGen.ts";

export const data = new SlashCommandSubcommandBuilder()
  .setName("coin")
  .setDescription("Flip a coin.");

export async function run(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("Coin flip")
    .setDescription(Math.random() >= 0.5 ? "Tails!" : "Heads!")
    .setColor(genColor(110));

  await interaction.reply({ embeds: [embed] });
}
