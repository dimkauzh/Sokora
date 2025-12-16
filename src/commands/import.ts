import { Leveler, SUPPORTS_LEVELS } from "@hokkiai/djs-level-importer";
import { getLevel, setLevel } from "database/leveling";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { colorize } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";

export const data = new SlashCommandBuilder()
  .setName("import")
  .setDescription("Imports data from another bot.")
  .addStringOption(option =>
    option
      .setName("src")
      .setDescription("Bot to import from.")
      .setChoices({ name: "MEE6", value: "MEE6" }, { name: "Tatsu", value: "Tatsu" })
      .setRequired(true),
  )
  .setContexts(0);

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
  const option = interaction.options.getString("src") as "MEE6" | "Tatsu";
  const obtainable =
    option === "Tatsu"
      ? [
          "- User XP",
          "-# Note that Tatsu doesn't have a levelup mechanism, so user levels will remain as they are.",
        ].join("\n")
      : [
          "- User XP",
          "- User level",
          "-# Settings like difficulty (which dictate the amount of XP needed to levelup) can't be imported from MEE6's APIs. Levels might immediately change when chatting if you don't manually change the difficulty (and the current one differs too much from this one, which isn't necessarily the case).",
        ].join("\n");

  if (!interaction.guild) return;
  try {
    await interaction.deferReply();
    const leveler = new Leveler({
      guild: interaction.guildId!,
      tatsu_api: process.env["TATSU_TOKEN"],
    });
    const levels =
      option === "MEE6" ? await leveler.GetLeaderboard(0) : await leveler.GetLeaderboard(1);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${dotCheck({ string: avatar, doubleSpace: true })}Import from ${option}`,
        iconURL: avatar,
      })
      .setDescription(
        [
          `Thanks for switching to Sokora! We will import leveling info from **${option}** that we can gather. This includes a total of **${levels.length} entries**.`,
          `Data we can import from ${option} is:\n${obtainable}`,
          `You may now import data by **merging** (adding imported XP to Sokora's XP) or by **overwriting** (removing Sokora's leveling data, then adding imported XP data). You can also review the JSON data that is to be imported, just in case.`,
        ].join("\n\n"),
      )
      .setFooter({
        text: `Powered by "djs-level-importer", an open-source library by Sokora and others.`,
      })
      .setColor(await colorize({ user, avatar, hue: 90 }));

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("merge").setLabel("Merge data").setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("overwrite")
        .setLabel("Overwrite data")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("check")
        .setLabel("Check JSON data first")
        .setStyle(ButtonStyle.Primary),
    );

    const reply = await interaction.editReply({ embeds: [embed], components: [row] });
    const collector = reply.createMessageComponentCollector({ time: 45000 });
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
          title: "You are not the person who executed this command.",
        });

      collector.resetTimer({ time: 45000 });
      if (i.customId == "check")
        await i.update({
          embeds: [
            embed
              .setTitle(`This is what we'll import from ${option}.`)
              .setDescription(
                [
                  "```json",
                  safeStringify(levels),
                  "```",
                  option === "Tatsu"
                    ? ""
                    : "-# `next_level_xp` exists, but because Sokora's difficulty system is over-engineered compared to other bots' leveling, we can't convert their difficulty into Sokora's difficulty system.",
                ].join("\n"),
              ),
          ],
          components: [row],
        });

      const res = [];
      await i.update({
        embeds: [
          embed.setTitle(
            `${i.customId == "merge" ? "Updating" : "Overwriting"} data for all users...`,
          ),
        ],
      });

      for (const user of interaction.guild!.members.cache) {
        if (user[1].user.bot) continue;
        const imported = levels.find(lev => lev.uid == user[1].id);
        if (!imported) {
          res.push(
            `${user[1].user.username} wasn't imported (had no data saved in the imported dataset)`,
          );
          continue;
        }
        const prev = getLevel(interaction.guildId!, user[1].id);
        const newLevel =
          i.customId == "merge" ? prev[0] : 0 + (SUPPORTS_LEVELS(imported) ? imported.lvl : 0);

        const newXp = i.customId == "merge" ? prev[1] : 0 + imported.current_xp;
        setLevel(interaction.guildId!, user[1].id, newLevel, newXp);
        res.push(
          `${user[1].user.username} updated from LVL ${prev[0]} and XP ${prev[1]} to **LVL ${newLevel} and XP ${newXp}**.`,
        );
      }

      await i.editReply({ embeds: [embed.setTitle("Done!").setDescription(res.join("\n"))] });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (error) {
        if (Error.isError(error) && error.message.toLowerCase().includes("unknown message")) return;
        throw error;
      }
    });
  } catch (error) {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${dotCheck({ string: avatar, doubleSpace: true })}Auto import for ${option} failed!`,
        iconURL: avatar,
      })
      .setDescription(
        [
          option === "MEE6"
            ? "Open the leaderboard settings in the MEE6 dashboard and enable the option `Make my server's leaderboard public`. Otherwise we can't import data."
            : "We don't really know what went wrong. Maybe try again?",
          "If after doing that Sokora keeps failing to import your data, please send the error message (shown below) to Sokora's team so we can try to fix this.",
          `\`\`\`yaml\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}}\`\`\``,
        ].join("\n\n"),
      )
      .setFooter({
        text: `Powered by "djs-level-importer", an open-source library by Sokora and others.`,
      })
      .setColor(await colorize({ user, avatar, hue: 0 }));

    await interaction.editReply({ embeds: [embed] });
    return;
  }
}
