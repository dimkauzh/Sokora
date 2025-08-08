import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";

export const data = new SlashCommandSubcommandBuilder()
  .setName("coin")
  .setDescription("Flip a coin.");

export async function run(interaction: ChatInputCommandInteraction) {
  const avatar = interaction.user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}Coin flip`,
      iconURL: avatar,
    })
    .setDescription(`The coin landed on **${Math.random() >= 0.5 ? "tails" : "heads"}**!`)
    .setColor(genColor(120));

  await interaction.reply({ embeds: [embed] });
}
