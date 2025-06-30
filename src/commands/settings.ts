import { getSetting, setSetting, settingsDefinition, settingsKeys } from "database/settings";
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
  const key = interaction.options.getSubcommand();
  const settingsDef = settingsDefinition[key];
  const settingsObj = settingsDef.settings;
  const settingComponent = async (
    name: string,
  ): Promise<{
    text: string;
    data: { type: string; id: string };
    component:
      | ButtonBuilder
      | ChannelSelectMenuBuilder
      | UserSelectMenuBuilder
      | RoleSelectMenuBuilder
      | StringSelectMenuBuilder;
  }> => {
    const setting = await getSetting(guild.id, key, name);
    const settingObject = settingsObj[name];
    const maxValues = settingObject.iterable ? 25 : 1;
    const text = `${humanizeSettings(capitalize(name))}\n-# ${newline(settingObject.desc)}`;
    let data: { type: string; id: string };
    let component:
      | ButtonBuilder
      | ChannelSelectMenuBuilder
      | UserSelectMenuBuilder
      | RoleSelectMenuBuilder
      | StringSelectMenuBuilder;

    // todo: set default values based on setting value
    switch (settingObject.type) {
      case "BOOL":
        data = { type: "bool", id: name };
        component = new ButtonBuilder()
          .setCustomId(data.id)
          .setLabel(humanizeSettings(capitalize(setting?.toString() ?? "Not set")))
          .setStyle(setting ? ButtonStyle.Success : ButtonStyle.Danger);

        break;
      case "CHANNEL":
        data = { type: "channel", id: name };
        component = new ChannelSelectMenuBuilder()
          .setCustomId(data.id)
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
        // .setDefaultChannels(setting as unknown as string[]);

        break;
      case "USER":
        data = { type: "user", id: name };
        component = new UserSelectMenuBuilder().setCustomId(data.id).setMaxValues(maxValues);
        // .setDefaultUsers(setting as unknown as string[]);

        break;
      case "ROLE":
        data = { type: "role", id: name };
        component = new RoleSelectMenuBuilder().setCustomId(data.id).setMaxValues(maxValues);
        // .setDefaultRoles(setting as unknown as string[]);

        break;
      case "LOG":
        data = { type: "log", id: name };
        component = new StringSelectMenuBuilder()
          .setCustomId(data.id)
          .setMaxValues(auditEventNames.length)
          .setOptions(
            auditEventNames.map(
              option => new StringSelectMenuOptionBuilder().setLabel(option).setValue(option),
              // .setDefault((setting as unknown as string[]).includes(option)),
            ),
          );
        break;
      case "EGG":
        data = { type: "egg", id: name };
        component = new StringSelectMenuBuilder()
          .setCustomId(data.id)
          .setMaxValues(easterEggNames.length)
          .setOptions(
            easterEggNames.map(
              option => new StringSelectMenuOptionBuilder().setLabel(option).setValue(option),
              // .setDefault((setting as unknown as string[]).includes(option)),
            ),
          );
        break;
      default:
        data = { type: "other", id: name };
        component = new ButtonBuilder()
          .setCustomId(data.id)
          .setLabel("Edit")
          .setStyle(ButtonStyle.Secondary);

        break;
    }

    return { text, data, component };
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

  const reply = await interaction.reply({ components: [container], flags: "IsComponentsV2" });
  const collector = reply.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", async i => {
    const setting = await settingComponent(i.customId);
    const actualSetting = await getSetting(guild.id, key, i.customId);
    switch (setting.data.type) {
      case "bool":
        (setting.component as ButtonBuilder)
          .setLabel(humanizeSettings(capitalize((!actualSetting)?.toString() ?? "Not set")))
          .setStyle(setting ? ButtonStyle.Success : ButtonStyle.Danger);

        console.log(setting.component);
        await setSetting(guild.id, key, i.customId, !actualSetting);
        break;
    }

    await i.update({ components: [container], flags: "IsComponentsV2" });
  });
}
