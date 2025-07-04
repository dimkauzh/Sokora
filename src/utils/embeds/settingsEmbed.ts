import { getSetting, setSetting, settingsDefinition } from "database/settings";
import {
  getUserSetting,
  setUserSetting,
  settingsDefinition as userSettingsDefinition,
} from "database/userSettings";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  SectionBuilder,
  SeparatorBuilder,
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
import { auditEventNames, easterEggNames } from "handlers/events";
import { genColorCV2 } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { humanizeSettings } from "utils/humanizeSettings";
import { kominator } from "utils/kominator";
import { newline } from "utils/newline";
import { safeReply } from "utils/safeReply";
import { errorEmbedCV2 } from "./errorEmbed";

async function construct(
  settingsObj: Record<string, any>,
  settingComponent: SettingComponent,
  container: ContainerBuilder,
) {
  for (const name of Object.keys(settingsObj)) {
    const object = await settingComponent(name);
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

async function getSettingPlease(
  guildID: string,
  key: string,
  setting: string,
  table: "server" | "user",
) {
  if (table == "server") return await getSetting(guildID, key, setting);
  else return await getUserSetting(guildID, key, setting);
}

async function setSettingPlease(
  guildID: string,
  key: string,
  setting: string,
  value: any,
  table: "server" | "user",
) {
  if (table == "server") return await setSetting(guildID, key, setting, value);
  else return await setUserSetting(guildID, key, setting, value);
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

export async function settingsEmbed(
  interaction: ChatInputCommandInteraction,
  table: "server" | "user",
) {
  const id = table == "server" ? interaction.guild!.id : interaction.user.id;
  const key = interaction.options.getSubcommand();
  const settingsDef = table == "server" ? settingsDefinition[key] : userSettingsDefinition[key];
  const settingsObj = settingsDef.settings;
  const settingComponent: SettingComponent = async (name: string) => {
    const setting = await getSettingPlease(id, key, name, table);
    const settingObject = settingsObj[name];
    const maxValues = settingObject.iterable ? 25 : 1;
    const text = `${dotCheck({ string: settingObject.emoji, doubleSpace: true, twoSides: true, includeString: true })}${humanizeSettings(name)}\n${newline(settingObject.desc, 80, "-# ")}`;
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
          .setLabel(humanizeSettings(setting?.toString() ?? "Not set"))
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
        await setSettingPlease(
          id,
          key,
          i.customId,
          !(await getSettingPlease(id, key, i.customId, table)),
          table,
        );
        break;
      case "channel":
        await setSettingPlease(
          id,
          key,
          i.customId,
          (i as ChannelSelectMenuInteraction).values,
          table,
        );
        break;
      case "user":
        await setSettingPlease(id, key, i.customId, (i as UserSelectMenuInteraction).values, table);
        break;
      case "role":
        await setSettingPlease(id, key, i.customId, (i as RoleSelectMenuInteraction).values, table);
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
            const value = modalInteraction.fields.fields.find(
              field => field.customId == "setting",
            )?.value;
            await setSettingPlease(id, key, i.customId, value, table);
            const modalContainer = new ContainerBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `**${settingsObj[i.customId].emoji}  •  ${humanizeSettings(i.customId)}** got changed`,
                ),
              )
              .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `The ${value!.length < 50 ? "value" : "**value**"} has been set to ${value!.length >= 50 ? value : `**${value}**`}`,
                ),
              )
              .setAccentColor(genColorCV2(100)!);

            await modalInteraction.reply({ components: [modalContainer], flags: "IsComponentsV2" });
          }
        });
        break;
      }
      default:
        await setSettingPlease(
          id,
          key,
          i.customId,
          (i as StringSelectMenuInteraction).values,
          table,
        );
        break;
    }

    const newContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsDef.description))
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
