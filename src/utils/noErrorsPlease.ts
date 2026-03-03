import type { ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorType } from "./errorType";

const errorRateLimit = new Set<string>();
export async function noErrorsPlease(interaction: ChatInputCommandInteraction, fileName: string) {
  process.removeAllListeners();
  const sendErrorMessage = async (
    error: Error,
    eventType: string,
    additionalInfo: string = "",
  ): Promise<void> => {
    const errorKey = `${eventType}-${additionalInfo}`;
    if (errorRateLimit.has(errorKey)) return;

    errorRateLimit.add(errorKey);
    setTimeout(() => errorRateLimit.delete(errorKey), 10000);
    try {
      await errorEmbed({ interaction, error, log: true, forward: true, fileName });
    } catch (e) {
      console.error("Failed to send error message");
      console.error(e);
    };
  };

  const processEventListeners: { [key: string]: { listener: (...args: any[]) => Promise<void> } } =
    {
      unhandledRejection: {
        listener: async (reason, promise) => {
          return await sendErrorMessage(
            errorType(reason),
            "unhandledRejection",
            `Promise: ${promise}`,
          );
        },
      },
      uncaughtException: {
        listener: async (error, origin) => {
          return await sendErrorMessage(errorType(error), "uncaughtException", `Origin: ${origin}`);
        },
      },
    };

  for (const [event, { listener }] of Object.entries(processEventListeners))
    process.on(event, async (...args) => {
      try {
        return await listener(...args);
      } catch (err) {
        return await sendErrorMessage(errorType(err), "listenerError", `Event: ${event}`);
      }
    });
}
