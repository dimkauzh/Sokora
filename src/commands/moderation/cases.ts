import {
  getModeration,
  listGuildModeration,
  listUserModeration,
  modType,
} from "database/moderation";
import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { capitalize } from "utils/capitalize";
import { genColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { randomize } from "utils/randomize";

export const data = new SlashCommandSubcommandBuilder()
  .setName("cases")
  .setDescription("Moderation cases in a server.")
  .addUserOption(user => user.setName("user").setDescription("The user that you want to see."))
  .addStringOption(string =>
    string.setName("id").setDescription("The ID of a specific moderation case you want to see."),
  )
  .addStringOption(string =>
    string
      .setName("type")
      .setDescription("The specific type of action you'd like to see.")
      .setChoices(
        {
          name: "Bans",
          value: "BAN",
        },
        {
          name: "Unbans",
          value: "UNBAN",
        },
        {
          name: "Warnings",
          value: "WARN",
        },
        {
          name: "Kicks",
          value: "KICK",
        },
        {
          name: "Mutes",
          value: "MUTE",
        },
        {
          name: "Unmutes",
          value: "UNMUTE",
        },
        {
          name: "Notes",
          value: "NOTE",
        },
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const actionsEmojis: { [key: string]: string } = {
    WARN: "⚠️",
    MUTE: "🔇",
    KICK: "📤",
    BAN: "🔨",
    UNBAN: "🔓",
  };

  const nothingMsg = [
    "Nothing to see here...",
    "Ayay, no cases on this horizon cap'n!",
    "Clean as a whistle!",
    "0 + 0 = ?",
  ];

  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ModerateMembers"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Moderate Members** permission.",
    });

  const user = interaction.options.getUser("user");
  let actionID = interaction.options.getString("id");
  const type = interaction.options.getString("type");
  if (actionID && actionID?.startsWith("#")) actionID = actionID.slice(1);
  if (actionID && !user)
    return await errorEmbed({
      interaction,
      client: interaction.client,
      title: "No user specified!",
      reason: `Sokora cannot look for "case ${actionID} of *no user*". Please, specify a user.`,
    });
  if (!user) {
    const cases = type
      ? listGuildModeration(guild.id, type as modType)
      : listGuildModeration(guild.id);
    if (cases.length === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "All moderation cases server-wide" })
            .setColor(genColor(120))
            .setFields([
              {
                name: `💨 • ${randomize(nothingMsg)}`,
                value: "*No actions were taken in the entire server. How clean!*",
              },
            ]),
        ],
      });
      return;
    }
    // TODO:
    // 1. do whatever to group cases per user id
    // 2. perhaps add pagination, this could grow large
    const fields = cases.map(c => {
      return {
        name: `**Case**`,
        value: [
          `\`Case ${c.id} for user\` <@${c.user}>`,
          `**Moderator**: <@${c.moderator}>`,
          type ? "" : `**Action**: ${c.type}`,
          c.reason ? `**Reason**: ${c.reason}` : "*No reason provided*",
          `**Time of action**: <t:${Math.floor(Number(c.timestamp) / 1000)}:d>`,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    });
    const embed = new EmbedBuilder()
      .setAuthor({ name: `All ${type ? type.toLowerCase() : "moderation"} cases server-wide` })
      .setFields(fields)
      .setColor(genColor(0));
    await interaction.reply({ embeds: [embed] });
    return;
  }
  const actions = actionID
    ? getModeration(guild.id, user!.id, actionID)
    : type
      ? listUserModeration(guild.id, user!.id, type as modType)
      : listUserModeration(guild.id, user!.id);

  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}${type ? `${capitalize(type.toLowerCase())} cases` : "Cases"} of ${user.username}`,
      iconURL: avatar,
    })
    .setFields(
      actions.length > 0
        ? actions.map(action => {
            const actionValues = [
              `**Moderator**: <@${action.moderator}>`,
              action.reason ? `**Reason**: ${action.reason}` : "*No reason provided*",
              `**Time of action**: <t:${Math.floor(Number(action.timestamp) / 1000)}:d>`,
            ];

            return {
              name: `${actionsEmojis[action.type]} • ${action.type} #${action.id}`, // Include durations ? needs to add a db column
              value: actionValues.join("\n"),
            };
          })
        : [
            {
              name: `💨 • ${randomize(nothingMsg)}`,
              value: "*No actions have been taken on this user*",
            },
          ],
    )
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(genColor(200));

  await interaction.reply({ embeds: [embed] });
}
