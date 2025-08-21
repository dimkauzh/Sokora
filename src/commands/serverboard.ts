import { listPublicServers } from "database/settings";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Guild,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { serverEmbed } from "embeds/serverEmbed";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("serverboard")
  .setDescription("Shows the servers that have Sokora.")
  .addNumberOption(number => number.setName("page").setDescription("The page you want to see."));

export async function run(interaction: ChatInputCommandInteraction) {
  const guildList: { guild: Guild; showInvite: boolean; inviteChannelId: string | null }[] = (
    await Promise.all(
      (await listPublicServers()).map(async entry => {
        try {
          return {
            guild: await interaction.client.guilds.fetch(entry.guildID),
            showInvite: entry.showInvite,
            inviteChannelId: entry.inviteChannelId,
          };
        } catch (error) {
          // log it instead of deleting it
          // so we can eventually find what specific error
          // we should use to delete a public server
          console.error("Serverboard error", error);
          console.error("The above will lead to not showing the guild in the serverboard.");
          // await deletePublicServer(entry.guildID);
          return null;
        }
      }),
    )
  )
    .filter(entry => entry != null)
    .sort((a, b) => b.guild.memberCount - a.guild.memberCount);

  const pages = guildList.length;
  if (!pages)
    return await errorEmbed({
      interaction,
      title: "No public server found.",
      reason:
        "By some magical miracle, all the servers using Sokora turned off their visibility. Use /settings serverboard `shown: True` to make your server publicly visible.",
    });

  const argPage = interaction.options.getNumber("page") as number;
  let page = (argPage - 1 <= 0 ? 0 : argPage - 1 > pages ? pages - 1 : argPage - 1) || 0;

  async function getEmbed() {
    return await serverEmbed({
      guild: guildList[page].guild,
      invite: {
        show: guildList[page].showInvite,
        channel: guildList[page].inviteChannelId,
      },
      page: page + 1,
      pages,
      roles: false,
    });
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
    components: pages != 1 ? [row] : [],
  });
  if (pages == 1) return;

  const collector = reply.createMessageComponentCollector({ time: 30000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbed({
        interaction: i,
        title:
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      });

    if (i.user.id != interaction.user.id)
      return await errorEmbed({
        interaction: i,
        title: "You aren't the person who executed this command.",
      });

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

    await i.update({ embeds: [await getEmbed()], components: [row] });
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
