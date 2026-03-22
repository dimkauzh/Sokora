import { sql } from "bun";
import { TableDefinition, TypeOfDefinition } from "./types";

const def = {
  name: "moderation",
  definition: {
    guild: "TEXT",
    userID: "TEXT",
    type: "TEXT",
    moderator: "TEXT",
    reason: "TEXT",
    id: "TEXT",
    timestamp: "TIMESTAMP",
    expiresAt: "TIMESTAMP",
  },
} satisfies TableDefinition;

export type ModerationCase = typeof def;

export type ModType = "MUTE" | "UNMUTE" | "WARN" | "KICK" | "BAN" | "UNBAN";

await sql`CREATE TABLE IF NOT EXISTS moderation (
  guild TEXT,
  userID TEXT,
  type TEXT,
  moderator TEXT,
  reason TEXT,
  id TEXT,
  timestamp TIMESTAMP,
  expiresAt TIMESTAMP
);`;
const addQuery = sql`INSERT INTO moderation (guild, userID, type, moderator, reason, id, timestamp, expiresAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);`;
const listGuildQuery = sql`SELECT * FROM moderation WHERE guild = $1;`;
const listGuildTypeQuery = sql`SELECT * FROM moderation WHERE guild = $1 AND type = $2;`;
const listUserQuery = sql`SELECT * FROM moderation WHERE guild = $1 AND userID = $2;`;
const listUserTypeQuery = sql`SELECT * FROM moderation WHERE guild = $1 AND userID = $2 AND type = $3;`;
const listModQuery = sql`SELECT * FROM moderation WHERE guild = $1 AND moderator = $2;`;
const getIdQuery = sql`SELECT * FROM moderation WHERE guild = $1 AND id = $2;`;
const getLastIdQuery = sql`SELECT CAST(id AS int) AS id FROM moderation WHERE guild = ? ORDER BY id DESC LIMIT 1;`;
const editQuery = sql`UPDATE moderation SET reason = ?3, expiresAt = ?4 WHERE guild = ?1 AND id = ?2;`;
const removeQuery = sql`DELETE FROM moderation WHERE guild = $1 AND id = $2;`;
const getExpiredBansQuery = sql`SELECT * FROM moderation WHERE type = 'BAN' AND expiresAt IS NOT NULL AND expiresAt <= $1;`;
const getPendingBansQuery = sql`SELECT * FROM moderation WHERE type = 'BAN' AND expiresAt IS NOT NULL AND expiresAt > $1;`;

export function addModeration(
  guildID: string | number,
  userID: string,
  type: ModType,
  moderator: string,
  reason = "",
  expiresAt?: number | null,
) {
  let id: unknown[] | number = getLastIdQuery.all(guildID);
  id = parseInt(id.length ? (id[0] as { id: string }).id : "0") + 1;
  addQuery.run(guildID, userID, type, moderator, reason, id, Date.now(), expiresAt ?? null);
  return id;
}

export function listGuildModeration(guildID: number | string, type?: ModType) {
  if (type) return listGuildTypeQuery.all(guildID, type) as TypeOfDefinition<typeof def>[];

  return listGuildQuery.all(guildID) as TypeOfDefinition<typeof def>[];
}

export function listUserModeration(
  guildID: number | string,
  userID: number | string,
  type?: ModType,
) {
  if (type) return listUserTypeQuery.all(guildID, userID, type) as TypeOfDefinition<typeof def>[];
  return listUserQuery.all(guildID, userID) as TypeOfDefinition<typeof def>[];
}

export function getModeration(guildID: number | string, userID: number | string, id: string) {
  const modCase = getIdQuery.all(guildID, id) as TypeOfDefinition<typeof def>[];
  if (modCase.length && modCase[0].userID == userID) return modCase;
  return [];
}

export function listModeratorLog(guildID: number | string, moderator: number | string) {
  return listModQuery.all(guildID, moderator) as TypeOfDefinition<typeof def>[];
}

export function editModeration(
  guildID: number | string,
  id: string,
  reason: string,
  expiresAt?: number | null,
) {
  editQuery.run(guildID, id, reason, expiresAt ?? null);
}

export function removeModeration(guildID: string | number, id: string) {
  removeQuery.run(guildID, id);
}

export function getExpiredBans(currentTime: number) {
  return getExpiredBansQuery.all(currentTime) as TypeOfDefinition<typeof def>[];
}

export function getPendingBans(currentTime: number) {
  return getPendingBansQuery.all(currentTime) as TypeOfDefinition<typeof def>[];
}
