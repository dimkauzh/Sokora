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
const sendQuery = sql`INSERT INTO news (guildID, title, body, author, authorPFP, createdAt, updatedAt, messageID, imageURL, id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10);`;
export const listAllQuery = sql`SELECT * FROM news WHERE guildID = $1;`;
const getIdQuery = sql`SELECT * FROM news WHERE guildID = $1 AND id = $2;`;
const deleteQuery = sql`DELETE FROM news WHERE guildID = $1 AND id = $2;`;

export function addNews(
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  messageID: string,
  imageURL: string | null,
  id: string,
) {
  sendQuery.run(guildID, title, body, author, authorPFP, Date.now(), 0, messageID, imageURL, id);
}

export function listAllNews(guildID: string) {
  return listAllQuery.all(guildID) as TypeOfDefinition<typeof def>[];
}

export function get(guildID: string, id: string) {
  return getIdQuery.get(guildID, id) as TypeOfDefinition<typeof def> | null;
}

export function updateNews(
  guildID: string,
  id: string,
  title?: string,
  body?: string,
  messageID?: string,
  imageURL?: string,
) {
  const lastElem = get(guildID, id)!;
  deleteQuery.run(guildID, id);
  sendQuery.run(
    lastElem.guildID,
    title ?? lastElem.title,
    body ?? lastElem.body,
    lastElem.author,
    lastElem.authorPFP,
    Date.now(),
    0,
    messageID ?? lastElem.messageID,
    imageURL ?? lastElem.imageURL,
    id,
  );
}

export function deleteNews(guildID: string, id: string) {
  deleteQuery.run(guildID, id);
}
