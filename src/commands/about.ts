import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { simpleEmbedBuilder } from "embeds/simpleEmbedBuilder";
import { version } from "package";
import { Sokolors } from "utils/colorGen";
import { pluralOrNot } from "utils/pluralOrNot";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Shows information about Sokora.")
  .setContexts(0);

export async function run(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const user = await client.user.fetch(true);
  const guilds = client.guilds.cache;
  const members = guilds.map(guild => guild.memberCount).reduce((a, b) => a + b);
  const shards = client.shard?.count;
  const avatar = user.displayAvatarURL();
  const banner = user.bannerURL({ size: 512 });
  const embed = await simpleEmbedBuilder({
    author: "About Sokora",
    desc: "Sokora is a multipurpose Discord bot that lets you manage your servers easily.",
    fields: [
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
      { divider: false },
    ],
    footer: replace("(madeWith)"),
    color: { user, avatar, hue: Sokolors.Purple },
  });

  if (banner)
    embed.spliceComponents(
      0,
      0,
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(banner)),
    );

  embed.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("•  Vote")
        .setURL(`https://top.gg/bot/${user.id}/vote`)
        .setEmoji("🗳️")
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel("•  Donate")
        .setURL("https://ko-fi.com/sokoradesu")
        .setEmoji("☕")
        .setStyle(ButtonStyle.Link),
    ),
  );

  await interaction.reply({ components: [embed], flags: ["Ephemeral", "IsComponentsV2"] });
}
