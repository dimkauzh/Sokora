import { sql } from "bun";
import { values } from ".";
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
    timestamp: "TIMESTAMP",
  },
} satisfies TableDefinition;

const getQuery = async (guild: string, message: string) =>
  values(await sql`SELECT * FROM starboard WHERE "guild" = ${guild} AND "message" = ${message};`);

export async function getStarred(
  guildID: string,
  messageID: string,
): Promise<[string, string, string, number, string, Date] | null> {
  const res = (await getQuery(guildID, messageID)) as TypeOfDefinition<typeof def>[];
  if (!res.length) return null;
  return [
    res[0].channel as string,
    res[0].author as string,
    res[0].star_message as string,
    res[0].stars as number,
    res[0].content as string,
    res[0].timestamp as Date,
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
  timestamp: Date,
) {
  if ((await getQuery(guildID, messageID)).length)
    await sql`DELETE FROM starboard WHERE "guild" = ${guildID} AND "message" = ${messageID};`;

  const insObject = {
    guild: guildID,
    message: messageID,
    channel: channelID,
    author: authorID,
    star_message: starMessageID,
    stars,
    content,
    timestamp,
  };
  await sql`INSERT INTO starboard ${sql(insObject)};`;
}
