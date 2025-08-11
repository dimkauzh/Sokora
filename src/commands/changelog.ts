import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { version } from "package";
import { colorize } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription(`Sends a link to Sokora's latest version (${version}) changelog.`);

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}Changelog for ${version}`,
      iconURL: avatar,
    })
    .setFields([
      {
        name: version,
        value:
          "See Sokora's changelog [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md).",
      },
    ])
    .setFooter({ text: replace("(madeWith)") })
    .setColor(await colorize({ user, avatar, hue: 270 }));

  await interaction.reply({ embeds: [embed] });
}
