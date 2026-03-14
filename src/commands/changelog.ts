import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ClientUser,
  ComponentType,
  ContainerBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { colorize, Sokolors } from "utils/colorGen";
import { replace } from "utils/replace";
import { getChangelog, getVersions } from "../utils/changelog";
import { buttonCheck } from "embeds/errorEmbed";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription("Shows Sokora's changelog.")
  .setContexts(0);

async function genChangelog(
  user: ClientUser,
  changelog: ReturnType<typeof getChangelog>,
  list: ReturnType<typeof getVersions>,
): Promise<ContainerBuilder> {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## Changelog for ${changelog.ver}${changelog.codename ? ` • *${changelog.codename}*` : ""}`,
      ),
      new TextDisplayBuilder().setContent(changelog.body),
      new TextDisplayBuilder().setContent(
        `-# Released ${changelog.date} • ${replace("(madeWith)")}`,
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...list.map(v =>
          new ButtonBuilder()
            .setLabel(v.ver)
            .setCustomId(v.ver)
            .setStyle(v.minor ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(v.ver === changelog.ver),
        ),
      ),
    )
    .setAccentColor(
      await colorize({ user, avatar: user.displayAvatarURL(), hue: Sokolors.Purple }),
    );
}

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const logList = getVersions();
  const container = await genChangelog(user, getChangelog(logList[0].ver), logList.slice(0, 5));

  const reply = await interaction.reply({
    components: [container],
    flags: ["Ephemeral", "IsComponentsV2"],
  });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000,
  });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (await buttonCheck({ i, interaction, reply })) return;
    collector.resetTimer({ time: 120000 });

    const found = logList.findIndex(v => v.ver === i.customId);
    const idx = Math.max(0, Math.min(found - 2, logList.length - 3));
    console.log(i.customId);
    console.log(getChangelog(i.customId));
    return await i.update({
      components: [await genChangelog(user, getChangelog(i.customId), logList.slice(idx, idx + 5))],
      flags: ["IsComponentsV2"],
    });
  });
}
