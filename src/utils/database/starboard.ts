import { sql } from "bun";
import { Satisfies } from "utils/types";
import { values } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

type Def = Satisfies<
  TableDefinition,
  {
    name: "starboard";
    definition: {
      guild: "TEXT";
      message: "TEXT";
      channel: "TEXT";
      author: "TEXT";
      star_message: "TEXT";
      stars: "INTEGER";
      content: "TEXT";
      timestamp: "TIMESTAMP";
    };
  }
>;

const getQuery = async (guild: string, message: string) =>
  values(await sql`SELECT * FROM starboard WHERE "guild" = ${guild} AND "message" = ${message};`);

export async function getStarred(
  guildID: string,
  messageID: string,
): Promise<[string, string, string, number, string, Date] | null> {
  const res = (await getQuery(guildID, messageID)) as TypeOfDefinition<Def>[];
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
  await sql.begin(async tx => {
    await tx`DELETE FROM starboard WHERE "guild" = ${guildID} AND "message" = ${messageID};`;
    await tx`INSERT INTO starboard ${sql(insObject)};`;
  });
}
