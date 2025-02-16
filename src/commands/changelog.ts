import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { version } from "../../package.json";
import { genColor, genImageColor } from "../utils/colorGen";
import { replace } from "../utils/replace";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription("Shows the changelog of Sokora's most recent update.");

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  const text = [["nothing yet"]].join("\n");

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  Changelog for ${version}`, iconURL: avatar })
    .setDescription(text)
    .setFooter({ text: replace("(madeWith)") })
    .setThumbnail(avatar)
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  await interaction.reply({ embeds: [embed] });
}
