import { getSetting, setSetting, settingsDefinition, settingsKeys } from "database/settings";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  PermissionsBitField,
  RoleSelectMenuBuilder,
  SectionBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  type ChannelSelectMenuInteraction,
  type ChatInputCommandInteraction,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
  type UserSelectMenuInteraction,
} from "discord.js";
import { errorEmbedCV2 } from "embeds/errorEmbed";
import { auditEventNames, easterEggNames } from "handlers/events";
import { capitalize } from "utils/capitalize";
import { genColorCV2 } from "utils/colorGen";
import { humanizeSettings } from "utils/humanizeSettings";
import { kominator } from "utils/kominator";
import { newline } from "utils/newline";
import { safeReply } from "utils/safeReply";

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

async function construct(
  settingsObj: Record<string, any>,
  settingComponent: SettingComponent,
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

type SettingComponent = (name: string) => Promise<{
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
  const settingComponent: SettingComponent = async (name: string) => {
    const setting = await getSetting(guild.id, key, name);
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

        if (setting) component.setDefaultUsers(kominator(setting as string));
        break;
      case "ROLE":
        data = { type: "role", id: name };
        component = new RoleSelectMenuBuilder()
          .setCustomId(data.id)
          .setMaxValues(maxValues)
          .setDefaultRoles(kominator(setting as string));

        if (setting) component.setDefaultRoles(kominator(setting as string));
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
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsDef.description))
    .setAccentColor(color);

  await construct(settingsObj, settingComponent, container);
  const reply = await interaction.reply({ components: [container], flags: "IsComponentsV2" });
  const collector = reply.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", async i => {
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbedCV2({
        interaction: i,
        title:
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      });

    if (i.user.id != interaction.user.id)
      return await errorEmbedCV2({
        interaction: i,
        title: "You aren't the person who executed this command.",
      });

    collector.resetTimer({ time: 60000 });
    switch ((await settingComponent(i.customId)).data.type) {
      case "bool":
        await setSetting(guild.id, key, i.customId, !(await getSetting(guild.id, key, i.customId)));
        break;
      case "channel":
        await setSetting(guild.id, key, i.customId, (i as ChannelSelectMenuInteraction).values);
        break;
      case "user":
        await setSetting(guild.id, key, i.customId, (i as UserSelectMenuInteraction).values);
        break;
      case "role":
        await setSetting(guild.id, key, i.customId, (i as RoleSelectMenuInteraction).values);
        break;
      case "other": {
        const modal = new ModalBuilder()
          .setCustomId(i.customId)
          .setTitle(i.customId)
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("setting")
                .setPlaceholder("Put the value")
                .setMaxLength(4000)
                .setStyle(TextInputStyle.Paragraph)
                .setLabel("Value")
                .setRequired(true),
            ),
          );

        await i.showModal(modal);
        i.client.once("interactionCreate", async modalInteraction => {
          if (modalInteraction.isModalSubmit()) {
            await setSetting(
              guild.id,
              key,
              i.customId,
              modalInteraction.fields.fields.find(field => field.customId == "setting")?.value,
            );
          }
        });
        break;
      }
      default:
        await setSetting(guild.id, key, i.customId, (i as StringSelectMenuInteraction).values);
        break;
    }

    const newContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${settingsDef.description}`))
      .setAccentColor(color);

    await construct(settingsObj, settingComponent, newContainer);
    await safeReply({
      interaction: i,
      editOptions: { components: [newContainer], flags: "IsComponentsV2" },
    });
  });

  collector.on("end", async () => {
    try {
      await interaction.deleteReply();
    } catch (error) {
      if (Error.isError(error) && error.message.toLowerCase().includes("unknown message")) return;
      throw error;
    }
  });
}
