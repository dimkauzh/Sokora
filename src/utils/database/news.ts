import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const definition = {
  name: "news",
  definition: {
    guildID: "TEXT",
    title: "TEXT",
    body: "TEXT",
    author: "TEXT",
    authorPFP: "TEXT",
    createdAt: "TIMESTAMP",
    updatedAt: "TIMESTAMP?",
    messageID: "TEXT",
    imageURL: "TEXT?",
    id: "TEXT",
  },
} satisfies TableDefinition;

const database = getDatabase(definition);
const sendQuery = database.query(
  "INSERT INTO news (guildID, title, body, author, authorPFP, createdAt, updatedAt, messageID, imageURL, id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10);",
);
export const listAllQuery = database.query("SELECT * FROM news WHERE guildID = $1;");
const getIdQuery = database.query("SELECT * FROM news WHERE guildID = $1 AND id = $2;");
const deleteQuery = database.query("DELETE FROM news WHERE guildID = $1 AND id = $2;");

export function addNews(
  guildID: string,
  title: string,
  body: string,
  author: string,
  authorPFP: string,
  messageID: string,
  imageURL: string,
  id: string,
) {
  sendQuery.run(guildID, title, body, author, authorPFP, Date.now(), 0, messageID, imageURL, id);
}

export function listAllNews(guildID: string) {
  return listAllQuery.all(guildID) as TypeOfDefinition<typeof definition>[];
}

export function get(guildID: string, id: string) {
  return getIdQuery.get(guildID, id) as TypeOfDefinition<typeof definition> | null;
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
