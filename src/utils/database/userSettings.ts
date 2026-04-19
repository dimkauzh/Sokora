import { sql } from "bun";
import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { Satisfies } from "utils/types";
import { values } from ".";
import { SettingsDefinition, SqlType, TableDefinition, TypeOfDefinition } from "./types";

type Def = Satisfies<
  TableDefinition,
  {
    name: "user_settings";
    definition: {
      userID: "TEXT";
      key: "TEXT";
      value: "TEXT";
    };
  }
>;

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
// } as const satisfies SettingsDefinition;
// could be an entry point to fixing the 27 type errors related to autocomplete

export const settingsKeys = Object.keys(settingsDefinition) as (keyof typeof settingsDefinition)[];

export async function getUserSettingsTable<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(key: K, setting: S): Promise<TypeOfDefinition<Def>[] | null> {
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

  return values(
    await sql`SELECT * FROM user_settings WHERE "key" = ${`${key}.${setting}`};`,
  ) as TypeOfDefinition<Def>[];
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

  const res = values(
    await sql`SELECT * FROM user_settings WHERE "userID" = ${userID} AND "key" = ${`${key}.${setting}`};`,
  ) as TypeOfDefinition<Def>[];

  const set = settingsDefinition[key].settings[setting];
  if (!res.length) {
    if (!set) return null;
    return set.val;
  }

  const value = res[0].value;
  switch (set.type) {
    case "BOOL":
      return (value == "true") as SqlType<typeof set.type>;
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
  const keySetting = `${key}.${setting}`;
  await sql`DELETE FROM user_settings WHERE "userID" = ${userID} AND "key" = ${keySetting};`;
  await sql`INSERT INTO user_settings ("userID", "key", "value") VALUES (${userID}, ${keySetting}, ${value});`;
}
