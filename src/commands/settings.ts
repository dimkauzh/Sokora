import {
  AutocompleteInteraction,
  EmbedBuilder,
  InteractionType,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
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

export let data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Configure Sokora to your liking.")
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

settingsKeys.forEach(key => {
  const subcommand = new SlashCommandSubcommandBuilder()
    .setName(key)
    .setDescription(settingsDefinition[key].description);

  Object.keys(settingsDefinition[key].settings).forEach(sub => {
    switch (settingsDefinition[key].settings[sub].type) {
      case "BOOL":
        subcommand.addBooleanOption(option =>
          option
            .setName(sub)
            .setDescription(settingsDefinition[key].settings[sub]["desc"])
            .setRequired(false),
        );
        break;
      case "INTEGER":
        subcommand.addIntegerOption(option =>
          option
            .setName(sub)
            .setDescription(settingsDefinition[key].settings[sub]["desc"])
            .setRequired(false),
        );
        break;
      case "CHANNEL":
        subcommand.addChannelOption(option =>
          option
            .setName(sub)
            .setDescription(settingsDefinition[key].settings[sub]["desc"])
            .setRequired(false),
        );
        break;
      case "USER":
        subcommand.addUserOption(option =>
          option
            .setName(sub)
            .setDescription(settingsDefinition[key].settings[sub]["desc"])
            .setRequired(false),
        );
        break;
      case "ROLE":
        subcommand.addRoleOption(option =>
          option
            .setName(sub)
            .setDescription(settingsDefinition[key].settings[sub]["desc"])
            .setRequired(false),
        );
        break;
      default: // Also includes "TEXT"
        subcommand.addStringOption(option =>
          option
            .setName(sub)
            .setDescription(settingsDefinition[key].settings[sub]["desc"])
            .setRequired(false),
        );
        break;
    }
  });
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
        text = setting ? `<#${setting}>` : "Not set";
        break;
      case "USER":
        text = setting ? `<@${setting}>` : "Not set";
        break;
      case "ROLE":
        text = setting ? `<@&${setting}>` : "Not set";
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
    .setColor(genColor(100))
    .setAuthor({ name: `✅ • ${capitalize(key)} settings changed` });

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
        "I can't view this channel.",
        "You can either give the **View Channel** permission for Sokora or use a channel from the dropdown menu.",
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
