import { Leveler, SupportedBots } from "@hokkiai/djs-level-importer";
import { calculateLevel, getUserXp, setUserXp } from "database/leveling";
import { getSetting } from "database/settings";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  codeBlock,
  ContainerBuilder,
  FileBuilder,
  LabelBuilder,
  ModalBuilder,
  PermissionsBitField,
  RGBTuple,
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { buttonCheck } from "embeds/errorEmbed";
import { colorize } from "utils/colorGen";
import { safeReply } from "utils/safeThings";

export const data = new SlashCommandBuilder()
  .setName("import")
  .setDescription("Imports leveling data from another bot.")
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

function safeStringify(obj: any) {
  try {
    const str = JSON.stringify(obj, null, 2);
    if (str.length < 3800) return str;
    return str.slice(0, 3800) + "\n// etc... (had to trim it because of discord character limits)";
  } catch {
    return "[Unserializable data, please report this as an issue]";
  }
}

async function collapse(
  error: any,
  cID: keyof typeof SupportedBots,
  interaction: ChatInputCommandInteraction,
  containerHelper: (...args: any) => Promise<ContainerBuilder>,
  lurkr_api?: string,
) {
  const errorContainer = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("# Something went wrong..."),
    new TextDisplayBuilder().setContent(
      [
        cID === "MEE6"
          ? "Open the leaderboard settings in the MEE6 dashboard and enable the option `Make my server's leaderboard public`. Otherwise we can't import data."
          : cID === "LURKR"
            ? "Check that the API token you provided is correct. You provided `" + lurkr_api + "`."
            : "We don't really know what went wrong. Maybe you should try again?",
        "You might as well check the error message shown below, it *might* explain better what's wrong.",
        "If after doing all of that Sokora keeps failing to import your data, please send the error message to Sokora's team so we can try to fix this.",
        `\`\`\`yaml\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}\`\`\``,
      ].join("\n\n"),
    ),
  );

  return await safeReply({
    interaction,
    editOptions: {
      components: [await containerHelper(errorContainer, { error: true })],
      flags: "IsComponentsV2",
    },
  });
}

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  if (!interaction.guild) return;

  async function containerHelper(
    container: ContainerBuilder,
    options: {
      content?: string;
      buttons?: boolean;
      error?: boolean;
      json?: boolean;
      footer?: boolean;
    },
  ): Promise<ContainerBuilder> {
    const { content, buttons, error, json } = options;
    if (content) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    if (buttons)
      container.addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("botreturn")
            .setLabel("Return to bot selection")
            .setStyle(ButtonStyle.Primary),
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("merge")
            .setLabel("Merge data")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("overwrite")
            .setLabel("Overwrite data")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(json ? "return" : "check")
            .setLabel(json ? "Return" : "Check JSON data first")
            .setStyle(ButtonStyle.Primary),
        ),
      );

    const color = (await colorize({ user, avatar, hue: 300, cv2: true })) as RGBTuple;
    const errorColor = (await colorize({ user, avatar, hue: 0, cv2: true })) as RGBTuple;
    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "-# Powered by `djs-level-importer`, an open-source library by Sokora and others.",
        ),
      )
      .setAccentColor(error ? errorColor : color);

    return container;
  }

  const bots: { content: string; id: keyof typeof SupportedBots }[] = [
    { content: "Tatsu\n-# Import from [Tatsu](https://tatsu.gg/)", id: "TATSU" },
    { content: "MEE6\n-# Import from [MEE6](http://mee6.xyz/)", id: "MEE6" },
    { content: "Lurkr\n-# Import from [Lurkr](https://lurkr.gg/)", id: "LURKR" },
  ];
  const containerComponents = [];
  for (const bot of bots)
    containerComponents.push(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(bot.content))
        .setButtonAccessory(
          new ButtonBuilder().setCustomId(bot.id).setLabel("Import").setStyle(ButtonStyle.Primary),
        ),
    );

  const container = new ContainerBuilder().addSectionComponents(containerComponents);
  const reply = await safeReply({
    interaction,
    replyOptions: {
      components: [await containerHelper(container, {})],
      flags: ["IsComponentsV2"],
    },
  });
  const collector = reply.createMessageComponentCollector({ time: 120000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    await buttonCheck({ i, interaction, reply, cv2: true });
    collector.resetTimer({ time: 120000 });
    const cID = i.customId as keyof typeof SupportedBots;
    const bots = {
      name: cID === "MEE6" ? cID.toUpperCase() : cID,
      data: [
        "- User XP",
        cID === "TATSU" ? "-# Note: Tatsu doesn't have role rewards." : "- Role rewards",
        "-# Settings like difficulty (which dictate the amount of XP needed to levelup) can't be imported. Levels might immediately change when chatting if you don't manually change the difficulty (and the current one differs too much from this one, which isn't necessarily the case).",
      ].join("\n"),
    };

    try {
      async function doStuff(lurkrKey?: string) {
        const leveler = new Leveler({
          guild: interaction.guildId!,
          tatsu_api: process.env["TATSU_TOKEN"],
          lurkr_api: lurkrKey,
        });
        let levels =
          cID === "MEE6"
            ? await leveler.GetLeaderboard(SupportedBots.MEE6)
            : await leveler.GetLeaderboard(SupportedBots.TATSU);

        if (cID === "LURKR" && lurkrKey) levels = await leveler.GetLeaderboard(SupportedBots.LURKR);
        const container1 = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              `Thanks for switching to Sokora! We will import leveling info from **${bots.name}** that we can gather. This includes a total of **${levels.length} entries**.`,
              `Data we can import from ${bots.name} is:\n${bots.data}`,
              `You may now import data by **merging** (adding imported XP to Sokora's XP) or by **overwriting** (removing Sokora's leveling data, then adding imported XP data). You can also review the JSON data that is to be imported, just in case.`,
            ].join("\n\n"),
          ),
        );

        const reply1 = await safeReply({
          interaction: i,
          replyOptions: {
            components: [await containerHelper(container1, { buttons: true })],
            flags: "IsComponentsV2",
          },
        });

        collector.stop("bot_chosen");
        const collector1 = reply1.createMessageComponentCollector({ time: 120000 });
        collector1.on("collect", async (i1: ButtonInteraction) => {
          await buttonCheck({ i: i1, interaction: i, reply: reply1, cv2: true });
          collector1.resetTimer({ time: 120000 });
          let content;
          switch (i1.customId) {
            case "botreturn":
              await safeReply({
                interaction: i1,
                replyOptions: { components: [container], flags: "IsComponentsV2" },
              });
              collector1.stop("bot_chosen");
              break;
            case "check": {
              const levelData = safeStringify(levels);
              const checkContainer = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `## This is what we'll import from ${bots.name}\n${
                    levelData.length <= 4096
                      ? codeBlock(levelData)
                      : "The level data is an attachment due to it being too large."
                  }`,
                ),
              );

              const files: AttachmentBuilder[] = [];
              if (levelData.length >= 4096) {
                files.push(
                  new AttachmentBuilder(Buffer.from(levelData, "utf8"), { name: "levels.txt" }),
                );
                checkContainer.addFileComponents(
                  new FileBuilder().setURL("attachment://levels.txt"),
                );
              }

              await safeReply({
                interaction: i1,
                replyOptions: {
                  components: [
                    await containerHelper(checkContainer, { buttons: true, json: true }),
                  ],
                  files: files,
                  flags: "IsComponentsV2",
                },
              });
              break;
            }
            case "return":
              await safeReply({
                interaction: i1,
                replyOptions: { components: [container1], flags: "IsComponentsV2" },
              });
              break;
            case "merge":
            case "overwrite": {
              content = `# ${i1.customId == "merge" ? "Updating" : "Overwriting"} data for all users...`;
              const res = [];
              await safeReply({
                interaction: i1,
                replyOptions: {
                  components: [await containerHelper(new ContainerBuilder(), { content })],
                  flags: "IsComponentsV2",
                },
              });

              const difficulty = (await getSetting(
                interaction.guild!.id,
                "leveling",
                "difficulty",
              )) as number;
              for (const user of interaction.guild!.members.cache) {
                if (user[1].user.bot) continue;
                const imported = levels.find(lev => lev.uid == user[1].id);
                if (!imported) {
                  res.push(
                    `${user[1].user.username} wasn't imported (had no data saved in the imported dataset)`,
                  );
                  continue;
                }
                const prevXp = getUserXp(interaction.guildId!, user[1].id);
                const newXp = (i1.customId == "merge" ? prevXp : 0) + imported.current_xp;
                setUserXp(interaction.guildId!, user[1].id, newXp);
                res.push(
                  `${user[1].user.username} updated from ${prevXp} XP (level ${calculateLevel({ xp: prevXp, difficulty })}) to **XP ${newXp} (level ${calculateLevel({ xp: newXp, difficulty })})**.`,
                );
              }

              content = `# Done!\n${res.join("\n")}`;
              await safeReply({
                interaction: i1,
                replyOptions: {
                  components: [await containerHelper(new ContainerBuilder(), { content })],
                  flags: "IsComponentsV2",
                },
              });
            }
          }
        });

        collector1.on("end", async (_, reason) => {
          if (reason === "bot_chosen") return;
          try {
            await interaction.deleteReply();
          } catch (error) {
            if (Error.isError(error) && error.message.toLowerCase().includes("unknown message"))
              return;
            throw error;
          }
        });
      }

      if (cID == "LURKR") {
        const modal = new ModalBuilder()
          .setCustomId(cID)
          .setTitle(`•  API key to import`)
          .addLabelComponents(
            new LabelBuilder()
              .setLabel("Value")
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId("setting")
                  .setPlaceholder("Type in the value")
                  .setMaxLength(4000)
                  .setStyle(TextInputStyle.Paragraph)
                  .setRequired(true),
              ),
          );

        await i.showModal(modal);
        i.client.once("interactionCreate", async modalInteraction => {
          if (modalInteraction.isModalSubmit()) {
            try {
              await doStuff(modalInteraction.fields.getTextInputValue("setting"));
            } catch (error) {
              await collapse(
                error,
                cID,
                interaction,
                containerHelper,
                modalInteraction.fields.getTextInputValue("setting"),
              );
            }
          }
        });
      } else await doStuff();
    } catch (error) {
      await collapse(error, cID, interaction, containerHelper);
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason === "bot_chosen") return;
    try {
      await interaction.deleteReply();
    } catch (error) {
      if (Error.isError(error) && error.message.toLowerCase().includes("unknown message")) return;
      throw error;
    }
  });
}
