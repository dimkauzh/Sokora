import { deletePublicServer, listPublicServers } from "database/settings";
import {
  type InteractionResponse,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Guild,
  type Message,
  type ContainerBuilder,
} from "discord.js";
import { buttonCheck, errorEmbed } from "embeds/errorEmbed";
import { serverEmbed } from "embeds/serverEmbed";
import { safeGuild } from "utils/safeThings";

export const data = new SlashCommandBuilder()
  .setName("serverboard")
  .setDescription("Shows the servers that have Sokora.")
  .addNumberOption(number => number.setName("page").setDescription("The page you want to see."))
  .setContexts(0);

export async function run(
  interaction: ChatInputCommandInteraction,
): Promise<Message | InteractionResponse | undefined> {
  const guildList: { guild: Guild; showInvite: boolean; inviteChannelId: string | null }[] = (
    await Promise.all(
      (await listPublicServers()).map(async entry => {
        try {
          return {
            guild: await safeGuild(interaction.client, entry.guildID),
            showInvite: entry.showInvite,
            inviteChannelId: entry.inviteChannelId,
          };
        } catch (error) {
          if (String(error).toLowerCase().includes("unknown guild")) {
            await deletePublicServer(entry.guildID);
            return null;
          }
          await errorEmbed({
            interaction,
            error,
            title: "Serverboard error.",
            log: true,
            forward: true,
            fileName: "serverboard.ts",
          });
          return null;
        }
      }),
    )
  )
    .filter(entry => entry != null)
    .toSorted((a, b) => b.guild.memberCount - a.guild.memberCount);

  const pages = guildList.length;
  if (!pages)
    return await errorEmbed({
      interaction,
      title: "No public server found.",
      reason:
        "By some magical miracle, all the servers using Sokora turned off their visibility. Use /settings serverboard `shown: True` to make your server publicly visible.",
    });

  const argumentPage = interaction.options.getNumber("page");
  if (!argumentPage)
    return await errorEmbed({
      interaction,
      title: "No page provided.",
      reason:
        "You somehow ran the command without a page being provided. That is an error. You might want to report this, as it is not supposed to ever happen.",
    });
  let page =
    (argumentPage - 1 <= 0 ? 0 : (argumentPage - 1 > pages ? pages - 1 : argumentPage - 1)) || 0;

  async function getContainer(disableButtons?: boolean): Promise<ContainerBuilder> {
    return await serverEmbed({
      guild: guildList[page].guild,
      invite: {
        show: guildList[page].showInvite,
        channel: guildList[page].inviteChannelId,
      },
      page: page + 1,
      pages,
      roles: false,
      disableButtons,
    });
  }

  const reply = await interaction.reply({
    components: [await getContainer(false)],
    flags: "IsComponentsV2",
  });
  if (pages == 1) return;
  const collector = reply.createMessageComponentCollector({ time: 60_000 });

  collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
    if (await buttonCheck({ i: buttonInteraction, interaction, reply })) return;
    collector.resetTimer({ time: 60_000 });
    switch (buttonInteraction.customId) {
      case "left": {
        page--;
        if (page < 0) page = pages - 1;
        break;
      }
      case "right": {
        page++;
        if (page >= pages) page = 0;
        break;
      }
    }

    await buttonInteraction.update({ components: [await getContainer(false)] });
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [await getContainer(true)] });
    } catch (error) {
      if (Error.isError(error) && error.message.toLowerCase().includes("unknown message")) return;
      throw error;
    }
  });
}
