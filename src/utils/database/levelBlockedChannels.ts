import { sql } from "bun";
import { TableDefinition, TypeOfDefinition } from "./types";

const def = {
  name: "levelBlockedChannels",
  definition: {
    guild: "TEXT",
    channel: "TEXT",
  },
} satisfies TableDefinition;

await sql`CREATE TABLE IF NOT EXISTS levelBlockedChannels (guild TEXT, channel TEXT);`;

export async function getBlockedChannels(guildID: string, channelID: string) {
  return (
    (
      await sql`SELECT * FROM levelBlockedChannels WHERE guild = ${guildID} AND channel = ${channelID};`
    ).length == 0
  );
}

export async function listBlockedChannels(guildID: string) {
  return (
    (await sql`SELECT * FROM levelBlockedChannels WHERE guild = ${guildID}`) as TypeOfDefinition<
      typeof def
    >[]
  ).map(val => val.channel);
}

export async function blockChannel(guildID: string, channelID: string) {
  await sql`INSERT INTO levelBlockedChannels (guild, channel) VALUES (${guildID}, ${channelID});`;
}

export async function unblockChannel(guildID: string, channelID: string) {
  await sql`DELETE FROM levelBlockedChannels WHERE guild = ${guildID} AND channel = ${channelID});`;
}
