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
const getQuery = sql`SELECT * FROM levelBlockedChannels WHERE guild = $1 AND channel = $2;`;
const listQuery = sql`SELECT * FROM levelBlockedChannels WHERE guild = $1`;
const addQuery = sql`INSERT INTO levelBlockedChannels (guild, channel) VALUES (?1, ?2);`;
const removeQuery = sql`DELETE FROM levelBlockedChannels WHERE guild = $1 AND channel = $2;`;

export function getBlockedChannels(guildID: string, channelID: string) {
  return getQuery.all(guildID, channelID).length == 0;
}

export function listBlockedChannels(guildID: string) {
  return (listQuery.all(guildID) as TypeOfDefinition<typeof def>[]).map(val => val.channel);
}

export function blockChannel(guildID: string, channelID: string) {
  addQuery.run(guildID, channelID);
}

export function unblockChannel(guildID: string, channelID: string) {
  removeQuery.run(guildID, channelID);
}
