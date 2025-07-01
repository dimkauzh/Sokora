// huge work in progress
import { getSetting, setSetting, settingsDefinition, settingsKeys } from "database/settings";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ChannelType,
  ContainerBuilder,
  MessageActionRowComponentBuilder,
  PermissionsBitField,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  SectionBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { auditEventNames, easterEggNames } from "handlers/events";
import { capitalize } from "utils/capitalize";
import { genColorCV2 } from "utils/colorGen";
import { humanizeSettings } from "utils/humanizeSettings";
import { kominator } from "utils/kominator";
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

// okay extracting a function *like this* is probably not the best approach
// BUT IT IS AN APPROACH THAT WORKS SO IT IS ALREADY BETTER THAN ANYTHING ELSE so
// shut up and accept this.
async function constructThisShit(
  settingsObj: Record<string, any>,
  settingComponent: TSettingComponent,
  container: ContainerBuilder,
) {
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
}

type opt = "bool" | "channel" | "user" | "role" | "log" | "egg" | "other";

// this is neither best but again shut up
type TSettingComponent = (name: string) => Promise<{
  text: string;
  data: {
    type: opt;
    id: string;
  };
  component:
    | ButtonBuilder
    | ChannelSelectMenuBuilder
    | UserSelectMenuBuilder
    | RoleSelectMenuBuilder
    | StringSelectMenuBuilder;
}>;

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const key = interaction.options.getSubcommand();
  const settingsDef = settingsDefinition[key];
  const settingsObj = settingsDef.settings;
  const settingComponent: TSettingComponent = async (name: string) => {
    const setting = await getSetting(guild.id, key, name);
    console.debug("CV2 setting read as", setting);
    const settingObject = settingsObj[name];
    const maxValues = settingObject.iterable ? 25 : 1;
    const text = `${humanizeSettings(capitalize(name))}\n-# ${newline(settingObject.desc)}`;
    let data: { type: opt; id: string };
    let component:
      | ButtonBuilder
      | ChannelSelectMenuBuilder
      | UserSelectMenuBuilder
      | RoleSelectMenuBuilder
      | StringSelectMenuBuilder;

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

        if (setting) component.setDefaultChannels(kominator(setting as string));

        break;
      case "USER":
        data = { type: "user", id: name };
        component = new UserSelectMenuBuilder()
          .setCustomId(data.id)
          .setMaxValues(maxValues)
          .setDefaultUsers(kominator(setting as string));

        break;
      case "ROLE":
        data = { type: "role", id: name };
        component = new RoleSelectMenuBuilder()
          .setCustomId(data.id)
          .setMaxValues(maxValues)
          .setDefaultRoles(kominator(setting as string));

        break;
      case "LOG":
        data = { type: "log", id: name };
        component = new StringSelectMenuBuilder()
          .setCustomId(data.id)
          .setMaxValues(auditEventNames.length)
          .setOptions(
            auditEventNames.map(option =>
              new StringSelectMenuOptionBuilder()
                .setLabel(option)
                .setValue(option)
                .setDefault(kominator((setting as string | undefined) || "").includes(option)),
            ),
          );
        break;
      case "EGG":
        data = { type: "egg", id: name };
        component = new StringSelectMenuBuilder()
          .setCustomId(data.id)
          .setMaxValues(easterEggNames.length)
          .setOptions(
            easterEggNames.map(option =>
              new StringSelectMenuOptionBuilder()
                .setLabel(option)
                .setValue(option)
                .setDefault(kominator((setting as string | undefined) || "").includes(option)),
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

  const color = genColorCV2(200)!;
  // const avatar = interaction.guild!.iconURL()!;
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsDef.description))
    .setAccentColor(color);

  await constructThisShit(settingsObj, settingComponent, container);

  const reply = await interaction.reply({ components: [container], flags: "IsComponentsV2" });
  const collector = reply.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", async i => {
    const setting = await settingComponent(i.customId);
    const actualSetting = await getSetting(guild.id, key, i.customId);
    switch (setting.data.type) {
      case "bool":
        await setSetting(guild.id, key, i.customId, !actualSetting);
        break;
      case "egg":
      case "user":
      case "role":
      case "channel": {
        const values = (
          i as
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | ChannelSelectMenuInteraction
        ).values;
        console.debug("\n\nAAAAAAAAAAAAAAAAAAAAAAAAA Discord gave", values);
        await setSetting(guild.id, key, i.customId, values);
        console.debug("Broke EGG/USR/ROLE/CHANNEL loop");
        break;
      }
    }
    const newContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsDef.description))
      .setAccentColor(color);

    await constructThisShit(settingsObj, settingComponent, newContainer);

    await i.update({ components: [newContainer], flags: "IsComponentsV2" });
  });
}
