import {
  AttachmentBuilder,
  codeBlock,
  ContainerBuilder,
  EmbedBuilder,
  FileBuilder,
  MessageCreateOptions,
  type AnySelectMenuInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
  type InteractionResponse,
  type Message,
  type ModalSubmitInteraction,
} from "discord.js";
import { safeChannel, safeReply } from "utils/safeThings";
import { Sokolors } from "../colorGen";
import { errorType } from "../errorType";
import SimpleEmbedBuilder from "./SimpleEmbedBuilder";

/**
 * Sends the embed containing an error.
 * @param interaction The interaction (slash command).
 * @param title The error.
 * @param reason The reason of the error.
 * @param forward Whether or not should the error embed be forwarded to the error log channel.
 * @returns Embed with the error description.
 */
export async function errorEmbed(options: {
  interaction?: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction;
  client?: Client;
  error?: unknown | Error;
  title?: string;
  reason?: string;
  log?: boolean;
  forward?: boolean;
  fileName?: string;
  dmOwner?: boolean;
  cv2?: boolean;
}) {
  const { interaction, title, reason, log, forward, fileName, dmOwner, cv2 } = options;
  const client = options.client ? options.client : interaction ? interaction.client : null;
  if (!client && !interaction)
    return console.error(
      "You need to provide either a client or an interaction for errorEmbed to work.",
    );

  const error = errorType(options.error);
  const stack = error.stack;
  const content = [];
  if (title) content.push(`**${title}**`);
  if (reason) content.push(reason);
  if (!title && !reason)
    content.push(
      `The bot has experienced an internal error.\nThe team has been informed. [If you keep encountering this issue, please go to our support server to report it.](https://discord.gg/c6C25P4BuY)`,
    );

  const embed = await SimpleEmbedBuilder.from(
    {
      author: "Something went wrong!",
      desc: content.join("\n"),
      fields: options.error
        ? [
            { divider: true },
            {
              name: "💬 • Error message",
              value: `${codeBlock(error.message)}${fileName ? `in \`${fileName}\`` : ""}`,
            },
            {
              name: "📜 • Error stack",
              value: stack
                ? stack.length <= 4096
                  ? codeBlock(stack)
                  : "The error stacktrace is an attachment below this embed due to it being too large."
                : "No error stacktrace.",
            },
          ]
        : [],
      color: { hue: Sokolors.Red },
    },
    cv2,
  );

  const files: AttachmentBuilder[] = [];
  if (stack && stack.length >= 4096) {
    files.push(new AttachmentBuilder(Buffer.from(stack, "utf8"), { name: "error.txt" }));
    if (cv2)
      (embed as ContainerBuilder).addFileComponents(
        new FileBuilder().setURL("attachment://error.txt"),
      );
  }

  let messageObject: MessageCreateOptions = { files };
  let flags: any[] = []; // I don't like it but i'm forced to do it like this (flags don't have their separate type)
  if (embed instanceof EmbedBuilder) messageObject.embeds = [embed];
  else {
    messageObject.components = [embed];
    flags.push("IsComponentsV2");
  }

  if (forward) {
    if (!process.env.DEV_ERROR_CHANNEL_ID) {
      console.log(
        "hey, you don't have DEV_ERROR_CHANNEL_ID set in .env and the bot tried to forward an error message to undefined :D",
      );
      return console.error(error);
    }

    const channel = await safeChannel(
      client ?? interaction!.client,
      process.env.DEV_ERROR_CHANNEL_ID,
    );
    if (!channel?.isTextBased() || !channel.isSendable()) return;
    await channel.send({ ...messageObject, flags });
  }

  if (dmOwner) {
    const dm = await (await interaction?.guild!.fetchOwner())?.createDM().catch(() => null);
    if (dm) await dm.send({ ...messageObject, flags });
  }

  if (log) console.error(error);
  if (interaction) {
    flags.push("Ephemeral");
    return await safeReply({
      interaction,
      replyOptions: { ...messageObject, flags },
    });
  }
}

export async function buttonCheck(options: {
  i: ButtonInteraction | AnySelectMenuInteraction;
  interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction;
  reply: Message | InteractionResponse;
  cv2: boolean;
  noExecuteError?: boolean;
}) {
  const { i, interaction, reply, cv2, noExecuteError } = options;
  if (i.message.id != (await reply.fetch()).id) {
    return await errorEmbed({
      interaction: i,
      title:
        "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      cv2,
    });
  }

  if (noExecuteError) return;
  if (i.user.id != interaction.user.id) {
    return await errorEmbed({
      interaction: i,
      title: "You are not the person who executed this command.",
      cv2,
    });
  }
}
