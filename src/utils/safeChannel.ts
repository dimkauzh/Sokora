import type { Guild } from "discord.js";

/**
 * Ensures that the channel that you're getting will be gotten.
 * @param guild The guild where the channel resides.
 * @param id The ID of the channel.
 * @returns A channel.
 */
export async function safeChannel(guild: Guild, id: string) {
  return (guild.channels.cache.get(id) ?? (await guild.channels.fetch(id)))!;
}
