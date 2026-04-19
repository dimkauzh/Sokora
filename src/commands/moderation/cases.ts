import {
  getCase,
  listGuildCases,
  listUserCases,
  type ModerationCase,
  type ModType,
} from "database/moderation";
import { TypeOfDefinition } from "database/types";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type User,
} from "discord.js";
import { buttonCheck, errorEmbed } from "embeds/errorEmbed";
import ms from "enhanced-ms";
import { client } from "src/bot";
import { capitalize } from "utils/capitalize";
import { colorize, Sokolors } from "utils/colorize";
import { dotCheck } from "utils/dotCheck";
import { mention } from "utils/mention";
import { pluralOrNot } from "utils/pluralOrNot";
import { randomize } from "utils/randomize";
import { replace } from "utils/replace";
import { safeGuild, safeMember } from "utils/safeThings";

async function generateEmbed(options: {
  cases: TypeOfDefinition<ModerationCase>[];
  page: number;
  type: ModType | null;
  guildID: string;
  totalPages: number;
  user: User | null;
  id: number | null;
}) {
  const { cases, page, type, guildID, totalPages, user, id } = options;
  const actionsEmojis: { [key in ModType]: string } = {
    WARN: "⚠️",
    MUTE: "🔇",
    KICK: "📤",
    BAN: "🔨",
    UNBAN: "🔓",
    UNMUTE: "🔊",
  };

  const nothingMsg = [
    "Nothing to see here...",
    "Ayay, no cases on this horizon cap'n!",
    "Clean as a whistle!",
    "0 + 0 = ?",
  ];

  const start = (page - 1) * 5;
  const displayedCases = cases.sort((a, b) => b.id - a.id).slice(start, start + 5);
  const avatar = user ? user.avatarURL() : (await safeGuild(client, guildID))?.iconURL();
  let fields = displayedCases.map(c => {
    const val = [
      `**Moderator**: ${mention(c.moderator, "USER")}`,
      c.reason ? `**Reason**: ${c.reason}` : "*No reason provided*",
      `**Time of action**: ${mention(c.timestamp.valueOf(), "SIMPLE_TIMESTAMP")}`,
    ];

    if (!user) val.unshift(`**User**: ${mention(c.userID, "USER")}`);
    if (c.expiresAt) val.push(`**Duration**: ${ms(Number(c.expiresAt), "fullPrecision")}`);

    return {
      name: `${actionsEmojis[c.type as ModType]} • ${capitalize(c.type.toLowerCase())} #${c.id}`,
      value: val.join("\n"),
    };
  });

  if (cases.length == 0)
    fields = [
      {
        name: `💨 • ${randomize(nothingMsg)}`,
        value: type
          ? `*No ${type.toLowerCase()}s were made in the entire server!*`
          : "*No actions were taken in the entire server. How clean!*",
      },
    ];

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${id ? capitalize(displayedCases[0].type?.toLowerCase()) : type ? `${capitalize(type.toLowerCase())} cases` : pluralOrNot("Case", cases.length)} ${id ? `#${id}` : user ? `of ${user.username}` : "in the server"}`,
      iconURL: avatar!,
    })
    .setFooter({
      text: `${totalPages > 1 ? `Page ${page} of ${totalPages}` : ""}${user ? `\nUser ID: ${user.id} • Server ID: ${guildID}` : `${totalPages > 1 ? ` • Server ID: ${guildID}` : `Server ID: ${guildID}`}`}`,
    })
    .setColor(await colorize({ hue: Sokolors.Blue }));

  if (id) embed.setDescription(fields[0].value);
  else embed.setFields(fields);

  return embed;
}

export const data = new SlashCommandSubcommandBuilder()
  .setName("cases")
  .setDescription("Lists all cases of a user (or in a server).")
  .addUserOption(user =>
    user.setName("user").setDescription("The user's cases that you want to see."),
  )
  .addNumberOption(number =>
    number.setName("id").setDescription("The ID of a specific case that you want to see."),
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
      ),
  )
  .addNumberOption(option => option.setName("page").setDescription("Page number to display."));

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!(await safeMember(guild, interaction.user.id)).permissions.has("ModerateMembers"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Moderate Members** permission.",
    });

  const guildID = guild.id;
  const user = interaction.options.getUser("user");
  const modType = interaction.options.getString("type") as ModType;
  const actionID = interaction.options.getNumber("id");
  // if (actionID && actionID?.startsWith("#")) actionID = actionID.slice(1);

  let cases;
  if (actionID) cases = await getCase(guildID, actionID);
  else if (user) cases = await listUserCases(guildID, user.id, modType);
  else cases = await listGuildCases(guildID, modType);

  const totalPages = Math.ceil(cases.length / 5);
  let page = Math.max(1, Math.min(interaction.options.getNumber("page") || 1, totalPages));
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
    embeds: [
      await generateEmbed({ cases, page, totalPages, guildID, type: modType, user, id: actionID }),
    ],
    components: totalPages > 1 ? [row] : [],
  });

  if (totalPages <= 1) return;
  const collector = reply.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (await buttonCheck({ i, interaction, reply })) return;
    collector.resetTimer({ time: 60000 });

    if (i.customId == "left") page = page > 1 ? page - 1 : totalPages;
    else page = page < totalPages ? page + 1 : 1;
    await i.update({
      embeds: [
        await generateEmbed({
          cases,
          page,
          totalPages,
          guildID,
          type: modType,
          user,
          id: actionID,
        }),
      ],
      components: [row],
    });
  });
}
