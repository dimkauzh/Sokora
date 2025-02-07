import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "economy",
  definition: {
    guild: "TEXT",
    user: "TEXT",
    primary_currency: "INTEGER",
    secondary_currency: "INTEGER",
    last_daily: "TEXT",
    inventory: "TEXT",
  },
} satisfies TableDefinition;

const database = getDatabase(tableDefinition);

const getQuery = database.query("SELECT * FROM economy WHERE guild = $1 AND user = $2;");
const deleteQuery = database.query("DELETE FROM economy WHERE guild = $1 AND user = $2;");
const insertQuery = database.query(
  "INSERT INTO economy (guild, user, primary_currency, secondary_currency, last_daily, inventory) VALUES (?1, ?2, ?3, ?4, ?5, ?6);",
);
const getLeaderboardQuery = database.query(
  "SELECT * FROM economy WHERE guild = $1 ORDER BY primary_currency DESC LIMIT ?2;",
);

export function getEconomy(guildID: string, userID: string): [number, number, string, string[]] {
  const res = getQuery.all(guildID, userID) as TypeOfDefinition<typeof tableDefinition>[];
  if (!res.length) return [0, 0, "", []];
  return [
    res[0].primary_currency as number,
    res[0].secondary_currency as number,
    res[0].last_daily as string,
    JSON.parse(res[0].inventory as string),
  ];
}

export function setEconomy(
  guildID: string,
  userID: string,
  primary: number,
  secondary: number,
  lastDaily: string,
  inventory: string[],
) {
  if (getQuery.all(guildID, userID).length) deleteQuery.run(guildID, userID);
  insertQuery.run(guildID, userID, primary, secondary, lastDaily, JSON.stringify(inventory));
}

export function getGuildEconomyLeaderboard(
  guildID: string,
  limit: number = 10,
): TypeOfDefinition<typeof tableDefinition>[] {
  return getLeaderboardQuery.all(guildID, limit) as TypeOfDefinition<typeof tableDefinition>[];
}
