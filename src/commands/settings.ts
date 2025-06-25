import { getSetting, settingsDefinition, settingsKeys } from "database/settings";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  MessageActionRowComponentBuilder,
  PermissionsBitField,
  RoleSelectMenuBuilder,
  SectionBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  UserSelectMenuBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { auditEventNames, easterEggNames } from "handlers/events";
import { capitalize } from "utils/capitalize";
import { genColorCV2 } from "utils/colorGen";
import { humanizeSettings } from "utils/humanizeSettings";
import { newline } from "utils/newline";

export const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Configure Sokora to your liking.")
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

settingsKeys.forEach(key =>
  data.addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName(key)
      .setDescription(settingsDefinition[key].description),
  ),
);

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache?.get(interaction.user.id)?.permissions.has("Administrator"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Administrator** permission.",
    });

  const key = interaction.options.getSubcommand();
  const settingsDef = settingsDefinition[key];
  const settingsObj = settingsDef.settings;
  const settingComponent = async (name: string): Promise<{ text: string; component: any }> => {
    const setting = await getSetting(guild.id, key, name);
    const settingObject = settingsObj[name];
    const maxValues = settingObject.iterable ? 25 : 1;
    let component:
      | ButtonBuilder
      | ChannelSelectMenuBuilder
      | UserSelectMenuBuilder
      | RoleSelectMenuBuilder
      | StringSelectMenuBuilder;

    switch (settingObject.type) {
      case "BOOL":
        component = new ButtonBuilder()
          .setCustomId(`bool${name}`)
          .setLabel(humanizeSettings(capitalize(setting?.toString() ?? "Not set")))
          .setStyle(setting ? ButtonStyle.Success : ButtonStyle.Danger);

        break;
      case "CHANNEL":
        component = new ChannelSelectMenuBuilder()
          .setCustomId(`channel${name}`)
          .setMaxValues(maxValues)
          .setChannelTypes([
            ChannelType.GuildAnnouncement,
            ChannelType.GuildForum,
            ChannelType.GuildStageVoice,
            ChannelType.GuildText,
            ChannelType.GuildVoice,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
          ]);
        break;
      case "USER":
        component = new UserSelectMenuBuilder().setCustomId(`user${name}`).setMaxValues(maxValues);
        break;
      case "ROLE":
        component = new RoleSelectMenuBuilder().setCustomId(`role${name}`).setMaxValues(maxValues);
        break;
      case "LOG":
        component = new StringSelectMenuBuilder()
          .setCustomId(`log${name}`)
          .setMaxValues(auditEventNames.length)
          .setOptions(
            auditEventNames.map(option =>
              new StringSelectMenuOptionBuilder().setLabel(option).setValue(option),
            ),
          );
        break;
      case "EGG":
        component = new StringSelectMenuBuilder()
          .setCustomId(`log${name}`)
          .setMaxValues(easterEggNames.length)
          .setOptions(
            easterEggNames.map(option =>
              new StringSelectMenuOptionBuilder().setLabel(option).setValue(option),
            ),
          );
        break;
      default:
        component = new ButtonBuilder()
          .setCustomId(`edit${name}`)
          .setLabel("Edit")
          .setStyle(ButtonStyle.Secondary);

        break;
    }

    return {
      text: `${humanizeSettings(capitalize(name))}\n-# ${newline(settingObject.desc)}`,
      component,
    };
  };

  // const avatar = interaction.guild!.iconURL()!;
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsDef.description))
    .setAccentColor(genColorCV2(200)!);

  for (const setting of Object.keys(settingsObj)) {
    const object = await settingComponent(setting);
    const component = object.component;
    if (component instanceof ButtonBuilder)
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(object.text))
          .setButtonAccessory(component),
      );
    else
      container
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(object.text))
        .addActionRowComponents(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(component),
        );
  }

  await interaction.reply({ components: [container], flags: "IsComponentsV2" });
}
