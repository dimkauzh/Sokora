import { Satisfies } from "utils/types";
import { db, values } from ".";
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
  values(await db`SELECT * FROM starboard WHERE "guild" = ${guild} AND "message" = ${message};`);

export async function getStarred(
  guildID: string,
  messageID: string,
): Promise<[string, string, string, number, string, Date] | null> {
  const res = values((await getQuery(guildID, messageID)) as TypeOfDefinition<Def>[]);
  if (!res.length) return null;
  return res[0] as [string, string, string, number, string, Date];
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
  await db.begin(async tx => {
    await tx`DELETE FROM starboard WHERE "guild" = ${guildID} AND "message" = ${messageID};`;
    await tx`INSERT INTO starboard ${db(insObject)};`;
  });
}
