import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { readFile } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { version } from "../../package.json";
import { genColor } from "../utils/colorGen";
import { errorEmbed } from "../utils/embeds/errorEmbed";
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
    let rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `•  Changelog for ${version}`,
        iconURL: avatar
      })
      .setFooter({ text: replace("(madeWith)") })
      .setThumbnail(avatar)
      .setColor(user.hexAccentColor ?? (await imageColor(undefined, avatar)) ?? genColor(270));

    readFile(pathToFileURL(join(process.cwd(), "CHANGELOG.md")), async (_, changes) => {
      const baseLog = changes.toString().split("\n");
      let log = baseLog.filter(line => !line.startsWith("<!--") && !line.startsWith("# "));
      let row;
      let label;
      for (const line of baseLog) {
        if (line.startsWith("# ")) {
          label = line.slice(2);
          row = new ActionRowBuilder<ButtonBuilder>();
          row.addComponents(
            new ButtonBuilder().setCustomId(label).setLabel(label).setStyle(ButtonStyle.Secondary)
          );

          rows.push(row);
          continue;
        }

        if (line.startsWith("## ")) {
          const subLabel = line.slice(3);
          row!.addComponents(
            new ButtonBuilder()
              .setCustomId(`${label}${subLabel}`)
              .setLabel(subLabel)
              .setStyle(ButtonStyle.Secondary)
          );
          continue;
        }
      }

      embed.setDescription(log.join("\n"));
      rows[0].components[0].setDisabled(true).setStyle(ButtonStyle.Primary);
      rows[0].components[1].setDisabled(true).setStyle(ButtonStyle.Primary);

      const reply = await interaction.reply({ embeds: [embed], components: rows });
      const collector = reply.createMessageComponentCollector({ time: 30000 });
      collector.on("collect", async (i: ButtonInteraction) => {
        if (i.message.id != (await reply.fetch()).id)
          return await errorEmbed(
            i,
            "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that."
          );

        if (i.user.id != interaction.user.id)
          return await errorEmbed(i, "You aren't the person who executed this command.");

        collector.resetTimer({ time: 60000 });
        i.customId == "0.3.0"
          ? rows[0].components[0].setDisabled(true).setStyle(ButtonStyle.Primary)
          : rows[1].components[0].setDisabled(true).setStyle(ButtonStyle.Primary);

        switch (i.customId) {
          case "0.3.0":
            rows[1].components[0].setDisabled(false).setStyle(ButtonStyle.Secondary);
            embed.setDescription("test");
            await i.update({ embeds: [embed], components: rows });
            break;
          case "0.2.0":
            rows[0].components[0].setDisabled(false).setStyle(ButtonStyle.Secondary);
            embed.setDescription("balls");
            await i.update({ embeds: [embed], components: rows });
            break;
        }
      });

      collector.on("end", async () => await interaction.editReply({ components: [] }));
    });
  }
}
