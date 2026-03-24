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

export async function addModeration(
  guildID: string | number,
  userID: string,
  type: ModType,
  moderator: string,
  reason = "",
  expiresAt?: number | null,
) {
  let id =
    await sql`SELECT CAST(id AS int) AS id FROM moderation WHERE guild = ${sql(guildID)} ORDER BY id DESC LIMIT 1;`;

  id = parseInt(id.length ? (id[0] as { id: string }).id : "0") + 1;
  sql`INSERT INTO moderation (
    guild,
    userID,
    type,
    moderator,
    reason,
    id,
    timestamp,
    expiresAt
  ) VALUES (
    ${sql(guildID)},
    ${sql(userID)},
    ${sql(type)},
    ${sql(moderator)},
    ${sql(reason)},
    ${sql(id)},
    ${sql(Date.now())},
    ${sql(expiresAt ?? null)}
  );`;
  return id;
}

export async function listGuildModeration(guildID: number | string, type?: ModType) {
  if (type)
    return (await sql`SELECT * FROM moderation WHERE guild = ${sql(guildID)} AND type = ${sql(type)};`) as TypeOfDefinition<
      typeof def
    >[];

  return (await sql`SELECT * FROM moderation WHERE guild = ${sql(guildID)};`) as TypeOfDefinition<
    typeof def
  >[];
}

export async function listUserModeration(
  guildID: number | string,
  userID: number | string,
  type?: ModType,
) {
  const guild = sql(guildID);
  const user = sql(userID);
  if (type)
    return (await sql`SELECT * FROM moderation WHERE guild = ${guild} AND userID = ${user} AND type = ${sql(type)};`) as TypeOfDefinition<
      typeof def
    >[];

  return (await sql`SELECT * FROM moderation WHERE guild = ${guild} AND userID = ${user};`) as TypeOfDefinition<
    typeof def
  >[];
}

export async function getModeration(guildID: number | string, userID: number | string, id: string) {
  const modCase =
    (await sql`SELECT * FROM moderation WHERE guild = ${sql(guildID)} AND id = ${sql(id)};`) as TypeOfDefinition<
      typeof def
    >[];

  if (modCase.length && modCase[0].userID == userID) return modCase;
  return [];
}

export async function listModeratorLog(guildID: number | string, moderator: number | string) {
  return (await sql`SELECT * FROM moderation WHERE guild = ${sql(guildID)} AND moderator = ${sql(moderator)};`) as TypeOfDefinition<
    typeof def
  >[];
}

export async function editModeration(
  guildID: number | string,
  id: string,
  reason: string,
  expiresAt?: number | null,
) {
  await sql`UPDATE moderation SET reason = ${sql(reason)}, expiresAt = ${sql(expiresAt)} WHERE guild = ${guildID} AND id = ${sql(id)};`;
}

export async function removeModeration(guildID: string | number, id: string) {
  await sql`DELETE FROM moderation WHERE guild = ${sql(guildID)} AND id = ${sql(id)};`;
}

export async function getExpiredBans(currentTime: number) {
  return (await sql`SELECT * FROM moderation WHERE type = 'BAN' AND expiresAt IS NOT NULL AND expiresAt <= ${new Date(currentTime)};`) as TypeOfDefinition<
    typeof def
  >[];
}

export async function getPendingBans(currentTime: number) {
  return (await sql`SELECT * FROM moderation WHERE type = 'BAN' AND expiresAt IS NOT NULL AND expiresAt > ${new Date(currentTime)};`) as TypeOfDefinition<
    typeof def
  >[];
}
