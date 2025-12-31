import { listAllNews } from "database/news";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buttonCheck, errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";
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

  const news = listAllNews(interaction.guild.id);
  const sortedNews = (Object.values(news) as any[])?.sort((a, b) => b.createdAt - a.createdAt);

  if (!news || !sortedNews || !sortedNews.length)
    return await errorEmbed({
      interaction,
      title: "No news found.",
      reason: "Admins can add news with the **/news add** command.",
    });

  if (page > sortedNews.length) page = sortedNews.length;
  if (page < 1) page = 1;

  function getEmbed() {
    const currentNews = sortedNews[page - 1];
    const avatar = currentNews.authorPFP;
    return new EmbedBuilder()
      .setAuthor({
        name: `${dotCheck({ string: avatar, doubleSpace: true })}${currentNews.author}`,
        iconURL: avatar,
      })
      .setTitle(currentNews.title)
      .setDescription(currentNews.body)
      .setImage(currentNews.imageURL || null)
      .setTimestamp(parseInt(currentNews.updatedAt))
      .setFooter({
        text: `${sortedNews.length > 1 ? `Page ${page} of ${sortedNews.length} • ` : ""}ID: ${currentNews.id}`,
      })
      .setColor(genColor(200));
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
    embeds: [getEmbed()],
    components: sortedNews.length > 1 ? [row] : [],
  });

  if (page < 1) return;
  const collector = reply.createMessageComponentCollector({ time: 30000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    await buttonCheck({ i, interaction, reply, cv2: false });
    collector.resetTimer({ time: 30000 });
    switch (i.customId) {
      case "left":
        page--;
        if (page < 1) page = sortedNews.length;
        await i.update({ embeds: [getEmbed()], components: [row] });
        break;
      case "right":
        page++;
        if (page > sortedNews.length) page = 1;
        await i.update({ embeds: [getEmbed()], components: [row] });
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
