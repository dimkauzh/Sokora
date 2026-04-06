import { sql } from "bun";
import { values } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const def = {
  name: "news",
  definition: {
    guildID: "TEXT",
    title: "TEXT",
    body: "TEXT",
    author: "TEXT",
    authorPFP: "TEXT",
    createdAt: "TIMESTAMP",
    updatedAt: "mTIMESTAMP",
    messageID: "TEXT",
    imageURL: "mTEXT",
    id: "TEXT",
  },
} satisfies TableDefinition;

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
  id: string,
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
  await sql`INSERT INTO news ${sql(insObject)};`;
};

export const listAllNews = async (guildID: string): Promise<TypeOfDefinition<typeof def>[]> =>
  values(await sql`SELECT * FROM news WHERE "guildID" = ${guildID};`);

const deleteQuery = async (guildID: string, id: string) =>
  await sql`DELETE FROM news WHERE "guildID" = ${guildID} AND "id" = ${id};`;

export async function addNews(
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  messageID: string,
  imageURL: string | null | undefined,
  id: string,
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

export async function getNews(guildID: string, id: string) {
  return values(
    await sql`SELECT * FROM news WHERE "guildID" = ${guildID} AND "id" = ${id};`,
  )[0] as TypeOfDefinition<typeof def> | null;
}

export async function updateNews(
  guildID: string,
  id: string,
  title?: string,
  body?: string,
  messageID?: string,
  imageURL?: string | null | undefined,
) {
  const lastElem = (await getNews(guildID, id))!;
  await deleteQuery(guildID, id);
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
  );
}

export async function deleteNews(guildID: string, id: string) {
  await deleteQuery(guildID, id);
}
