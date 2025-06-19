import { getSetting, setSetting, settingsDefinition, settingsKeys } from "database/settings";
import {
  AutocompleteInteraction,
  EmbedBuilder,
  InteractionType,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { auditEventNames } from "handlers/events";
import { capitalize } from "utils/capitalize";
import { genColor } from "utils/colorGen";
import { humanizeSettings } from "utils/humanizeSettings";
import { mention } from "utils/mention";
import { pfpCheck } from "utils/pfpCheck";

export const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Configure Sokora to your liking.")
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

settingsKeys.forEach(key => {
  const subcommand = new SlashCommandSubcommandBuilder()
    .setName(key)
    .setDescription(settingsDefinition[key].description);

  Object.keys(settingsDefinition[key].settings).forEach(sub => {
    const setting = settingsDefinition[key].settings[sub];
    switch (setting.type) {
      case "BOOL":
        subcommand.addBooleanOption(option =>
          option.setName(sub).setDescription(setting.desc).setRequired(false),
        );
        break;
      case "INTEGER":
        subcommand.addIntegerOption(option =>
          option.setName(sub).setDescription(setting.desc).setRequired(false).setAutocomplete(true),
        );
        break;
      case "CHANNEL":
        subcommand.addChannelOption(option =>
          option.setName(sub).setDescription(setting.desc).setRequired(false),
        );
        break;
      case "USER":
        subcommand.addUserOption(option =>
          option.setName(sub).setDescription(setting.desc).setRequired(false),
        );
        break;
      case "ROLE":
        subcommand.addRoleOption(option =>
          option.setName(sub).setDescription(setting.desc).setRequired(false),
        );
        break;
      default:
        subcommand.addStringOption(option =>
          option.setName(sub).setDescription(setting.desc).setRequired(false).setAutocomplete(true),
        );
        break;
    }
  });
  data.addSubcommand(subcommand);
});

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache?.get(interaction.user.id)?.permissions.has("Administrator"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Administrator** permission.",
    });

  const key = interaction.options.getSubcommand();
  const values = interaction.options.data[0].options!;
  const settingsDef = settingsDefinition[key];
  const settingText = async (name: string): Promise<string> => {
    const setting = (await getSetting(guild.id, key, name))?.toString();
    if (!setting) return "*Undefined*";
    let text;
    switch (settingsDef.settings[name].type) {
      case "CHANNEL":
        text = setting ? await mention(setting, "CHANNEL") : "*Not set*";
        break;
      case "USER":
        text = setting ? await mention(setting, "USER") : "*Not set*";
        break;
      case "ROLE":
        text = setting ? await mention(setting, "ROLE") : "*Not set*";
        break;
      default:
        text = setting || "*Not set*";
        break;
    }
    return text;
  };

  const avatar = interaction.guild!.iconURL()!;
  if (!values.length || !values.filter(value => value.type != 1)[0]) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${pfpCheck(avatar)}${capitalize(key)} settings`, iconURL: avatar })
      .setDescription(
        (
          await Promise.all(
            Object.keys(settingsDef.settings).map(
              async setting =>
                `**${humanizeSettings(capitalize(setting))}**: ${humanizeSettings(await settingText(setting))}`,
            ),
          )
        ).join("\n"),
      )
      .setColor(genColor(100));

    return await interaction.reply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(avatar)}${capitalize(key)} settings changed`, iconURL: avatar })
    .setColor(genColor(100));

  let description = "";
  for (let i = 0; i < values.length; i++) {
    const option = values[i];

    if (
      option.type == 7 &&
      !guild.channels.cache
        .get(option.value as string)
        ?.permissionsFor(interaction.client.user)
        ?.has("ViewChannel")
    )
      return await errorEmbed({
        interaction,
        title: "The bot can't view this channel.",
        reason:
          "You can either give the **View Channel** permission for the bot or use a channel from the dropdown menu.",
      });

    await setSetting(guild.id, key, option.name, option.value as string);
    description += `**${humanizeSettings(capitalize(option.name))}:** ${humanizeSettings(
      await settingText(option.name.toString()),
    )}\n`;
  }

  embed.setDescription(description);
  await interaction.reply({ embeds: [embed] });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  if (interaction.type != InteractionType.ApplicationCommandAutocomplete) return;
  switch (
    settingsDefinition[interaction.options.getSubcommand()].settings[
      interaction.options.getFocused(true).name
    ].type
  ) {
    case "LOG":
      await interaction.respond(
        auditEventNames.map(choice => ({
          name: choice,
          value: choice,
        })),
      );
      break;
    default:
      await interaction.respond([]);
  }
}
