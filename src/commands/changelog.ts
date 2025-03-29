import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { version } from "../../package.json";
import { genColor, genImageColor } from "../utils/colorGen";
import { replace } from "../utils/replace";
import { parseChangelogString } from "../utils/parseChangelog";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription(`Shows what's changed in Sokora's latest version, ${version}`);

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  // (this assumes you're running sokora from the repo's root)
  const text = parseChangelogString(await Bun.file("./CHANGELOG.md").text());

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  Changelog for ${version}`, iconURL: avatar })
    .setDescription([text, "-# See older versions [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md)."].join("\n"))
    .setFooter({ text: replace("(madeWith)") })
    .setThumbnail(avatar)
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  await interaction.reply({ embeds: [embed] });
}
