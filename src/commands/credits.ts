import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { genColor } from "../utils/colorGen";
import { imageColor } from "../utils/imageColor";
import { replace } from "../utils/replace";

export const data = new SlashCommandBuilder()
  .setName("credits")
  .setDescription("Shows everyone who worked on Sokora.");

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: "•  Entities involved", iconURL: avatar })
    .setDescription(
      [
        "**Founder**: Goos",
        "**Developers**: Dimkauzh, Froxcey, Golem64, Koslz, Littie, MQuery, Nikkerudon, Spectrum, ThatBOI",
        "**Designers**: ArtyH, ZakaHaceCosas, Pjanda",
        "**Translator Lead**: ThatBOI",
        "**Translators**: Dimkauzh, flojo, Golem64, GraczNet, Nikkerudon, ZakaHaceCosas, SaFire, TrulyBlue",
        "**Testers**: Blaze, fishy, Trynera",
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setThumbnail(avatar)
    .setColor(user.hexAccentColor ?? (await imageColor(undefined, avatar)) ?? genColor(270));

  await interaction.reply({ embeds: [embed] });
}
