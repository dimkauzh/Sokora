import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Guild,
  GuildManager,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { listPublicServers } from "../utils/database/settings";
import { errorEmbed } from "../utils/embeds/errorEmbed";
import { serverEmbed } from "../utils/embeds/serverEmbed";

export const data = new SlashCommandBuilder()
  .setName("serverboard")
  .setDescription("Shows the servers that have Sokora.")
  .addNumberOption(number => number.setName("page").setDescription("The page you want to see."));

export async function run(interaction: ChatInputCommandInteraction) {
  const guildList: { guild: Guild; showInvite: boolean; inviteChannelId: string | null }[] = (
    await Promise.all(
      listPublicServers().map(async entry => {
        try {
          return {
            guild: await interaction.client.guilds.fetch(entry.guildID),
            showInvite: entry.showInvite,
            inviteChannelId: entry.inviteChannelId,
          };
        } catch {
          // skip entry (we'll get into here most likely because of sokora not being inside of a listable server)
          // most likely a server kicking sokora without disabling serverboard
          // TODO - remove the server ID from the list too
          return null;
        }
      }),
    )
  )
    .filter(entry => entry !== null)
    .sort((a, b) => b.guild.memberCount - a.guild.memberCount);

  const pages = guildList.length;
  if (!pages)
    return await errorEmbed(
      interaction,
      "No public server found.",
      "By some magical miracle, all the servers using Sokora turned off their visibility. Use /settings serverboard `shown: True` to make your server publicly visible.",
    );

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
      .setEmoji("1298708251256291379")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("right")
      .setEmoji("1298708281493160029")
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

    await i.update({ embeds: [await getEmbed()], components: [row] });
  });

  collector.on("end", async () => await interaction.editReply({ components: [] }));
}
