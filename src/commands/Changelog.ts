import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { version } from "../../package.json";
import { genColor } from "../utils/colorGen";
import { imageColor } from "../utils/imageColor";
import { replace } from "../utils/replace";

export default class Changelog {
  data: SlashCommandBuilder;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("changelog")
      .setDescription(`Shows the changelog of Sokora's latest update, ${version}.`);
  }

  async run(interaction: ChatInputCommandInteraction) {
    const user = interaction.client.user;
    const avatar = user.displayAvatarURL();
    const text = [
      [
        "## Fixed",
        "### Moderation",
        "- Fixed the bot crashing because of too large messages being deleted.",
        "- Fixed a `Jump to message` option being shown on deleted messages (you cannot jump to a deleted message).",
        '- Fixed the bot showing "Application didn\'t respond" when unmuting someone muted by another bot.',
        "### News",
        "- Fixed not being able to delete the first new you create."
      ].join("\n")
    ].join("\n");

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `•  Changelog for ${version}  •  Full changelog available [here](https://github.com/SokoraDesu/Sokora/tree/dev/CHANGELOG.md).`,
        iconURL: avatar
      })
      .setDescription(text)
      .setFooter({ text: replace("(madeWith)") })
      .setThumbnail(avatar)
      .setColor(user.hexAccentColor ?? (await imageColor(undefined, avatar)) ?? genColor(270));

    await interaction.reply({ embeds: [embed] });
  }
}
