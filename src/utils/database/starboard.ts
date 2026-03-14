import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "starboard",
  definition: {
    guild: "TEXT",
    message: "TEXT",
    channel: "TEXT",
    author: "TEXT",
    star_message: "TEXT",
    stars: "INTEGER",
    content: "TEXT",
    timestamp: "TEXT",
  },
} satisfies TableDefinition;

const database = getDatabase(tableDefinition);

const getQuery = database.query("SELECT * FROM starboard WHERE guild = $1 AND message = $2;");
const deleteQuery = database.query("DELETE FROM starboard WHERE guild = $1 AND message = $2;");
const insertQuery = database.query(
  "INSERT INTO starboard (guild, message, channel, author, star_message, stars, content, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);",
);
const getTopQuery = database.query(
  "SELECT * FROM starboard WHERE guild = $1 ORDER BY stars DESC LIMIT ?2;",
);

export function getStarred(
  guildID: string,
  messageID: string,
): [string, string, string, number, string, string] | null {
  const res = getQuery.all(guildID, messageID) as TypeOfDefinition<typeof tableDefinition>[];
  if (!res.length) return null;
  return [
    res[0].channel as string,
    res[0].author as string,
    res[0].star_message as string,
    res[0].stars as number,
    res[0].content as string,
    res[0].timestamp as string,
  ];
}

export function setStarred(
  guildID: string,
  messageID: string,
  channelID: string,
  authorID: string,
  starMessageID: string,
  stars: number,
  content: string,
  timestamp: string,
) {
  if (getQuery.all(guildID, messageID).length) deleteQuery.run(guildID, messageID);
  insertQuery.run(
    guildID,
    messageID,
    channelID,
    authorID,
    starMessageID,
    stars,
    content,
    timestamp,
  );
}

export function getGuildStarboard(
  guildID: string,
  limit: number = 10,
): TypeOfDefinition<typeof tableDefinition>[] {
  return getTopQuery.all(guildID, limit) as TypeOfDefinition<typeof tableDefinition>[];
}
