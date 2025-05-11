import {
  AutocompleteInteraction,
  EmbedBuilder,
  InteractionType,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { capitalize } from "../../utils/capitalize";
import { genColor } from "../../utils/colorGen";
import {
  getUserSetting,
  setUserSetting,
  settingsDefinition,
  settingsKeys,
} from "../../utils/database/userSettings";
import { humanizeSettings } from "../../utils/humanizeSettings";

export let data = new SlashCommandSubcommandGroupBuilder()
  .setName("settings")
  .setDescription("Configure Sokora to your liking.");

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
          option.setName(sub).setDescription(setting.desc).setRequired(false),
        );
        break;
      default:
        subcommand.addStringOption(option =>
          option.setName(sub).setDescription(setting.desc).setRequired(false),
        );
        break;
    }
  });
  data.addSubcommand(subcommand);
});

export async function run(interaction: ChatInputCommandInteraction) {
  const userID = interaction.user.id;
  const key = interaction.options.getSubcommand();
  const values = interaction.options.data[0].options![0].options!;
  const settingsDef = settingsDefinition[key];
  const settingText = async (name: string): Promise<string> => {
    const setting = (await getUserSetting(userID, key, name))?.toString();
    if (!setting) return "*Undefined.*";
    return setting || "*Not set*";
  };

  if (!values.length || !values.filter(value => value.type != 1)[0]) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${capitalize(key)} settings` })
      .setDescription(
        (
          await Promise.all(
            Object.keys(settingsDef.settings).map(
              async setting =>
                `${settingsDef.settings[setting].emoji ? `${settingsDef.settings[setting].emoji} • ` : ""}**${humanizeSettings(
                  capitalize(setting),
                )}**: ${humanizeSettings(await settingText(setting))}`,
            ),
          )
        ).join("\n"),
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
    await setUserSetting(userID, key, option.name, option.value as string);
    description += `**${humanizeSettings(capitalize(option.name))}:** ${humanizeSettings(
      await settingText(option.name.toString()),
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
