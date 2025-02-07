import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getSetting } from "../utils/database/settings";
import { getGuildStarboard } from "../utils/database/starboard";
import { TypeOfDefinition } from "../utils/database/types";
import { errorEmbed } from "../utils/embeds/errorEmbed";

type StarboardEntry = TypeOfDefinition<{
  name: "starboard";
  definition: {
    guild: "TEXT";
    message: "TEXT";
    channel: "TEXT";
    author: "TEXT";
    star_message: "TEXT";
    stars: "INTEGER";
    content: "TEXT";
    timestamp: "TEXT";
  };
}>;

export const data = new SlashCommandBuilder()
  .setName("starboard")
  .setDescription("View starboard statistics and top messages")
  .addNumberOption(option =>
    option.setName("page").setDescription("The page of starred messages to view").setMinValue(1),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const { guild } = interaction;
  if (!guild) return;

  const enabled = getSetting(guild.id, "starboard", "enabled");
  if (!enabled) {
    return await errorEmbed(
      interaction,
      "Starboard is disabled",
      "Ask an administrator to enable the starboard system",
    );
  }

  const starredMessages = getGuildStarboard(guild.id, 50); // Get more messages for pagination
  const pages = Math.ceil(starredMessages.length / 5);

  if (starredMessages.length === 0) {
    return await errorEmbed(
      interaction,
      "No starred messages",
      "There are no starred messages in this server yet",
    );
  }

  const argPage = interaction.options.getNumber("page") as number;
  let page = (argPage - 1 <= 0 ? 0 : argPage - 1 > pages ? pages - 1 : argPage - 1) || 0;

  function getEmbed() {
    const startIndex = page * 5;
    const pageMessages = starredMessages.slice(startIndex, startIndex + 5);

    return new EmbedBuilder()
      .setTitle("⭐ Top Starred Messages")
      .setColor("#FFD700")
      .setDescription(
        pageMessages
          .map(
            (entry: StarboardEntry, i: number) =>
              `${startIndex + i + 1}. ${entry.stars}⭐ - <@${entry.author}> in <#${
                entry.channel
              }>\n${
                entry.content.length > 100 ? entry.content.slice(0, 97) + "..." : entry.content
              }`,
          )
          .join("\n\n"),
      )
      .setFooter({ text: `Page ${page + 1}/${pages}` });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("left")
      .setEmoji("1298708251256291379")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("right")
      .setEmoji("1298708281493160029")
      .setStyle(ButtonStyle.Primary),
  );

  const reply = await interaction.reply({
    embeds: [getEmbed()],
    components: pages != 1 ? [row] : [],
  });
  if (pages == 1) return;

  const collector = reply.createMessageComponentCollector({ time: 30000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbed(
        i,
        "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      );

    if (i.user.id != interaction.user.id)
      return await errorEmbed(i, "You aren't the person who executed this command.");

    collector.resetTimer({ time: 30000 });
    switch (i.customId) {
      case "left":
        page--;
        if (page < 0) page = pages - 1;
        break;
      case "right":
        page++;
        if (page >= pages) page = 0;
        break;
    }

    await i.update({
      embeds: [getEmbed()],
    });
  });
}
