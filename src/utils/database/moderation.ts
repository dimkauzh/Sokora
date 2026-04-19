import { sql } from "bun";
import { values } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const def = {
  name: "moderation",
  definition: {
    guild: "TEXT",
    userID: "TEXT",
    type: "TEXT",
    moderator: "TEXT",
    reason: "TEXT",
    id: "INTEGER",
    timestamp: "TIMESTAMP",
    expiresAt: "TIMESTAMP",
  },
} satisfies TableDefinition;

export type ModerationCase = typeof def;

export type ModType = "MUTE" | "UNMUTE" | "WARN" | "KICK" | "BAN" | "UNBAN";

export async function createCase(
  guildID: string | number,
  userID: string,
  modType: ModType,
  moderator: string,
  reason = "",
  expiresAt?: Date | null,
) {
  const id: number =
    (values(
      await sql`SELECT id FROM moderation WHERE "guild" = ${guildID} ORDER BY "id" DESC LIMIT 1;`,
      true,
    )[0] ?? 0) + 1;

  const insObject = {
    guild: guildID,
    userID,
    type: modType,
    moderator,
    reason,
    id,
    timestamp: new Date(),
    expiresAt,
  };
  await sql`INSERT INTO moderation ${sql(insObject)};`;
  return id;
}

export async function listGuildCases(guildID: number | string, modType?: ModType) {
  const typeFilter = sql`AND "type" = ${modType}`;
  return values(
    await sql`
      SELECT * FROM moderation
      WHERE "guild" = ${guildID}
      ${modType ? typeFilter : sql``}
      ORDER BY "id" DESC;`,
  ) as TypeOfDefinition<typeof def>[];
}

export async function listUserCases(
  guildID: number | string,
  userID: number | string,
  modType?: ModType,
) {
  const typeFilter = sql`AND "type" = ${modType}`;
  return values(
    await sql`
      SELECT * FROM moderation
      WHERE "guild" = ${guildID}
      AND "userID" = ${userID}
      ${modType ? typeFilter : sql``}
      ORDER BY "id" DESC;`,
  ) as TypeOfDefinition<typeof def>[];
}

export async function getCase(guildID: number | string, id?: number) {
  const modCase = values(
    await sql`SELECT * FROM moderation WHERE "guild" = ${guildID} AND "id" = ${id};`,
  ) as TypeOfDefinition<typeof def>[];

  if (modCase.length) return modCase;
  return [];
}

export async function editCase(
  guildID: number | string,
  id: number,
  reason: string,
  expiresAt?: number | null,
) {
  await sql`UPDATE moderation SET reason = ${reason}, expiresAt = ${expiresAt} WHERE "guild" = ${guildID} AND "id" = ${id};`;
}

export async function removeCase(guildID: string | number, id: number) {
  await sql`DELETE FROM moderation WHERE "guild" = ${guildID} AND id = ${id};`;
}

export async function getPendingBans(currentTime: number) {
  return values(
    await sql`SELECT * FROM moderation WHERE "type" = 'BAN' AND "expiresAt" IS NOT NULL AND "expiresAt" > ${new Date(currentTime)};`,
  ) as TypeOfDefinition<typeof def>[];
}
