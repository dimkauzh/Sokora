import { sql } from "bun";
import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { SettingsDefinition, SqlType, TableDefinition, TypeOfDefinition } from "./types";

const def = {
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
        desc: "Whether or not should the bot remind you when you can vote in Top.gg. **This setting will DM you.**",
        val: false,
        emoji: "⏰",
      },
    },
  },
};

export const settingsKeys = Object.keys(settingsDefinition) as (keyof typeof settingsDefinition)[];

export async function getUserSettingsTable<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(key: K, setting: S): Promise<TypeOfDefinition<typeof def>[] | null> {
  if (!settingsDefinition[key] || !settingsDefinition[key].settings[setting]) {
    await errorEmbed({
      client,
      title: `Setting ${key}.${setting} does not exist in the database at all.`,
      log: true,
      forward: true,
      fileName: "database/userSettings.ts",
    });
    return null;
  }

  return (await sql`SELECT * FROM user_settings WHERE "key" = ${`${key}.${setting}`};`) as TypeOfDefinition<
    typeof def
  >[];
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
      fileName: "database/userSettings.ts",
    });
    return null;
  }

  const res =
    (await sql`SELECT * FROM user_settings WHERE "userID" = ${userID} AND "key" = ${`${key}.${setting}`};`) as TypeOfDefinition<
      typeof def
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
  const id = JSON.stringify(userID);
  const keySetting = `${key}.${setting}`;

  if (!doInsert) await sql`DELETE FROM user_settings WHERE userID = ${id} AND key = ${keySetting};`;
  await sql`INSERT INTO user_settings ("userID", "key", "value") VALUES (${id}, ${keySetting}, ${value});`;
}
