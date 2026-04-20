import { sql } from "bun";
import { Satisfies } from "utils/types";
import { values } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

type Def = Satisfies<
  TableDefinition,
  {
    name: "news";
    definition: {
      guildID: "TEXT";
      title: "TEXT";
      body: "TEXT";
      author: "TEXT";
      authorPFP: "TEXT";
      createdAt: "TIMESTAMP";
      updatedAt: "mTIMESTAMP";
      messageID: "TEXT";
      imageURL: "mTEXT";
      id: "INTEGER";
    };
  }
>;

const sendQuery = async (
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  createdAt: Date,
  updatedAt: Date | null,
  messageID: string,
  imageURL: string | null | undefined,
  id: number,
  sql_: Bun.SQL = sql, // what's this supposed to do?
) => {
  const insObject = {
    guildID,
    title,
    body,
    author,
    authorPFP,
    createdAt,
    updatedAt,
    messageID,
    imageURL,
    id,
  };
  await sql_`INSERT INTO news ${sql(insObject)};`;
};

export const listAllNews = async (guildID: string): Promise<TypeOfDefinition<Def>[]> =>
  values(await sql`SELECT * FROM news WHERE "guildID" = ${guildID} ORDER BY "id" DESC;`);

export const getLatestNews = async (guildID: string): Promise<TypeOfDefinition<Def>[]> =>
  values(await sql`SELECT * FROM news WHERE "guildID" = ${guildID} ORDER BY "id" DESC LIMIT 1;`);

const deleteQuery = async (guildID: string, id: number, sql_: Bun.SQL = sql) =>
  await sql_`DELETE FROM news WHERE "guildID" = ${guildID} AND "id" = ${id};`;

export async function postNews(
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  messageID: string,
  imageURL: string | null | undefined,
  id: number,
) {
  return await sendQuery(
    guildID,
    title,
    body,
    author,
    authorPFP,
    new Date(),
    null,
    messageID,
    imageURL,
    id,
  );
}

export async function getNews(guildID: string, id: number) {
  return values(
    await sql`SELECT * FROM news WHERE "guildID" = ${guildID} AND "id" = ${id};`,
  )[0] as TypeOfDefinition<Def> | null;
}

export async function updateNews(
  guildID: string,
  id: number,
  title?: string,
  body?: string,
  messageID?: string,
  imageURL?: string | null | undefined,
) {
  const lastElem = (await getNews(guildID, id))!;
  await sql.begin(async tx => {
    await deleteQuery(guildID, id, tx);
    await sendQuery(
      lastElem.guildID,
      title ?? lastElem.title,
      body ?? lastElem.body,
      lastElem.author,
      lastElem.authorPFP,
      lastElem.createdAt,
      new Date(),
      messageID ?? lastElem.messageID,
      imageURL ?? lastElem.imageURL,
      id,
      tx,
    );
  });
}

export async function deleteNews(guildID: string, id: number) {
  await deleteQuery(guildID, id);
}
