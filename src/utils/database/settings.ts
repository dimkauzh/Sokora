import { sql } from "bun";
import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { dekominator } from "utils/kominator";
import { Satisfies } from "utils/types";
import { values } from ".";
import { FieldData, SettingsDefinition, SqlType, TableDefinition, TypeOfDefinition } from "./types";

type Def = Satisfies<
  TableDefinition,
  {
    name: "settings";
    definition: {
      guildID: "TEXT";
      key: "TEXT";
      value: "TEXT";
    };
  }
>;

// for the [TODO]s below, remove the SettingsDefinition type and
// enjoy 26 type errors! :D
export const settingsDefinition: SettingsDefinition = {
  leveling: {
    description: "Customize the behavior of the leveling system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable/disable the leveling system.",
        val: true,
        emoji: "✅",
      },
      channel: {
        type: "CHANNEL",
        desc: "Channel for logging leveling-related stuff (i.e someone leveling up).",
        emoji: "📝",
      },
      block_channels: {
        type: "CHANNEL",
        desc: "Channels where messages aren't counted.",
        iterable: true,
        emoji: "🚫",
      },
      xp_gain: {
        type: "INTEGER",
        desc: "Set the amount of XP a user gains per message.",
        val: 2,
        emoji: "📈",
      },
      cooldown: {
        type: "INTEGER",
        desc: "Set the cooldown between messages that add XP (in seconds).",
        val: 2,
        emoji: "⏱️",
      },
      difficulty: {
        type: "INTEGER",
        desc: "Set the difficulty (ex: 2 will make it 2x harder to level up).",
        val: 1,
        emoji: "🧩",
      },
      rewards: {
        type: "OBJECT",
        desc: "Set roles and channels to be granted to users who reach specific levels.",
        iterable: true,
        emoji: "🌟",
        settings: {
          level: {
            type: "INTEGER",
            desc: "The level required to get the level reward.",
          },
          reward: {
            type: "REWARD",
            desc: "The reward that the user gets after reaching the aforementioned level.",
          },
        },
      },
    },
  },
  moderation: {
    description: "Change Sokora's settings related to moderation.",
    settings: {
      events: {
        type: "LOG",
        desc: "Select what events you want to see in your log channel.",
        iterable: true,
        emoji: "📅",
      },
      channel: {
        type: "CHANNEL",
        desc: "Channel for logging moderation events.",
        emoji: "📋",
      },
      silent: {
        type: "BOOL",
        desc: "If enabled, all moderation actions will be done without pinging the affected user.",
        val: false,
        emoji: "🔇",
      },
    },
  },
  news: {
    description: "Configure news for your server.",
    settings: {
      channel: {
        type: "CHANNEL",
        desc: "Channel where news messages are sent.",
        emoji: "📰",
      },
      role: {
        type: "ROLE",
        desc: "Roles that should be pinged when a news message is sent.",
        iterable: true,
        emoji: "📢",
      },
      edit_original_message: {
        type: "BOOL",
        desc: "Whether or not the original message should be edited when a news message is updated.",
        val: true,
        emoji: "✏️",
      },
    },
  },
  starboard: {
    description: "Configure the starboard system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable/disable the starboard.",
        val: false,
        emoji: "✅",
      },
      channel: {
        type: "CHANNEL",
        desc: "Channel where starred messages appear.",
        emoji: "📌",
      },
      emoji: {
        type: "TEXT",
        desc: "Emoji used for starring messages.",
        val: "⭐",
        emoji: "⭐",
      },
      threshold: {
        type: "INTEGER",
        desc: "Reactions needed for a message to be starred.",
        val: 3,
        emoji: "🦾",
      },
    },
  },
  serverboard: {
    description: "Configure your server's appearance on the serverboard.",
    settings: {
      shown: {
        type: "BOOL",
        desc: "Whether or not the server should be shown on the serverboard.",
        val: false,
        emoji: "🌐",
      },
      server_invite: {
        type: "BOOL",
        desc: "Whether to show server invite on the serverboard.",
        val: false,
        emoji: "🔗",
      },
      invite_channel: {
        type: "CHANNEL",
        desc: "Channel for the invite. If not set, uses the first channel in the channel list.",
        emoji: "📨",
      },
    },
  },
  welcome: {
    description: "Change how Sokora welcomes your new users.",
    settings: {
      join_channel: {
        type: "CHANNEL",
        desc: "Channel where welcome messages are sent.",
        emoji: "📥",
      },
      join_text: {
        type: "TEXT",
        desc: "Text sent when a user joins. Use (variables) to add dynamic info, run /help variables for info.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
        emoji: "👋",
      },
      leave_channel: {
        type: "CHANNEL",
        desc: "Channel where leave messages are sent.",
        emoji: "📤",
      },
      leave_text: {
        type: "TEXT",
        desc: "Text sent when a user leaves. Use (variables) to add dynamic info, run /help variables for info.",
        val: "(name) has left the server! 😥",
        emoji: "🚪",
      },
      join_dm: {
        type: "BOOL",
        desc: "Whether or not the bot should send a custom DM message to the user upon joining.",
        val: false,
        emoji: "💌",
      },
      dm_text: {
        type: "TEXT",
        desc: "Text sent in the user's DM when they join the server. Use (variables) to add dynamic info, run /help variables for info.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
        emoji: "📬",
      },
      roles: {
        type: "ROLE",
        desc: "The roles that should be given to the user when they join.",
        iterable: true,
        emoji: "🎭",
      },
    },
  },
  easter: {
    description: "Enable/disable easter eggs.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: 'Whether or not the bot should reply to certain messages with "easter egg" messages.',
        val: false,
        emoji: "✅",
      },
      enabled_eggs: {
        type: "EGG",
        desc: "Specific easter eggs to enable. If none are selected, all easter eggs are enabled.",
        iterable: true,
        emoji: "🐣",
      },
      allowed_channels: {
        type: "CHANNEL",
        desc: "Channels where easter eggs are allowed.",
        iterable: true,
        emoji: "💬",
      },
    },
  },
};

