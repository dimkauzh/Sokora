import { sql } from "bun";
import { TableDefinition, TypeOfDefinition } from "./types";

const def = {
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

await sql`CREATE TABLE IF NOT EXISTS starboard (
  guild TEXT,
  message TEXT,
  channel TEXT,
  author TEXT,
  star_message TEXT,
  stars INTEGER,
  content TEXT,
  timestamp TEXT
);`;
const getQuery = (guild: string, message: string) =>
  sql`SELECT * FROM starboard WHERE guild = ${guild} AND message = ${message};`;

export async function getStarred(
  guildID: string,
  messageID: string,
): Promise<[string, string, string, number, string, string] | null> {
  const res = (await getQuery(guildID, messageID)) as TypeOfDefinition<typeof def>[];
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

export async function setStarred(
  guildID: string,
  messageID: string,
  channelID: string,
  authorID: string,
  starMessageID: string,
  stars: number,
  content: string,
  timestamp: string,
) {
  if ((await getQuery(guildID, messageID)).length)
    await sql`DELETE FROM starboard WHERE guild = ${guildID} AND message = ${messageID};`;

  await sql`INSERT INTO starboard (
    guild,
    message,
    channel,
    author,
    star_message,
    stars,
    content,
    timestamp
  ) VALUES (
    ${guildID},
    ${messageID},
    ${channelID},
    ${authorID},
    ${starMessageID},
    ${stars},
    ${content},
    ${timestamp}
  );`;
}

export async function getGuildStarboard(
  guildID: string,
  limit: number = 10,
): Promise<TypeOfDefinition<typeof def>[]> {
  return (await sql`SELECT * FROM starboard WHERE guild = ${guildID} ORDER BY stars DESC LIMIT ${limit};`) as TypeOfDefinition<
    typeof def
  >[];
}
