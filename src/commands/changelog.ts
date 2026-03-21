import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ClientUser,
  ContainerBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buttonCheck } from "embeds/errorEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { replace } from "utils/replace";
import { getChangelog, getVersions } from "../utils/changelog";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription("Shows Sokora's changelog.")
  .setContexts(0);

async function genChangelog(
  user: ClientUser,
  changelog: ReturnType<typeof getChangelog>,
  viewing: keyof ReturnType<typeof getChangelog>["body"],
  list: ReturnType<typeof getVersions>,
): Promise<ContainerBuilder> {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## What's ${viewing.toLowerCase()} in ${changelog.ver}${changelog.codename ? ` • *${changelog.codename}*` : ""}`,
      ),
      new TextDisplayBuilder().setContent(changelog.body[viewing]),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...Object.keys(changelog.body).map(v =>
          new ButtonBuilder()
            .setLabel(v)
            .setCustomId(v + "+" + changelog.ver)
            .setStyle(
              {
                Fixed: ButtonStyle.Secondary,
                Added: ButtonStyle.Success,
                Removed: ButtonStyle.Danger,
                Changed: ButtonStyle.Secondary,
              }[v]!,
            )
            .setDisabled(v === viewing),
        ),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
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
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Use the buttons above to view categories (like what we added or changed) or view other versions.\n-# Released ${changelog.date} • ${replace("(madeWith)")}`,
      ),
    )
    .setAccentColor(
      await colorize({ user, avatar: user.displayAvatarURL(), hue: Sokolors.Purple }),
    );
}

function getDefaultCategoryToView(
  changelog: ReturnType<typeof getChangelog>,
): keyof ReturnType<typeof getChangelog>["body"] {
  return changelog.body["Added"]
    ? "Added"
    : changelog.body["Changed"]
      ? "Changed"
      : changelog.body["Fixed"]
        ? "Fixed"
        : "Removed";
}

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const logList = getVersions();
  const changelog = getChangelog(logList[0].ver);
  const container = await genChangelog(
    user,
    changelog,
    getDefaultCategoryToView(changelog),
    logList.slice(0, 5),
  );

  const reply = await interaction.reply({
    components: [container],
    flags: ["Ephemeral", "IsComponentsV2"],
  });
  const collector = reply.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (await buttonCheck({ i, interaction, reply })) return;
    collector.resetTimer({ time: 60000 });

    const split = i.customId.replace("-", "").split("+");
    const newVer = ["Added", "Changed", "Fixed", "Removed"].some(s =>
      i.customId.startsWith(s + "+"),
    )
      ? split[1]
      : split[0];

    const found = logList.findIndex(v => v.ver === newVer);
    const idx = Math.max(0, Math.min(found - 2, logList.length - 3));
    const log = getChangelog(newVer);
    return await i.update({
      components: [
        await genChangelog(
          user,
          log,
          split[1] ? (split[0] as any) : getDefaultCategoryToView(log),
          logList.slice(idx, idx + 5).filter(v => v !== undefined),
        ),
      ],
    });
  });

  collector.on("end", async () => {
    try {
      await interaction.deleteReply();
    } catch (error) {
      if (Error.isError(error) && error.message.toLowerCase().includes("unknown message")) return;
      throw error;
    }
  });
}
