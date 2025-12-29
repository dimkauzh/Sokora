import { getDatabase } from ".";
import { getSetting } from "./settings";
import { TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "leveling",
  definition: {
    guild: "TEXT",
    user: "TEXT",
    level: "INTEGER",
    xp: "INTEGER",
  },
} satisfies TableDefinition;

const database = getDatabase(tableDefinition);

const getQuery = database.query("SELECT * FROM leveling WHERE guild = $1 AND user = $2;");
const deleteQuery = database.query("DELETE FROM leveling WHERE guild = $1 AND user = $2;");
const insertQuery = database.query(
  "INSERT INTO leveling (guild, user, level, xp) VALUES (?1, ?2, ?3, ?4);",
);

const getGuildQuery = database.query("SELECT * FROM leveling WHERE guild = $1;");

/** `[level, xp]` */
export function getLevel(guildID: string, userID: string): [number, number] {
  const res = getQuery.all(guildID, userID) as TypeOfDefinition<typeof tableDefinition>[];
  if (!res.length) return [0, 0];
  return [res[0].level, res[0].xp];
}

export function setLevel(guildID: string | number, userID: string, level: number, xp: number) {
  if (getQuery.all(guildID, userID).length) deleteQuery.run(guildID, userID);
  insertQuery.run(guildID, userID, level, xp);
}

export function getGuildLeaderboard(guildID: string): TypeOfDefinition<typeof tableDefinition>[] {
  return getGuildQuery.all(guildID) as TypeOfDefinition<typeof tableDefinition>[];
}

export async function getLevelXp(
  guildID: string,
  userID: string,
  next: boolean,
  overrideLevel?: number,
): Promise<number> {
  const difficulty = (await getSetting(guildID, "leveling", "difficulty")) as number;
  const [lvl] = overrideLevel ? [overrideLevel] : getLevel(guildID, userID);
  const n = next ? 1 : 0;
  if (typeof difficulty !== "number") throw `Difficulty value is not a number.`;
  return difficulty * ((100 * (lvl + n)) ^ (2 - 80 * lvl ** 2));
}
