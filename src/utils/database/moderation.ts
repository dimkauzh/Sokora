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

export async function addModeration(
  guildID: string | number,
  userID: string,
  modType: ModType,
  moderator: string,
  reason = "",
  expiresAt?: number | null,
) {
  let id =
    await sql`SELECT CAST(id AS int) AS id FROM moderation WHERE "guild" = ${guildID} ORDER BY "id" DESC LIMIT 1;`;

  id = parseInt(id.length ? (id[0] as { id: string }).id : "0") + 1;
  const insObject = {
    guild: guildID,
    userID,
    type: modType,
    moderator,
    reason,
    id,
    timestamp: new Date(),
    expiresAt: expiresAt ?? null,
  };
  sql`INSERT INTO moderation ${sql(insObject)};`;
  return id;
}

export async function listGuildModeration(guildID: number | string, modType?: ModType) {
  if (modType)
    return (await sql`SELECT * FROM moderation WHERE "guild" = ${guildID} AND "type" = ${modType};`) as TypeOfDefinition<
      typeof def
    >[];

  return (await sql`SELECT * FROM moderation WHERE "guild" = ${guildID};`) as TypeOfDefinition<
    typeof def
  >[];
}

export async function listUserModeration(
  guildID: number | string,
  userID: number | string,
  modType?: ModType,
) {
  if (modType)
    return (await sql`SELECT * FROM moderation WHERE "guild" = ${guildID} AND "userID" = ${userID} AND "type" = ${modType};`) as TypeOfDefinition<
      typeof def
    >[];

  return (await sql`SELECT * FROM moderation WHERE "guild" = ${guildID} AND "userID" = ${userID};`) as TypeOfDefinition<
    typeof def
  >[];
}

export async function getModeration(guildID: number | string, userID: number | string, id: string) {
  const modCase =
    (await sql`SELECT * FROM moderation WHERE "guild" = ${guildID} AND "id" = ${id};`) as TypeOfDefinition<
      typeof def
    >[];

  if (modCase.length && modCase[0].userID == userID) return modCase;
  return [];
}

export async function editModeration(
  guildID: number | string,
  id: string,
  reason: string,
  expiresAt?: number | null,
) {
  await sql`UPDATE moderation SET reason = ${reason}, expiresAt = ${expiresAt} WHERE "guild" = ${guildID} AND "id" = ${id};`;
}

export async function removeModeration(guildID: string | number, id: string) {
  await sql`DELETE FROM moderation WHERE "guild" = ${guildID} AND id = ${id};`;
}

export async function getPendingBans(currentTime: number) {
  return (await sql`SELECT * FROM moderation WHERE "type" = 'BAN' AND "expiresAt" IS NOT NULL AND "expiresAt" > ${new Date(currentTime)};`) as TypeOfDefinition<
    typeof def
  >[];
}
