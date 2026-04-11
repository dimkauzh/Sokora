import { listAllNews } from "database/news";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buttonCheck, errorEmbed } from "embeds/errorEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { dotCheck } from "utils/dotCheck";
import { replace } from "utils/replace";

export const data = new SlashCommandSubcommandBuilder()
  .setName("view")
  .setDescription("View the news of this server.")
  .addNumberOption(number =>
    number.setName("page").setDescription("The page of the news that you want to see."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  let page = interaction.options.getNumber("page") ?? 1;
  if (!interaction.guild)
    return await errorEmbed({
      interaction,
      title: "Error viewing news.",
      reason: "This command can only be used in a server.",
    });

  const news = await listAllNews(interaction.guild.id);

  if (!news || !news.length)
    return await errorEmbed({
      interaction,
      title: "No news found.",
      reason: "Admins can add news with the **/news add** command.",
    });

  if (page > news.length) page = news.length;
  if (page < 1) page = 1;

  async function getEmbed() {
    const currentNews = news[page - 1];
    const avatar = currentNews.authorPFP;
    return new EmbedBuilder()
      .setAuthor({
        name: `${dotCheck({ string: avatar, doubleSpace: true })}${currentNews.author}`,
        iconURL: avatar,
      })
      .setTitle(currentNews.title)
      .setDescription(currentNews.body)
      .setImage(currentNews.imageURL || null)
      .setTimestamp(currentNews.updatedAt || currentNews.createdAt)
      .setFooter({
        text: `${news.length > 1 ? `Page ${page} of ${news.length} • ` : ""}ID: ${currentNews.id}`,
      })
      .setColor(await colorize({ hue: Sokolors.Blue }));
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("left")
      .setEmoji(replace("(leftArrow)"))
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("right")
      .setEmoji(replace("(rightArrow)"))
      .setStyle(ButtonStyle.Primary),
  );

  const reply = await interaction.reply({
    embeds: [await getEmbed()],
    components: news.length > 1 ? [row] : [],
  });

  if (page < 1) return;
  const collector = reply.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    // [TODO] fix cv2 error (how)
    if (await buttonCheck({ i, interaction, reply })) return;
    collector.resetTimer({ time: 60000 });
    switch (i.customId) {
      case "left":
        page--;
        if (page < 1) page = news.length;
        await i.update({ embeds: [await getEmbed()], components: [row] });
        break;
      case "right":
        page++;
        if (page > news.length) page = 1;
        await i.update({ embeds: [await getEmbed()], components: [row] });
        break;
    }
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (error) {
      if (Error.isError(error) && error.message.toLowerCase().includes("unknown message")) return;
      throw error;
    }
  });
}
