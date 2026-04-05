import { sql } from "bun";
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
  updatedAt: Date | number,
  messageID: string,
  imageURL: string | null,
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

export const listAllQuery = async (guildID: string) =>
  await sql`SELECT * FROM news WHERE "guildID" = ${guildID};`;

const deleteQuery = async (guildID: string, id: string) =>
  await sql`DELETE FROM news WHERE "guildID" = ${guildID} AND "id" = ${id};`;

export async function addNews(
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  messageID: string,
  imageURL: string | null,
  id: string,
) {
  // side note new Date() shows up as 1970 in a discord embed
  // and outputs a random date in 2020 to ur database.
  // I love this
  return await sendQuery(
    guildID,
    title,
    body,
    author,
    authorPFP,
    new Date(),
    0,
    messageID,
    imageURL,
    id,
  );
}

export async function listAllNews(guildID: string) {
  return (await listAllQuery(guildID)) as TypeOfDefinition<typeof def>[];
}

export async function getNews(guildID: string, id: string) {
  return (
    await sql`SELECT * FROM news WHERE "guildID" = ${guildID} AND "id" = ${id};`
  )[0] as TypeOfDefinition<typeof def> | null;
}

export async function updateNews(
  guildID: string,
  id: string,
  title?: string,
  body?: string,
  messageID?: string,
  imageURL?: string,
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
