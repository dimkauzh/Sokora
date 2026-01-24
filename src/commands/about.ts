import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { version } from "package";
import { colorize } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { pluralOrNot } from "utils/pluralOrNot";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Shows information about Sokora.")
  .setContexts(0);

export async function run(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const user = client.user;
  const guilds = client.guilds.cache;
  const members = guilds.map(guild => guild.memberCount).reduce((a, b) => a + b);
  const shards = client.shard?.count;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}About Sokora`,
      iconURL: avatar,
    })
    .setDescription(
      "Sokora is a multipurpose Discord bot that lets you manage your servers easily.",
    )
    .setFields(
      {
        name: "📃 • General",
        value: [
          `Version **${version}**, *Heijun*`,
          `**${members.toLocaleString("en-US")}** ${pluralOrNot("member", members)} • **${guilds.size.toLocaleString("en-US")}** ${pluralOrNot(
            "guild",
            guilds.size,
          )}${!shards ? "" : ` • **${shards}** ${pluralOrNot("shard", shards)}`}`,
        ].join("\n"),
      },
      {
        name: "🔗 • Links",
        value: [
          "[Discord](https://discord.gg/c6C25P4BuY) • [GitHub](https://www.github.com/SokoraDesu) • [YouTube](https://www.youtube.com/@SokoraDesu) • [Mastodon](https://mastodon.online/@NebulaTheBot@mastodon.social)",
          "Also, please read the [ToS](https://sokora.org/terms) and the [privacy policy](https://sokora.org/privacy).",
        ].join("\n"),
      },
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(await colorize({ user, avatar, hue: 270 }));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("•  Vote")
      .setURL(`https://top.gg/bot/${user.id}/vote`)
      .setEmoji("🗳️")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("•  Donate through Ko-Fi")
      .setURL("https://ko-fi.com/sokoradesu")
      .setEmoji("☕")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("or through PayPal!")
      .setURL("https://paypal.me/SokoraTheBot")
      .setStyle(ButtonStyle.Link),
  );

  await interaction.reply({ embeds: [embed], components: [row], flags: "Ephemeral" });
}
