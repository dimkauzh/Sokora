import { getDatabase } from ".";
import { TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "automod_rules",
  definition: {
    guild: "TEXT",
    pattern: "TEXT",
    action: "TEXT",
    action_duration: "TEXT",
    whitelist_channels: "TEXT",
    whitelist_roles: "TEXT",
  },
} satisfies TableDefinition;

const database = getDatabase(tableDefinition);

const getQuery = database.query("SELECT * FROM automod_rules WHERE guild = $1;");
const insertQuery = database.query(
  "INSERT INTO automod_rules (guild, pattern, action, action_duration, whitelist_channels, whitelist_roles) VALUES (?1, ?2, ?3, ?4, ?5, ?6);",
);
const deleteQuery = database.query("DELETE FROM automod_rules WHERE guild = $1 AND pattern = $2;");

export function getAutomodRules(guildID: string) {
  return getQuery.all(guildID) as TypeOfDefinition<typeof tableDefinition>[];
}

export function addAutomodRule(
  guildID: string,
  pattern: string,
  action: string,
  actionDuration: string,
  whitelistChannels: string[],
  whitelistRoles: string[],
) {
  insertQuery.run(
    guildID,
    pattern,
    action,
    actionDuration,
    JSON.stringify(whitelistChannels),
    JSON.stringify(whitelistRoles),
  );
}

export function removeAutomodRule(guildID: string, pattern: string) {
  deleteQuery.run(guildID, pattern);
}
