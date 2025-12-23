import { Leveler } from "@hokkiai/djs-level-importer";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  PermissionsBitField,
  RGBTuple,
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { errorEmbedCV2 } from "embeds/errorEmbed";
import { colorize } from "utils/colorGen";

export const data = new SlashCommandBuilder()
  .setName("newport")
  .setDescription("Imports data from another bot, CV2 edition.")
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

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  if (!interaction.guild) return;
  await interaction.deferReply();
  const color = (await colorize({ user, avatar, hue: 90, cv2: true })) as RGBTuple;

  const container = new ContainerBuilder()
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("Tatsu\n-# Import from Tatsu muehehehe"),
        )
        .setButtonAccessory(
          new ButtonBuilder().setCustomId("tatsu").setLabel("Import").setStyle(ButtonStyle.Primary),
        ),
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("MEE6\n-# fucker"))
        .setButtonAccessory(
          new ButtonBuilder().setCustomId("mee6").setLabel("Import").setStyle(ButtonStyle.Primary),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "-# Powered by `djs-level-importer`, an open-source library by Sokora and others.",
      ),
    )
    .setAccentColor(color);

  const reply = await interaction.editReply({ components: [container], flags: ["IsComponentsV2"] });
  const collector = reply.createMessageComponentCollector({ time: 120000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbedCV2({
        interaction: i,
        title:
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      });

    if (i.user.id != interaction.user.id)
      return await errorEmbedCV2({
        interaction: i,
        title: "You are not the person who executed this command.",
      });

    collector.resetTimer({ time: 120000 });
    const cID = i.customId;
    const bots =
      cID === "tatsu"
        ? {
            name: "Tatsu",
            data: [
              "- User XP",
              "-# Note that Tatsu doesn't have a levelup mechanism, so user levels will remain as they are.",
            ].join("\n"),
          }
        : {
            name: "MEE6",
            data: [
              "- User XP",
              "- User level",
              "-# Settings like difficulty (which dictate the amount of XP needed to levelup) can't be imported from MEE6's APIs. Levels might immediately change when chatting if you don't manually change the difficulty (and the current one differs too much from this one, which isn't necessarily the case).",
            ].join("\n"),
          };

    try {
      const leveler = new Leveler({
        guild: interaction.guildId!,
        tatsu_api: process.env["TATSU_TOKEN"],
      });
      const levels =
        cID === "mee6" ? await leveler.GetLeaderboard(0) : await leveler.GetLeaderboard(1);

      const container1 = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              `Thanks for switching to Sokora! We will import leveling info from **${bots.name}** that we can gather. This includes a total of **${levels.length} entries**.`,
              `Data we can import from ${bots.name} is:\n${bots.data}`,
              `You may now import data by **merging** (adding imported XP to Sokora's XP) or by **overwriting** (removing Sokora's leveling data, then adding imported XP data). You can also review the JSON data that is to be imported, just in case.`,
            ].join("\n\n"),
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(
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
              .setCustomId("check")
              .setLabel("Check JSON data first")
              .setStyle(ButtonStyle.Primary),
          ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "-# Powered by `djs-level-importer`, an open-source library by Sokora and others.",
          ),
        )
        .setAccentColor(color);

      const reply1 = await interaction.editReply({
        components: [container1],
        flags: "IsComponentsV2",
      });
      const collector1 = reply1.createMessageComponentCollector({ time: 45000 });
      collector1.on("collect", async (i: ButtonInteraction) => {
        if (i.message.id != (await reply1.fetch()).id)
          return await errorEmbedCV2({
            interaction: i,
            title:
              "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
          });

        if (i.user.id != interaction.user.id)
          return await errorEmbedCV2({
            interaction: i,
            title: "You are not the person who executed this command.",
          });

        collector1.resetTimer({ time: 45000 });
        const container2 = new ContainerBuilder();
        if (i.customId == "check")
          await i.update({
            components: [
              container2.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  [
                    `## This is what we'll import from ${bots.name}`,
                    "```json",
                    safeStringify(levels),
                    "```",
                    cID === "tatsu"
                      ? ""
                      : "-# `next_level_xp` exists, but because Sokora's difficulty system is over-engineered compared to other bots' leveling, we can't convert their difficulty into Sokora's difficulty system.",
                  ].join("\n"),
                ),
              ),
            ],
            flags: "IsComponentsV2",
          });
      });
    } catch (error) {
      const errorContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              cID === "mee6"
                ? "Open the leaderboard settings in the MEE6 dashboard and enable the option `Make my server's leaderboard public`. Otherwise we can't import data."
                : "We don't really know what went wrong. Maybe try again?",
              "If after doing that Sokora keeps failing to import your data, please send the error message (shown below) to Sokora's team so we can try to fix this.",
              `\`\`\`yaml\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}}\`\`\``,
            ].join("\n\n"),
          ),
        )
        .setAccentColor((await colorize({ user, avatar, hue: 0, cv2: true })) as RGBTuple);

      return await interaction.editReply({ components: [errorContainer], flags: "IsComponentsV2" });
    }
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
