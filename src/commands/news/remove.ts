import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  TextChannel,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { deleteNews, get } from "../../utils/database/news";
import { getSetting } from "../../utils/database/settings";
import { errorEmbed } from "../../utils/embeds/errorEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Removes news from your guild.")
  .addStringOption(string =>
    string
      .setName("id")
      .setDescription("The ID of the news. (found in the footer)")
      .setRequired(true),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageGuild"))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "You need the **Manage Server** permission.",
    );

  const id = interaction.options.getString("id")!;
  const news = get(guild.id, id);
  if (!news) return await errorEmbed(interaction, "The specified news don't exist.");

  const newsChannel = (await guild.channels
    .fetch((getSetting(guild.id, "news", "channel_id") as string) ?? interaction.channel?.id)
    .catch(() => null)) as TextChannel;

  if (newsChannel) await newsChannel.messages.delete(news.messageID);
  deleteNews(guild.id, id);
  await interaction.reply({
    embeds: [new EmbedBuilder().setTitle("News removed.").setColor(genColor(100))],
    flags: "Ephemeral",
  });
}
