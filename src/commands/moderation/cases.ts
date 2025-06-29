import {
  getModeration,
  listGuildModeration,
  listUserModeration,
  ModerationCase,
  modType,
} from "database/moderation";
import { TypeOfDefinition } from "database/types";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  User,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { capitalize } from "utils/capitalize";
import { genColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { randomize } from "utils/randomize";

const MAX_PER_PAGE = 5;

async function generateEmbed(params: {
  providedCases: TypeOfDefinition<ModerationCase>[];
  page: number;
  type: modType | null;
  guildId: string;
  totalPages: number;
  avatar: string | undefined;
  user: User | null;
}) {
  const { type, page, providedCases, totalPages, guildId, avatar, user } = params;

  const actionsEmojis: { [key in modType]: string } = {
    WARN: "⚠️",
    MUTE: "🔇",
    KICK: "📤",
    BAN: "🔨",
    UNBAN: "🔓",
    UNMUTE: "🔊",
  };

  const start = (page - 1) * MAX_PER_PAGE;
  const end = start + MAX_PER_PAGE;
  const displayedCases = providedCases
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(start, end);
  const guildEmbed = new EmbedBuilder()
    .setAuthor({ name: `All ${type ? type.toLowerCase() : "moderation"} cases server-wide` })
    .setFields(
      displayedCases.map(c => {
        return {
          name: `**Case ${c.id} • ${c.type}**`,
          value: [
            `**User**: <@${c.user}>`,
            `**Moderator**: <@${c.moderator}>`,
            c.reason ? `**Reason**: ${c.reason}` : "*No reason provided*",
            `**Time of action**: <t:${Math.floor(Number(c.timestamp) / 1000)}:d>`,
          ]
            .filter(Boolean)
            .join("\n"),
        };
      }),
    )
    .setColor(genColor(0))
    .setFooter({ text: `Page ${page}/${totalPages} • Server ID: ${guildId}` });

  if (!user) return guildEmbed;

  const userEmbed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}${type ? `${capitalize(type.toLowerCase())} cases` : "Cases"} of ${user.username}`,
      iconURL: avatar,
    })
    .setFields(
      displayedCases.map(action => {
        const actionValues = [
          `**Moderator**: <@${action.moderator}>`,
          action.reason ? `**Reason**: ${action.reason}` : "*No reason provided*",
          `**Time of action**: <t:${Math.floor(Number(action.timestamp) / 1000)}:d>`,
        ];

        return {
          name: `${actionsEmojis[action.type as modType]} • ${action.type} #${action.id}`, // Include durations ? needs to add a db column
          value: actionValues.join("\n"),
        };
      }),
    )
    .setColor(genColor(200))
    .setFooter({
      text: `Page ${page}/${totalPages} • User ID: ${user.id} • Server ID: ${guildId}`,
    });

  return userEmbed;
}

const generateRow = () =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("left")
      .setEmoji("1298708251256291379")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("right")
      .setEmoji("1298708281493160029")
      .setStyle(ButtonStyle.Primary),
  );

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
  )
  .addNumberOption(option => option.setName("page").setDescription("Page number to display."));

export async function run(interaction: ChatInputCommandInteraction) {
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
                value: type
                  ? `*No ${type.toLowerCase()} were made in the entire server!*`
                  : "*No actions were taken in the entire server. How clean!*",
              },
            ])
            .setFooter({ text: `Server ID: ${guild.id}` }),
        ],
      });
      return;
    }

    const totalPages = Math.ceil(cases.length / MAX_PER_PAGE);
    let page = Math.max(1, Math.min(interaction.options.getNumber("page") || 1, totalPages));

    const row = generateRow();

    const reply = await interaction.reply({
      embeds: [
        await generateEmbed({
          providedCases: cases,
          page,
          totalPages,
          guildId: guild.id,
          type: type as modType | null,
          user,
          avatar: undefined,
        }),
      ],
      components: totalPages > 1 ? [row] : [],
    });
    if (totalPages <= 1) return;
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
          title: "You are not the person who executed this command.",
        });

      collector.resetTimer({ time: 30000 });
      if (i.customId == "left") page = page > 1 ? page - 1 : totalPages;
      else page = page < totalPages ? page + 1 : 1;

      await i.update({
        embeds: [
          await generateEmbed({
            providedCases: cases,
            page,
            totalPages,
            guildId: guild.id,
            type: type as modType | null,
            user,
            avatar: undefined,
          }),
        ],
        components: [row],
      });
    });

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

    .setColor(genColor(200));
  if (actions.length === 0) {
    embed
      .setFields([
        {
          name: `💨 • ${randomize(nothingMsg)}`,
          value: "*No actions have been taken on this user*",
        },
      ])
      .setFooter({
        text: `User ID: ${user.id} • Server ID: ${guild.id}`,
      });

    await interaction.reply({ embeds: [embed] });
    return;
  }

  const totalPages = Math.ceil(actions.length / MAX_PER_PAGE);
  let page = Math.max(1, Math.min(interaction.options.getNumber("page") || 1, totalPages));

  const row = generateRow();

  const reply = await interaction.reply({
    embeds: [
      await generateEmbed({
        providedCases: actions,
        page,
        totalPages,
        guildId: guild.id,
        type: type as modType | null,
        user,
        avatar,
      }),
    ],
    components: totalPages > 1 ? [row] : [],
  });
  if (totalPages <= 1) return;
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
        title: "You are not the person who executed this command.",
      });

    collector.resetTimer({ time: 30000 });
    if (i.customId == "left") page = page > 1 ? page - 1 : totalPages;
    else page = page < totalPages ? page + 1 : 1;

    await i.update({
      embeds: [
        await generateEmbed({
          providedCases: actions,
          page,
          totalPages,
          guildId: guild.id,
          type: type as modType | null,
          user,
          avatar,
        }),
      ],
      components: [row],
    });
  });
}
