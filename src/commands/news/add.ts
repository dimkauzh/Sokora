import { getLatestNews } from "database/news";
import {
  EmbedBuilder,
  FileUploadBuilder,
  LabelBuilder,
  ModalBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { replaceVariables } from "utils/replace";
import { safeMember } from "utils/safeThings";
import { sendChannelNews } from "utils/sendChannelNews";

export const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription("Add a news post.");

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!(await safeMember(guild, interaction.user.id)).permissions.has("ManageGuild"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Manage Server** permission.",
    });

  const newsModal = new ModalBuilder()
    .setCustomId("addnews")
    .setTitle("•  Post your news.")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Title")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("title")
            .setPlaceholder("Think of a title")
            .setMaxLength(30)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      new LabelBuilder()
        .setLabel("Content (supports Markdown)")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("body")
            .setPlaceholder("Insert your content here")
            .setMaxLength(4000)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true),
        ),
      new LabelBuilder()
        .setLabel("Optionally, upload a banner image")
        .setFileUploadComponent(
          new FileUploadBuilder().setCustomId("image").setMinValues(0).setRequired(false),
        ),
    );

  try {
    await interaction.showModal(newsModal);
  } catch (error) {
    await errorEmbed({ interaction, error, forward: true, fileName: "add.ts" });
  }

  interaction.client.once("interactionCreate", async i => {
    if (!i.isModalSubmit()) return;
    const title = await replaceVariables(
      i.fields.getTextInputValue("title"),
      interaction.guild!,
      interaction.user,
    );

    const body = await replaceVariables(
      i.fields.getTextInputValue("body"),
      interaction.guild!,
      interaction.user,
    );

    try {
      await sendChannelNews(guild, interaction, {
        title,
        body,
        author: i.user.displayName,
        authorPFP: i.user.avatarURL()!,
        imageURL: i.fields.getUploadedFiles("image")?.at(0)?.url ?? null,
        id: ((await getLatestNews(guild.id))[0]?.id || 0) + 1,
      });
    } catch (error) {
      return await errorEmbed({ interaction, error, forward: true, fileName: "add.ts" });
    }

    await i.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("News added.")
          .setColor(await colorize({ hue: Sokolors.Green })),
      ],
      flags: "Ephemeral",
    });
  });
}
