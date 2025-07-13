import { getSetting, resetSetting, setSetting, settingsDefinition } from "database/settings";
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
  resetMode: boolean,
) {
  for (const name of Object.keys(settingsObj)) {
    const object = await settingComponent(name, resetMode);
    if (!object) return;
    const component = object.component;

    if (component instanceof ButtonBuilder)
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(object.text))
          .setButtonAccessory(component as ButtonBuilder),
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

type opt = "bool" | "channel" | "user" | "role" | "log" | "egg" | "other" | "reset";

type SettingComponent = (
  name: string,
  reset: boolean,
) => Promise<
  | {
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
    }
  | undefined
>;

export async function settingsEmbed(
  interaction: ChatInputCommandInteraction,
  table: "server" | "user",
) {
  const id = table == "server" ? interaction.guild!.id : interaction.user.id;
  const key = interaction.options.getSubcommand();
  const settingsDef = table == "server" ? settingsDefinition[key] : userSettingsDefinition[key];
  const settingsObj = settingsDef.settings;
  const resetButtons = ["reset_start", "reset_category", "cancel", "yes", "no"];
  const color = genColorCV2(200)!;
  let settingName = "";
  let reset = false;
  let confirm = false;
  let resetCategory = false;

  const settingComponent: SettingComponent = async (name: string, reset: boolean) => {
    if (resetButtons.includes(name)) return;
    let data: { type: opt; id: string; disabled?: boolean };
    let component:
      | ButtonBuilder
      | ChannelSelectMenuBuilder
      | UserSelectMenuBuilder
      | RoleSelectMenuBuilder
      | StringSelectMenuBuilder;

    const setting = await getSettingPlease(id, key, name, table);
    const settingObject = settingsObj[name];
    const maxValues = settingObject.iterable ? 25 : 1;
    const text = `${dotCheck({ string: settingObject.emoji, doubleSpace: true, twoSides: true, includeString: true })}${humanizeSettings(name)}\n${newline(settingObject.desc, 90, "-# ")}`;

    if (reset) {
      data = { type: "reset", id: name };
      component = new ButtonBuilder()
        .setCustomId(data.id)
        .setLabel("Reset")
        .setStyle(ButtonStyle.Danger);

      return { text, data, component };
    }

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

  const buttons = (reset: boolean, confirm: boolean, disableCategory?: boolean) => {
    if (reset)
      return [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("reset_category")
            .setLabel("Reset category")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false),
        ),
      ];

    if (confirm)
      return [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("reset_category")
            .setLabel("Reset category")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disableCategory),
          new ButtonBuilder()
            .setCustomId("confirmation")
            .setLabel("You sure?")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("cancel").setLabel("No").setStyle(ButtonStyle.Primary),
        ),
      ];

    return [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("reset_start")
          .setLabel("Reset")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("desc")
          .setLabel(settingsDef.description)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
      ),
    ];
  };

  const container = new ContainerBuilder()
    .addActionRowComponents(buttons(false, false))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .setAccentColor(color);

  await construct(settingsObj, settingComponent, container, false);
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
    const cID = i.customId;
    const setting = await settingComponent(cID, reset || confirm);
    let disableCategory = false;
    switch (cID) {
      case "reset_start":
        reset = true;
        confirm = false;
        break;
      case "reset_category":
        reset = false;
        confirm = true;
        disableCategory = true;
        resetCategory = true;
        break;
      case "yes":
        if (resetCategory) await resetSetting(id, key);
        else await setSettingPlease(id, key, settingName, null, table);
        reset = false;
        confirm = false;
        break;
      case "cancel":
        reset = false;
        confirm = false;
        break;
    }

    switch (setting?.data.type) {
      case "reset":
        reset = false;
        confirm = true;
        settingName = cID;
        break;
      case "bool":
        await setSettingPlease(id, key, cID, !(await getSettingPlease(id, key, cID, table)), table);
        break;
      case "channel":
        await setSettingPlease(id, key, cID, (i as ChannelSelectMenuInteraction).values, table);
        break;
      case "user":
        await setSettingPlease(id, key, cID, (i as UserSelectMenuInteraction).values, table);
        break;
      case "role":
        await setSettingPlease(id, key, cID, (i as RoleSelectMenuInteraction).values, table);
        break;
      case "other": {
        const modal = new ModalBuilder()
          .setCustomId(i.customId)
          .setTitle(`•  ${humanizeSettings(i.customId)}`)
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("setting")
                .setPlaceholder("Put the value")
                .setMaxLength(4000)
                .setStyle(TextInputStyle.Paragraph)
                .setLabel("Value")
                .setRequired(true)
                .setValue(`${await getSettingPlease(id, key, cID, table)}`),
            ),
          );

        await i.showModal(modal);
        i.client.once("interactionCreate", async modalInteraction => {
          if (modalInteraction.isModalSubmit()) {
            const value = modalInteraction.fields.fields.find(
              field => field.customId == "setting",
            )?.value;
            await setSettingPlease(id, key, cID, value, table);

            const modalContainer = new ContainerBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `**${dotCheck({ string: settingsObj[cID].emoji, twoSides: true, includeString: true })}${humanizeSettings(cID)}** got changed`,
                ),
              )
              .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `The ${value!.length < 50 ? "value" : "**value**"} has been set to ${value!.length >= 50 ? value : `**${value}**`}`,
                ),
              )
              .setAccentColor(genColorCV2(100)!);

            await safeReply({
              interaction: modalInteraction,
              replyOptions: {
                components: [modalContainer],
                flags: ["Ephemeral", "IsComponentsV2"],
              },
            });
          }
        });
        break;
      }
      default:
        await setSettingPlease(id, key, cID, (i as StringSelectMenuInteraction).values, table);
        break;
    }

    const newContainer = new ContainerBuilder()
      .addActionRowComponents(buttons(reset, confirm, disableCategory))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .setAccentColor(color);

    await construct(settingsObj, settingComponent, newContainer, reset || confirm);
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
