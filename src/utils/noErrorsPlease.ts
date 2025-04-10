import type { Client } from "discord.js";
import { logError } from "./embeds/errorEmbed";
import { errorType } from "./errorType";

const errorRateLimit = new Set<string>();
export async function noErrorsPlease(client: Client) {
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
    await logError({ error, client });
  };

  const handleError = async (error: Error, eventType: string, additionalInfo: string = "") => {
    console.log(error);
    return await sendErrorMessage(error, eventType, additionalInfo);
  };

  const processEventListeners: { [key: string]: { listener: (...args: any[]) => void } } = {
    unhandledRejection: {
      listener: async (reason, promise) =>
        await handleError(errorType(reason), "unhandledRejection", `Promise: ${promise}`),
    },
    uncaughtException: {
      listener: async (error, origin) =>
        await handleError(errorType(error), "uncaughtException", `Origin: ${origin}`),
    },
    uncaughtExceptionMonitor: {
      listener: async (error, origin) =>
        await handleError(errorType(error), "uncaughtExceptionMonitor", `Origin: ${origin}`),
    },
  };

  for (const [event, { listener }] of Object.entries(processEventListeners))
    process.on(event, async (...args) => {
      try {
        listener(...args);
      } catch (err) {
        await handleError(errorType(err), "listenerError", `Event: ${event}`);
      }
    });
}
