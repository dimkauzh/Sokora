import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { genColor, genImageColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("credits")
  .setDescription("Shows everyone who worked on Sokora.");

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}Entities involved`,
      iconURL: avatar,
    })
    .setDescription(
      [
        "**Founder**: Goos",
        "**Developers**: Froxcey, Golem64, Koslz, Nikkerudon, Zayaan AR",
        "**Designer lead**: ZakaHaceCosas",
        "**Designers**: ArtyH, Pjanda",
        "**Translators**: Dimkauzh, flojo, Golem64, GraczNet, Nikkerudon, SaFire, TrulyBlue, ZakaHaceCosas",
        "**Testers**: Blaze, fishy, Trynera",
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  await interaction.reply({ embeds: [embed] });
}
