import {
  AutocompleteInteraction,
  EmbedBuilder,
  InteractionType,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../utils/colorGen";
import {
  getSetting,
  setSetting,
  settingsDefinition,
  settingsKeys,
} from "../utils/database/settings";
import { errorEmbed } from "../utils/embeds/errorEmbed";
import { capitalize } from "../utils/capitalize";
import { humanizeSettings } from "../utils/humanizeSettings";
import { mention } from "../utils/mention";

export let data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Configure Sokora to your liking.")
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

function addOptions(
  subcommand: SlashCommandSubcommandBuilder,
  key: string,
  sub: string,
  sub1?: string,
) {
  const setting = settingsDefinition[key].settings[sub];
  switch (setting.type) {
    case "BOOL":
      subcommand.addBooleanOption(option =>
        option.setName(sub).setDescription(setting.desc).setRequired(false),
      );
      break;
    case "INTEGER":
      subcommand.addIntegerOption(option =>
        option.setName(sub).setDescription(setting.desc).setRequired(false),
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
    case "LIST":
      if (!setting.settings || !sub1) return;
      const subSetting = setting.settings[sub1];
      switch (subSetting.type) {
        case "BOOL":
          subcommand.addBooleanOption(option =>
            option.setName(sub1).setDescription(subSetting.desc).setRequired(false),
          );
          break;
        case "INTEGER":
          subcommand.addIntegerOption(option =>
            option.setName(sub1).setDescription(subSetting.desc).setRequired(false),
          );
          break;
        case "CHANNEL":
          subcommand.addChannelOption(option =>
            option.setName(sub1).setDescription(subSetting.desc).setRequired(false),
          );
          break;
        case "USER":
          subcommand.addUserOption(option =>
            option.setName(sub1).setDescription(subSetting.desc).setRequired(false),
          );
          break;
        case "ROLE":
          subcommand.addRoleOption(option =>
            option.setName(sub1).setDescription(subSetting.desc).setRequired(false),
          );
          break;
        default:
          subcommand.addStringOption(option =>
            option.setName(sub1).setDescription(subSetting.desc).setRequired(false),
          );
          break;
      }
      break;
    default:
      subcommand.addStringOption(option =>
        option.setName(sub).setDescription(setting.desc).setRequired(false),
      );
      break;
  }
}

settingsKeys.forEach(key => {
  const setting = settingsDefinition[key];
  const settings = Object.keys(setting.settings);
  const subcommand = new SlashCommandSubcommandBuilder()
    .setName(key)
    .setDescription(setting.description);

  const subcommandGroup = new SlashCommandSubcommandGroupBuilder()
    .setName(key)
    .setDescription(setting.description);

  settings.forEach(sub => {
    const subSetting = setting.settings[sub];
    if (subSetting.type != "LIST") {
      addOptions(subcommand, key, sub);

      if (settings.map(sub => setting.settings[sub].type).includes("LIST")) {
        const otherSettings = new SlashCommandSubcommandBuilder()
          .setName("default")
          .setDescription(setting.description);

        addOptions(otherSettings, key, sub);
        subcommandGroup.addSubcommand(otherSettings);
      }
    }
    if (!subSetting.settings) return;

    const listSubcommand = new SlashCommandSubcommandBuilder()
      .setName(sub)
      .setDescription(subSetting.desc);

    Object.keys(subSetting.settings).forEach(sub1 => addOptions(listSubcommand, key, sub, sub1));
    subcommandGroup.addSubcommand(listSubcommand);
    data.addSubcommandGroup(subcommandGroup);
  });

  if (!settings.map(sub => setting.settings[sub].type).includes("LIST"))
    data.addSubcommand(subcommand);
});

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache?.get(interaction.user.id)?.permissions.has("Administrator"))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "You need the **Administrator** permission.",
    );

  const key = interaction.options.getSubcommand() as keyof typeof settingsDefinition;
  const values = interaction.options.data[0].options!;
  const settingsDef = settingsDefinition[key];
  const settingText = (name: string): string => {
    const setting = getSetting(guild.id, key, name)?.toString();
    let text;
    switch (settingsDef.settings[name].type) {
      case "CHANNEL":
        text = setting ? mention(setting, "CHANNEL") : "*Not set*";
        break;
      case "USER":
        text = setting ? mention(setting, "USER") : "*Not set*";
        break;
      case "ROLE":
        text = setting ? mention(setting, "ROLE") : "*Not set*";
        break;
      default:
        text = setting || "*Not set*";
        break;
    }
    return text;
  };

  if (!values.length) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${capitalize(key)} settings` })
      .setDescription(
        Object.keys(settingsDef.settings)
          .map(
            setting =>
              `${settingsDef.settings[setting].emoji} **• ${humanizeSettings(
                capitalize(setting),
              )}**: ${humanizeSettings(settingText(setting))}`,
          )
          .join("\n"),
      )
      .setColor(genColor(100));

    return await interaction.reply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${capitalize(key)} settings changed` })
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
      return await errorEmbed(
        interaction,
        "The bot can't view this channel.",
        "You can either give the **View Channel** permission for the bot or use a channel from the dropdown menu.",
      );

    setSetting(guild.id, key, option.name, option.value as string);
    description += `**${humanizeSettings(capitalize(option.name))}:** ${humanizeSettings(
      settingText(option.name.toString()),
    )}\n`;
  }

  embed.setDescription(description);
  await interaction.reply({ embeds: [embed] });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  if (interaction.type != InteractionType.ApplicationCommandAutocomplete) return;
  switch (Object.keys(settingsDefinition[interaction.options.getSubcommand()])[0]) {
    case "BOOL":
      await interaction.respond(
        ["true", "false"].map(choice => ({
          name: choice,
          value: choice,
        })),
      );
      break;
    default:
      await interaction.respond([]);
  }
}
