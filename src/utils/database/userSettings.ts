import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { getDatabase } from ".";
import { SettingsDefinition, SqlType, TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "user_settings",
  definition: {
    userID: "TEXT",
    key: "TEXT",
    value: "TEXT",
  },
} satisfies TableDefinition;

export const settingsDefinition: SettingsDefinition = {
  topgg: {
    description: "Change settings about Top.gg.",
    settings: {
      remind: {
        type: "BOOL",
        desc: "Whether or not should the bot remind you about when you can vote in Top.gg again.",
        val: false,
      },
    },
  },
};

export const settingsKeys = Object.keys(settingsDefinition) as (keyof typeof settingsDefinition)[];
const database = getDatabase(tableDefinition);
const getQuery = database.query("SELECT * FROM user_settings WHERE userID = $1 AND key = $2;");
const getByKeyQuery = database.query("SELECT * FROM user_settings WHERE key = $1;");
const deleteQuery = database.query("DELETE FROM user_settings WHERE userID = $1 AND key = $2;");
const insertQuery = database.query(
  "INSERT INTO user_settings (userID, key, value) VALUES (?1, ?2, ?3);",
);

export async function getUserSettingsTable<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(
  key: K,
  setting: S,
): Promise<
  | TypeOfDefinition<{
      name: string;
      definition: {
        userID: "TEXT";
        key: "TEXT";
        value: "TEXT";
      };
    }>[]
  | null
> {
  if (!settingsDefinition[key] || !settingsDefinition[key].settings[setting]) {
    await errorEmbed({
      client,
      title: `Setting ${key}.${setting} does not exist in the database at all.`,
      log: true,
      forward: true,
    });
    return null;
  }

  const res = getByKeyQuery.all(`${key}.${setting}`) as TypeOfDefinition<typeof tableDefinition>[];

  return res;
}

export async function getUserSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(
  userID: string,
  key: K,
  setting: S,
): Promise<SqlType<(typeof settingsDefinition)[K]["settings"][S]["type"]> | null> {
  if (!settingsDefinition[key] || !settingsDefinition[key].settings[setting]) {
    await errorEmbed({
      client,
      title: `Setting ${key}.${setting} does not exist in the database. User: ${userID}.`,
      log: true,
      forward: true,
    });
    return null;
  }

  const res = getQuery.all(JSON.stringify(userID), `${key}.${setting}`) as TypeOfDefinition<
    typeof tableDefinition
  >[];
  const set = settingsDefinition[key].settings[setting];

  if (!res.length) {
    if (!set) return null;
    return set.val;
  }

  const value = res[0].value;

  switch (set.type) {
    case "BOOL":
      return (value == "1" ? true : false) as SqlType<typeof set.type>;
    case "INTEGER":
      return parseInt(value) as SqlType<typeof set.type>;
    default:
      return value as SqlType<typeof set.type>;
  }
}

export async function setUserSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(userID: string, key: K, setting: S, value: any) {
  const doInsert = (await getUserSetting(userID, key, setting)) == null;
  if (!doInsert) deleteQuery.all(JSON.stringify(userID), `${key}.${setting}`);
  insertQuery.run(JSON.stringify(userID), `${key}.${setting}`, value);
}
