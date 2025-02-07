import { Guild, GuildMember } from "discord.js";
import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const autokickTableDefinition = {
  name: "autokick",
  definition: {
    guild: "TEXT",
    user: "TEXT",
    last_message: "TEXT",
    delay: "INTEGER",
  },
} satisfies TableDefinition;

const activityChecksTableDefinition = {
  name: "activitychecks",
  definition: {
    guild: "TEXT",
    user: "TEXT",
    delay: "INTEGER",
  },
} satisfies TableDefinition;

const autokickDb = getDatabase(autokickTableDefinition);
const activityChecksDb = getDatabase(activityChecksTableDefinition);

const getAutokickQuery = autokickDb.query("SELECT * FROM autokick WHERE guild = ?1 AND user = ?2;");

const insertAutokickQuery = autokickDb.query(
  "INSERT INTO autokick (guild, user, last_message, delay) VALUES (?1, ?2, ?3, ?4);",
);

const deleteAutokickQuery = autokickDb.query(
  "DELETE FROM autokick WHERE guild = ?1 AND user = ?2;",
);

const updateActivityQuery = autokickDb.query(
  "UPDATE autokick SET last_message = ?3 WHERE guild = ?1 AND user = ?2;",
);

const getActivityCheckQuery = activityChecksDb.query(
  "SELECT * FROM activitychecks WHERE guild = $1 AND user = $2;",
);

const insertActivityCheckQuery = activityChecksDb.query(
  "INSERT INTO activitychecks (guild, user, delay) VALUES (?1, ?2, ?3);",
);

const deleteActivityCheckQuery = activityChecksDb.query(
  "DELETE FROM activitychecks WHERE guild = $1 AND user = $2;",
);

export function getAutokickData(
  guildId: string,
  userId: string,
): TypeOfDefinition<typeof autokickTableDefinition> | null {
  const results = getAutokickQuery.all(guildId, userId) as TypeOfDefinition<
    typeof autokickTableDefinition
  >[];
  return results[0] || null;
}

export function setAutokickData(guildId: string, userId: string, delay: number): void {
  const now = new Date().toISOString();
  if (getAutokickQuery.all(guildId, userId).length) deleteAutokickQuery.run(guildId, userId);
  insertAutokickQuery.run(guildId, userId, now, delay);
}

export function removeAutokickData(guildId: string, userId: string): void {
  deleteAutokickQuery.run(guildId, userId);
}

export function updateActivity(guildId: string, userId: string): void {
  const now = new Date().toISOString();
  updateActivityQuery.run(guildId, userId, now);
}

export function getAllAutokicks(
  guildId: string,
): TypeOfDefinition<typeof autokickTableDefinition>[] {
  const query = autokickDb.query("SELECT * FROM autokick WHERE guild = ?1;");
  return query.all(guildId) as TypeOfDefinition<typeof autokickTableDefinition>[];
}

export function setAutokick(guildId: string, userId: string, delay: number): void {
  const res = getActivityCheckQuery.all(guildId, userId) as TypeOfDefinition<
    typeof activityChecksTableDefinition
  >[];
  if (res.length) return;
  insertActivityCheckQuery.run(guildId, userId, delay);
}

export function getAutokick(
  guildId: string,
  userId: string,
): TypeOfDefinition<typeof activityChecksTableDefinition> | null {
  const res = getActivityCheckQuery.all(guildId, userId) as TypeOfDefinition<
    typeof activityChecksTableDefinition
  >[];
  return res[0] || null;
}

export function removeAutokick(guildId: string, userId: string): void {
  deleteActivityCheckQuery.run(guildId, userId);
}

export async function getAutokickSettings(guild: Guild) {
  const autokicks = getAllAutokicks(guild.id);
  return autokicks.length > 0
    ? {
        guildId: guild.id,
        enabled: true,
        threshold: autokicks[0].delay,
      }
    : null;
}

export async function trackActivityAdd(member: GuildMember) {
  updateActivity(member.guild.id, member.id);
}