export const settingsKeys = Object.keys(settingsDefinition) as (keyof typeof settingsDefinition)[];

const deleteQuery = async (guildID: string, key: string) =>
  await sql`DELETE FROM settings WHERE "guildID" = ${guildID} AND "key" = ${key};`;

// [TODO] autocomplete support for get/setSetting
// [TODO] proper type validation for get/setSetting
export async function getSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(
  guildID: string,
  key: K,
  setting: S,
): Promise<
  | SqlType<(typeof settingsDefinition)[K]["settings"][S]["type"]>
  | SqlType<(typeof settingsDefinition)[K]["settings"][S]["type"]>[]
  | null
  | undefined
> {
  if (!settingsDefinition[key] || !settingsDefinition[key].settings[setting]) {
    await errorEmbed({
      client,
      title: `Setting ${key}.${setting} does not exist in the database. Guild: ${guildID}.`,
      log: true,
      forward: true,
      fileName: "database/settings.ts",
    });
    return null;
  }

  const res = values(
    await sql`SELECT * FROM settings WHERE "guildID" = ${guildID} AND "key" = ${`${key}.${setting}`};`,
  ) as TypeOfDefinition<Def>[];

  const set = settingsDefinition[key].settings[setting];
  if (!res.length) {
    if (!set) return null;
    return set.val;
  }

  const value: string | string[] = res[0].value;
  if (value == "null" || !value) return set.val;

  function switchTypes(value: string): SqlType<typeof set.type>[] | SqlType<typeof set.type> {
    switch (set.type) {
      case "BOOL":
        return (value == "true") as SqlType<typeof set.type>;
      case "INTEGER":
        return parseInt(value) as SqlType<typeof set.type>;
      default:
        return value as SqlType<typeof set.type>;
    }
  }

  if (Array.isArray(value))
    return value.map(valuelet => switchTypes(valuelet)) as
      | SqlType<FieldData>
      | SqlType<FieldData>[];

  return switchTypes(value);
}

export async function getSettingCategory<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K,
) {
  const array = [];
  for (const setting of Object.keys(settingsDefinition[key].settings))
    array.push(await getSetting(guildID, key, setting));

  return array;
}

export async function setSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(guildID: string, key: K, setting: S, value: any) {
  const set = Array.isArray(value) ? dekominator(value) : value;
  const keySetting = `${key}.${setting}`;
  await deleteQuery(guildID, keySetting);
  await sql`INSERT INTO settings ("guildID", "key", "value") VALUES (${guildID}, ${keySetting}, ${set});`;
}

export async function resetSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(guildID: string, key: K, setting: S) {
  await deleteQuery(guildID, `${key}.${setting}`);
}

export async function resetSettingCategory<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K,
) {
  await sql`DELETE FROM settings WHERE "guildID" = ${guildID} AND "key" LIKE ${`%${key}%`};`;
}

export async function listPublicServers(): Promise<
  {
    guildID: string;
    showInvite: boolean;
    inviteChannelId: string | null;
  }[]
> {
  const publicGuildSet = new Set(
    (
      values(
        await sql`SELECT * FROM settings WHERE "key" = 'serverboard.shown' AND "value" = 'true';`,
      ) as TypeOfDefinition<Def>[]
    ).map(entry => entry.guildID),
  );

  const inviteGuildsSet = new Set(
    (
      values(
        await sql`SELECT * FROM settings WHERE "key" = 'serverboard.server_invite' AND "value" = 'true';`,
      ) as TypeOfDefinition<Def>[]
    ).map(entry => entry.guildID),
  );

  return Promise.all(
    Array.from(publicGuildSet).map(async entry => {
      const inviteChannel = await getSetting(entry, "serverboard", "invite_channel");
      return {
        guildID: entry,
        showInvite: inviteGuildsSet.has(entry),
        inviteChannelId: inviteChannel ? inviteChannel.toString() : null,
      };
    }),
  );
}

export async function deletePublicServer(guildID: string) {
  try {
    await sql`DELETE FROM settings WHERE "guildID" = ${guildID} AND "key" = 'serverboard.shown' AND "value" = 'true';`;
  } catch (error) {
    return await errorEmbed({
      client,
      error,
      log: true,
      forward: true,
      fileName: "database/settings.ts",
    });
  }
}
