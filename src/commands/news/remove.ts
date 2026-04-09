import { deleteNews, getNews } from "database/news";
import { getSetting } from "database/settings";
import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  TextChannel,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { safeChannel, safeMember } from "utils/safeThings";

export const data = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Removes a news post.")
  .addStringOption(string =>
    string
      .setName("id")
      .setDescription("The ID of the news. (found in the footer)")
      .setRequired(true),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!(await safeMember(guild, interaction.user.id)).permissions.has("ManageGuild"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Manage Server** permission.",
    });

  const id = interaction.options.getString("id")!;
  const news = await getNews(guild.id, id);
  if (!news) return await errorEmbed({ interaction, title: "The specified news don't exist." });
  const newsChannel = (await safeChannel(
    guild,
    ((await getSetting(guild.id, "news", "channel")) as string) ?? interaction.channel?.id,
  )) as TextChannel;

  if (newsChannel) if (news.messageID) await newsChannel.messages.delete(news.messageID);
  await deleteNews(guild.id, id);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("News removed.")
        .setColor(await colorize({ hue: Sokolors.Green })),
    ],
    flags: "Ephemeral",
  });
}
