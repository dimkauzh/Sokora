import {
  ContainerBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { version } from "package";
import { colorize, Sokolors } from "utils/colorGen";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription(`Sends a link to Sokora's latest version (${version}) changelog.`)
  .setContexts(0);

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Changelog for ${version}`),
      new TextDisplayBuilder().setContent(
        "See Sokora's changelog [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md).",
      ),
      new TextDisplayBuilder().setContent(`-# ${replace("(madeWith)")}`),
    )
    .setAccentColor(
      await colorize({ user, avatar: user.displayAvatarURL(), hue: Sokolors.Purple }),
    );

  await interaction.reply({ components: [container], flags: ["Ephemeral", "IsComponentsV2"] });
}
