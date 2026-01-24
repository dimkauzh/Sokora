import { getLevelRewards } from "database/leveling";
import {
  getSetting,
  getSettingCategory,
  resetSetting,
  resetSettingCategory,
  setSetting,
  settingsDefinition,
} from "database/settings";
import { FieldData, SingleSettingDefinition } from "database/types";
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
  LabelBuilder,
  MentionableSelectMenuBuilder,
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
  codeBlock,
  type AnySelectMenuInteraction,
  type ChatInputCommandInteraction,
  type RGBTuple,
} from "discord.js";
import { easterEggNames } from "handlers/events";
import { colorize } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { humanizeSettings, humanizeType } from "utils/humanizeSettings";
import { kominator } from "utils/kominator";
import { mention } from "utils/mention";
import { safeMember, safeReply } from "utils/safeThings";
import { buttonCheck } from "./errorEmbed";

async function construct(
  settingsObj: Record<string, SingleSettingDefinition> | Record<string, SingleSettingDefinition>[],
  settingComponent: SettingComponent,
  container: ContainerBuilder,
  resetMode: boolean,
  editView?: boolean,
  itrObjectView?: boolean,
  cID?: string,
) {
  if (editView || itrObjectView)
    container
      .addActionRowComponents(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(editView ? "cancel" : "return")
            .setLabel(editView ? "Cancel" : "Return")
            .setStyle(ButtonStyle.Secondary),
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  async function constructLoop(object: Help) {
    if (!object) return;
    const component = object.component;

    if (object.data.id == cID && object.data.type == "reset") component.setDisabled(true);
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

  if (!itrObjectView)
    for (const name of Object.keys(settingsObj))
      await constructLoop(await settingComponent(settingsObj, name, resetMode));
  else
    for (const obj of settingsObj as Record<string, any>[])
      await constructLoop(await settingComponent(settingsObj, `lvl${obj.level}`, resetMode, true));

  return container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
}

async function getSettingPlease(
  id: string,
  key: string,
  setting: string,
  table: "server" | "user",
) {
  if (table == "server") return await getSetting(id, key, setting);
  else return await getUserSetting(id, key, setting);
}

async function setSettingPlease(
  id: string,
  key: string,
  setting: string,
  value: any,
  table: "server" | "user",
) {
  if (table == "server") return setSetting(id, key, setting, value);
  else return await setUserSetting(id, key, setting, value);
}

type Help =
  | {
      text: string;
      data: { type: string; id: string };
      component:
        | ButtonBuilder
        | ChannelSelectMenuBuilder
        | UserSelectMenuBuilder
        | RoleSelectMenuBuilder
        | StringSelectMenuBuilder
        | MentionableSelectMenuBuilder;
    }
  | undefined;

type SettingComponent = (
  settingsObj: Record<string, SingleSettingDefinition> | Record<string, SingleSettingDefinition>[],
  name: string,
  reset: boolean,
  itrObjectView?: boolean,
) => Promise<Help>;

// basic, but gets the job done
function isValueValid(value: string | undefined, type: FieldData): boolean {
  if (!value || value.trim() == "") return false;
  if (type == "INTEGER" || type == "TEXT") if (isNaN(Number(value))) return false;
  return true;
}

export async function settingsEmbed(
  interaction: ChatInputCommandInteraction,
  table: "server" | "user",
) {
  const guild = interaction.guild;
  if (!guild) return;
  const user = interaction.user;
  const id = table == "server" ? guild.id : user.id;
  const key = interaction.options.getSubcommand();
  const settingsDef = table == "server" ? settingsDefinition[key] : userSettingsDefinition[key];
  const exemptButtons = ["reset_start", "reset_category", "cancel", "yes", "no", "return", "add"];
  const eventNames = ["messageUpdate", "messageDelete"];
  const color = (await colorize({ hue: 200, cv2: true })) as RGBTuple;
  let settingsObj = settingsDef.settings;
  let settingName = "";
  let reset = false;
  let confirm = false;
  let resetCategory = false;
  let disableCategory = false;
  let itrObjectView = false;
  let editView = false;

  const settingComponent: SettingComponent = async (
    settingsObj:
      | Record<string, SingleSettingDefinition>
      | Record<string, SingleSettingDefinition>[],
    name: string,
    reset: boolean,
    itrObjectView?: boolean,
  ) => {
    if (exemptButtons.includes(name) || exemptButtons.map(name => `obj${name}`).includes(name))
      return;

    let data: { type: string; id: string };
    let component:
      | ButtonBuilder
      | ChannelSelectMenuBuilder
      | UserSelectMenuBuilder
      | RoleSelectMenuBuilder
      | StringSelectMenuBuilder
      | MentionableSelectMenuBuilder;

    let text: string;
    const resetObj = (text: string, itrObject?: boolean) => {
      data = { type: "reset", id: name };
      component = new ButtonBuilder()
        .setCustomId(data.id)
        .setLabel(itrObject ? "Delete" : "Reset")
        .setStyle(ButtonStyle.Danger);

      if (!itrObject)
        if (settingObject.val == setting || settingObject.type == "OBJECT")
          component.setDisabled(true);

      return { text, data, component };
    };

    if (itrObjectView) {
      const reward = (await getLevelRewards(id))?.find(r => name.includes(r.level.toString()));
      if (reward)
        text = `Level **${reward?.level}**\n-# Rewards • ${mention(reward?.id, reward?.channel ? "CHANNEL" : "ROLE")}`;
      else text = "uh oh!";

      data = { type: "lvl", id: name };
      component = new ButtonBuilder()
        .setCustomId(data.id)
        .setLabel("Edit")
        .setStyle(ButtonStyle.Secondary);

      if (reset) return resetObj(text, true);
      return { text, data, component };
    }

    // todo: figure out what to do with this thing erroring
    const setting = await getSettingPlease(id, key, name, table);
    const settingObject =
      typeof settingsObj === "object"
        ? (settingsObj as Record<string, SingleSettingDefinition>)[name]
        : (settingsObj as Record<string, SingleSettingDefinition>)[name].settings!;

    const maxValues = settingObject.iterable ? 25 : 1;
    text = `${dotCheck({ string: settingObject.emoji as string, doubleSpace: true, twoSides: true, includeString: true })}${humanizeSettings(name)}\n-# ${settingObject.desc}`;
    if (reset) return resetObj(text, false);

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
            ChannelType.GuildStageVoice,
            ChannelType.GuildText,
            ChannelType.GuildVoice,
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
          .setMaxValues(eventNames.length)
          .setOptions(
            eventNames.map(option =>
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
      case "OBJECT":
        data = { type: "object", id: name };
        component = new ButtonBuilder()
          .setCustomId(data.id)
          .setLabel("suffer")
          .setStyle(ButtonStyle.Danger);

        break;
      case "REWARD":
        data = { type: "reward", id: name };
        component = new MentionableSelectMenuBuilder().setCustomId(data.id);
        break;
      default:
        data = { type: settingObject.type == "INTEGER" ? "number" : "text", id: name };
        component = new ButtonBuilder()
          .setCustomId(data.id)
          .setLabel("Edit")
          .setStyle(ButtonStyle.Secondary);

        break;
    }

    if (
      (name == "server_invite" || name == "invite_channel") &&
      (!(await safeMember(guild, interaction.client.user.id))?.permissions.has(
        "CreateInstantInvite",
      ) ||
        !(await safeMember(guild, interaction.client.user.id))?.permissions.has("ManageGuild"))
    ) {
      resetSetting(id, "serverboard", "server_invite");
      resetSetting(id, "serverboard", "invite_channel");
      text = `${dotCheck({ string: ":warning:", doubleSpace: true, twoSides: true, includeString: true })}${humanizeSettings(name)}\n-# The **Create Invite** and/or the **Manage Server** permissions are required for this setting to work.`;
      component.setDisabled(true);
    }

    if (table == "user") {
      const dmChannel = await (await safeMember(guild, id)).createDM();
      if (name == "remind" && (!dmChannel || !dmChannel.isSendable())) {
        await setUserSetting(id, "topgg", "remind", false);
        text = `${dotCheck({ string: ":warning:", doubleSpace: true, twoSides: true, includeString: true })}${humanizeSettings(name)}\n-# Sokora cannot DM you. Enable DMs for Sokora or send it a message to get top.gg notifications.`;
        component.setDisabled(true);
      }
    }

    return { text, data, component };
  };

  const buttons = async (
    reset: boolean,
    confirm: boolean,
    disableCategory?: boolean,
    itrObjectView?: boolean,
  ) => {
    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
    const category = new ButtonBuilder()
      .setCustomId("reset_category")
      .setLabel("Reset category")
      .setStyle(ButtonStyle.Danger);

    const itrObjectIdify = (id: string) => `obj${id}`;
    if (reset) {
      if (!itrObjectView) actionRow.addComponents(category);
      return [
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(itrObjectIdify("cancel"))
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false),
        ),
      ];
    }

    if (confirm) {
      if (!itrObjectView) actionRow.addComponents(category.setDisabled(disableCategory));
      return [
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(itrObjectIdify("yes"))
            .setLabel("Yes")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(itrObjectIdify("cancel"))
            .setLabel("No")
            .setStyle(ButtonStyle.Primary),
        ),
      ];
    }

    const buttonArray = [
      new ButtonBuilder()
        .setCustomId("desc")
        .setLabel(itrObjectView ? settingsObj["rewards"].desc : settingsDef.description)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    ];

    const actual = (await getSettingCategory(id, key)).map(setting => setting ?? null);
    const defaults = Object.values(settingsObj).map(setting => setting.val ?? null);
    const nullCheck = itrObjectView
      ? !(await getLevelRewards(id))?.every(value => value == null)
      : !actual.every(value => value == defaults[actual.indexOf(value)]);

    if (nullCheck)
      buttonArray.unshift(
        new ButtonBuilder()
          .setCustomId(itrObjectIdify("reset_start"))
          .setLabel(itrObjectView ? "Delete" : "Reset")
          .setStyle(ButtonStyle.Danger),
      );

    if (itrObjectView) {
      buttonArray.unshift(
        new ButtonBuilder()
          .setCustomId(itrObjectIdify("add"))
          .setLabel("Add")
          .setStyle(ButtonStyle.Success),
      );
    }

    return [actionRow.addComponents(buttonArray)];
  };

  const container = new ContainerBuilder().setAccentColor(color);
  await construct(settingsObj, settingComponent, container, false, false);
  if (table == "server") container.addActionRowComponents(await buttons(false, false));
  else
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(settingsDef.description),
    );

  const reply = await interaction.reply({
    components: [container],
    flags: ["Ephemeral", "IsComponentsV2"],
  });
  const collector = reply.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", async i => {
    if (await buttonCheck({ i, interaction, reply, cv2: true })) return;
    collector.resetTimer({ time: 60000 });
    const cID = i.customId;

    async function end(
      reset: boolean,
      confirm: boolean,
      editView: boolean,
      itrObjectView: boolean,
    ) {
      if (editView) settingsObj = settingsObj["rewards"].settings!;
      const newContainer = new ContainerBuilder().setAccentColor(color);
      await construct(
        itrObjectView
          ? ((await getLevelRewards(id))!.sort(
              (reward1, reward2) => reward1.level - reward2.level,
            ) as any)
          : settingsObj,
        settingComponent,
        newContainer,
        reset || confirm,
        editView ?? false,
        itrObjectView ?? false,
        cID,
      );

      if (table == "server")
        newContainer.addActionRowComponents(
          await buttons(reset, confirm, disableCategory, itrObjectView),
        );
      else
        newContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(settingsDef.description),
        );

      return await safeReply({
        interaction: i,
        editOptions: { components: [newContainer], flags: "IsComponentsV2" },
      });
    }

    switch (cID.replace("obj", "")) {
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
        if (resetCategory) resetSettingCategory(id, key);
        else await setSettingPlease(id, key, settingName, null, table);
        reset = false;
        confirm = false;
        break;
      case "cancel":
        reset = false;
        confirm = false;
        if (editView) {
          editView = false;
          settingsObj = settingsDef.settings;
          itrObjectView = true;
        }
        break;
      case "return":
        itrObjectView = false;
        break;
      case "add":
        itrObjectView = false;
        editView = true;
        break;
    }

    switch ((await settingComponent(settingsObj, cID, reset || confirm))?.data.type) {
      case "reset":
        reset = false;
        confirm = true;
        settingName = cID;
        break;
      case "bool":
        await setSettingPlease(id, key, cID, !(await getSettingPlease(id, key, cID, table)), table);
        break;
      case "object":
        itrObjectView = true;
        break;
      case "lvl":
        itrObjectView = false;
        editView = true;
        break;
      case "number":
      case "text": {
        const modal = new ModalBuilder()
          .setCustomId(cID)
          .setTitle(`•  ${humanizeSettings(cID)}`)
          .addLabelComponents(
            new LabelBuilder().setLabel("Value").setTextInputComponent(
              new TextInputBuilder()
                .setCustomId("setting")
                .setPlaceholder("Type in the value")
                .setMaxLength(4000)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue(`${await getSettingPlease(id, key, cID, table)}`),
            ),
          );

        await i.showModal(modal);
        i.client.once("interactionCreate", async modalInteraction => {
          if (!modalInteraction.isModalSubmit()) return;
          async function constructModalContainer(
            settingText: string,
            valueText: string,
            hue: number,
          ) {
            return new ContainerBuilder()
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(settingText))
              .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(valueText))
              .setAccentColor((await colorize({ hue, cv2: true })) as RGBTuple);
          }

          const value = modalInteraction.fields.getTextInputValue("setting");
          const length = value!.length;
          let settingText = `**${dotCheck({ string: settingsObj[cID].emoji, twoSides: true, includeString: true })}${humanizeSettings(cID)}** got changed`;
          let valueText = `The ${value!.length < 50 ? "value" : "**value**"} has been set ${length >= 500 ? "successfully." : length >= 50 ? `to ${value}` : `to **${value}**`}`;
          let hue = 100;

          if (!isValueValid(value, settingsObj[cID].type)) {
            settingText = `**${dotCheck({ string: settingsObj[cID].emoji, twoSides: true, includeString: true })}${humanizeSettings(cID)}** couldn't be changed!`;
            valueText = `Given data is invalid. Ensure it's of the valid type (${humanizeType(settingsObj[cID].type)}) and try again.${length >= 500 ? "" : `\nData entered was:\n${codeBlock(value!)}`}`;
            hue = 0;
            return;
          } else await setSettingPlease(id, key, cID, value, table);

          await safeReply({
            interaction: modalInteraction,
            replyOptions: {
              components: [await constructModalContainer(settingText, valueText, hue)],
              flags: ["Ephemeral", "IsComponentsV2"],
            },
          });
          await end(reset, confirm, editView, itrObjectView);
        });
        break;
      }
      default:
        await setSettingPlease(id, key, cID, (i as AnySelectMenuInteraction).values, table);
        break;
    }

    if (
      (await settingComponent(settingsObj, cID, reset || confirm))?.data.type != "text" ||
      (await settingComponent(settingsObj, cID, reset || confirm))?.data.type != "number"
    )
      await end(reset, confirm, editView, itrObjectView);
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
