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

await sql`CREATE TABLE IF NOT EXISTS news (
  guildID TEXT,
  title TEXT,
  body TEXT,
  author TEXT,
  authorPFP TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  messageID TEXT,
  imageURL TEXT,
  id TEXT
);`;
const sendQuery = async (
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  createdAt: number,
  updatedAt: number,
  messageID: string,
  imageURL: string | null,
  id: string,
) => {
  // [TODO] fix issue
  // column "guildID" of relation "news" does not exist??
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
  await sql`SELECT * FROM news WHERE guildID = ${guildID};`;

const deleteQuery = async (guildID: string, id: string) =>
  await sql`DELETE FROM news WHERE guildID = ${guildID} AND id = ${id};`;

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
  await sendQuery(guildID, title, body, author, authorPFP, Date.now(), 0, messageID, imageURL, id);
}

export async function listAllNews(guildID: string) {
  return (await listAllQuery(guildID)) as TypeOfDefinition<typeof def>[];
}

export async function getNews(guildID: string, id: string) {
  return (await sql`SELECT * FROM news WHERE guildID = ${guildID} AND id = ${id};`) as TypeOfDefinition<
    typeof def
  > | null;
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
    Date.now(),
    messageID ?? lastElem.messageID,
    imageURL ?? lastElem.imageURL,
    id,
  );
}

export async function deleteNews(guildID: string, id: string) {
  await deleteQuery(guildID, id);
}
