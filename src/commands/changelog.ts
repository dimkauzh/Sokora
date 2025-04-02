import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { version } from "../../package.json";
import { genColor, genImageColor } from "../utils/colorGen";
import { replace } from "../utils/replace";
import { parseChangelogString } from "../utils/parseChangelog";
import { pathToFileURL } from "bun";
import { join } from "path";
import { errorEmbed } from "../utils/embeds/errorEmbed";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription(`Shows what's changed in Sokora's latest version, ${version}`);

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  const versions = parseChangelogString(
    await Bun.file(pathToFileURL(join(process.cwd(), "CHANGELOG.md"))).text()
  );

  const buttons: ButtonBuilder[] = []

  for (const version of versions) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(version.ver)
        .setLabel(version.ver)
        .setStyle(ButtonStyle.Primary)
    )
  }

  const row = new ActionRowBuilder()
    .addComponents(...buttons);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `•  Changelog for ${version}`, iconURL: avatar })
    .setDescription([versions[0].changelog, "-# See older versions [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md)."].join("\n"))
    .setFooter({ text: replace("(madeWith)") })
    .setThumbnail(avatar)
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  // @ts-expect-error whatever, it works
  await interaction.reply({ embeds: [embed], components: [row] });
  // @ts-expect-error whatever, it works
  const reply = await interaction.editReply({ embeds: [embed], components: [row] });

  const collector = reply.createMessageComponentCollector({ time: 30000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbed(
        i,
        "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      );

    if (i.user.id != interaction.user.id)
      return await errorEmbed(i, "You aren't the person who executed this command.");

    collector.resetTimer({ time: 30000 });
    const id = i.customId;
    const version = versions.find(v => v.ver === id);
    if (version) {
      embed
        .setAuthor({ name: `•  Changelog for ${version.ver}`, iconURL: avatar })
        .setDescription([version.changelog, "-# See older versions [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md)."].join("\n"));
      // @ts-expect-error whatever, it works
      await i.update({ embeds: [embed], components: [row] });
    }
  });

  collector.on("end", async () => await interaction.editReply({ components: [] }));
}
