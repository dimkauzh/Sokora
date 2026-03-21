import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "levelBlockedChannels",
  definition: {
    guild: "TEXT",
    channel: "TEXT",
  },
} satisfies TableDefinition;

const database = getDatabase(tableDefinition);
const getQuery = database`SELECT * FROM levelBlockedChannels WHERE guild = $1 AND channel = $2;`;
const listQuery = database`SELECT * FROM levelBlockedChannels WHERE guild = $1`;
const addQuery = database`INSERT INTO levelBlockedChannels (guild, channel) VALUES (?1, ?2);`;
const removeQuery = database`DELETE FROM levelBlockedChannels WHERE guild = $1 AND channel = $2;`;

export function getBlockedChannels(guildID: string, channelID: string) {
  return getQuery.all(guildID, channelID).length == 0;
}

export function listBlockedChannels(guildID: string) {
  return (listQuery.all(guildID) as TypeOfDefinition<typeof tableDefinition>[]).map(
    val => val.channel,
  );
}

export function blockChannel(guildID: string, channelID: string) {
  addQuery.run(guildID, channelID);
}

export function unblockChannel(guildID: string, channelID: string) {
  removeQuery.run(guildID, channelID);
}
