import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { version } from "package";
import { genColor, genImageColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription(`Sends a link toSokora's latest version (${version}) changelog.`);

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(avatar)}Changelog for ${version}`, iconURL: avatar })
    .setFields([
      {
        name: version,
        value:
          "See Sokora's changelog [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md).",
      },
    ])
    .setFooter({ text: replace("(madeWith)") })
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  await interaction.reply({ embeds: [embed] });
}
