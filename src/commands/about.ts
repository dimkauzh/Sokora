import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import SimpleEmbedBuilder from "embeds/SimpleEmbedBuilder";
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
  const cv2 = true;
  const embed = await SimpleEmbedBuilder.from(
    {
      author: `About Sokora`,
      thumb: !cv2 ? avatar : "",
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
      ],
      footer: replace("(madeWith)"),
      color: { user, avatar, hue: Sokolors.Purple },
    },
    cv2,
  );

  if (cv2)
    if (banner)
      (embed as ContainerBuilder).spliceComponents(
        0,
        0,
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(banner)),
      );

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
  );

  const messageObject: any = { components: [row], flags: ["Ephemeral"] };
  if (cv2) {
    messageObject.components.splice(0, 0, embed);
    messageObject.flags.push("IsComponentsV2");
  } else messageObject.embeds = [embed];

  await interaction.reply(messageObject);
}
