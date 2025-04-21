import { getDatabase } from ".";
import { kominator } from "../kominator";
import { FieldData, SqlType, TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "settings",
  definition: {
    guildID: "TEXT",
    key: "TEXT",
    value: "TEXT",
  },
} satisfies TableDefinition;

type SingleSettingDefinition = {
  type: FieldData;
  desc: string;
  emoji?: string;
  val?: any;
  settings?: Record<
    string,
    SingleSettingDefinition & { settings?: Record<string, SingleSettingDefinition> }
  >;
};

type FullSettingsDefinition = Record<
  string,
  {
    description: string;
    settings: Record<string, SingleSettingDefinition>;
  }
>;

// @ts-ignore
const _test: FullSettingsDefinition = {
  test: {
    description: "this is a test",
    settings: {
      testy: {
        type: "LIST",
        desc: "this is a big huge test",
        settings: {
          tester: {
            type: "ROLE",
            desc: "this is an even bigger test",
            val: true,
          },
        },
      },
    },
  },
};

export const settingsDefinition: FullSettingsDefinition = {
  ..._test,
  leveling: {
    description: "Customize the behavior of the leveling system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable/disable the leveling system.",
        emoji: "🏅",
        val: true,
      },
      channel: {
        type: "CHANNEL",
        desc: "ID of the log channel for leveling-related stuff (i.e someone leveling up).",
        emoji: "📡",
      },
      block_channels: {
        type: "CHANNEL",
        desc: "ID(s) of the channels where messages aren't counted, comma separated.",
        emoji: "🚫",
      },
      xp_gain: {
        type: "INTEGER",
        desc: "Set the amount of XP a user gains per message.",
        emoji: "💎",
        val: 2,
      },
      cooldown: {
        type: "INTEGER",
        desc: "Set the cooldown between messages that add XP (in seconds).",
        emoji: "⏳",
        val: 2,
      },
      difficulty: {
        type: "INTEGER",
        desc: "Set the difficulty (ex: 2 will make it 2x harder to level up).",
        emoji: "⚙️",
        val: 2,
      },
      rewards: {
        type: "TEXT",
        desc: "Role rewards for levels (format: roleID:level,roleID:level)",
        emoji: "🎁",
      },
      multipliers: {
        type: "TEXT",
        desc: "XP multipliers for roles/channels (format: multiplier:ID1,ID2)",
        emoji: "🔢",
      },
      xp_per_chars: {
        type: "TEXT",
        desc: "XP per character count (format: xp:chars)",
        emoji: "🧩",
        val: "1:50",
      },
    },
  },
  moderation: {
    description: "Change where Sokora sends moderation logs.",
    settings: {
      channel: {
        type: "CHANNEL",
        desc: "ID of the log channel for moderation-related stuff (i.e a message being edited).",
        emoji: "📋",
      },
      log_messages: {
        type: "BOOL",
        desc: "Whether or not edited/deleted messages should be logged.",
        emoji: "📝",
        val: true,
      },
      anti_log_delete: {
        type: "BOOL",
        desc: "Whether or not the bot should resend a deleted log message.",
        emoji: "🔒",
        val: false,
      },
      mute_role: {
        type: "ROLE",
        desc: "Role used for muting members (separate from timeout).",
        emoji: "🤐",
      },
      automod_enabled: {
        type: "BOOL",
        desc: "Enable/disable the automod system.",
        emoji: "🤖",
        val: false,
      },
      role_autokick: {
        type: "TEXT",
        desc: "Role autokick settings (format: roleID:days,roleID:days)",
        emoji: "🚷",
      },
      auto_slowdown: {
        type: "BOOL",
        desc: "Enable automatic channel slowdown during high activity.",
        emoji: "🐢",
        val: false,
      },
      regex_filters: {
        type: "TEXT",
        desc: "Custom regex patterns for automod (format: pattern:action)",
        emoji: "🔍",
      },
      autokick_delay: {
        type: "TEXT",
        desc: "Role autokick delay settings",
        emoji: "⏱️",
        val: "0",
      },
      autokick_enabled: {
        type: "BOOL",
        desc: "Delay before autokicking is triggered",
        emoji: "🚨",
        val: false,
      },
    },
  },
  news: {
    description: "Configure news for your server.",
    settings: {
      channel_id: {
        type: "CHANNEL",
        desc: "ID of the channel where news messages are sent.",
        emoji: "📢",
      },
      role_id: {
        type: "ROLE",
        desc: "ID of the roles that should be pinged when a news message is sent.",
        emoji: "🏷️",
      },
      edit_original_message: {
        type: "BOOL",
        desc: "Whether or not the original message should be edited when a news message is updated.",
        emoji: "✏️",
        val: true,
      },
      categories: {
        type: "TEXT",
        desc: "News categories and their roles (format: name:roleID)",
        emoji: "🗂️",
      },
      dm_enabled: {
        type: "BOOL",
        desc: "Allow users to receive news in DMs.",
        emoji: "💬",
        val: false,
      },
    },
  },
  starboard: {
    description: "Configure the starboard system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable/disable the starboard.",
        emoji: "⭐",
        val: false,
      },
      channel: {
        type: "CHANNEL",
        desc: "Channel where starred messages appear.",
        emoji: "📍",
      },
      emoji: {
        type: "TEXT",
        desc: "Emoji used for starring messages.",
        emoji: "🌟",
        val: "⭐",
      },
      threshold: {
        type: "INTEGER",
        desc: "Reactions needed for a message to be starred.",
        emoji: "🔢",
        val: 3,
      },
    },
  },
  serverboard: {
    description: "Configure your server's appearance on the serverboard.",
    settings: {
      shown: {
        type: "BOOL",
        desc: "Whether or not the server should be shown on the serverboard.",
        emoji: "🖥️",
        val: false,
      },
      server_invite: {
        type: "BOOL",
        desc: "Whether to show server invite on the serverboard.",
        emoji: "🔗",
        val: false,
      },
      invite_channel: {
        type: "CHANNEL",
        desc: "Channel for the invite. If unset, if a rules channel exists uses it, hides the invite otherwise.",
        emoji: "🏠",
      },
    },
  },
  welcome: {
    description: "Change how Sokora welcomes your new users.",
    settings: {
      join_text: {
        type: "TEXT",
        desc: "Text sent when a user joins. Use (variables) to add dynamic info, run /help variables for info.",
        emoji: "🤗",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
      },
      leave_text: {
        type: "TEXT",
        desc: "Text sent when a user leaves. Use (variables) to add dynamic info, run /help variables for info.",
        emoji: "😢",
        val: "(name) has left the server! 😥",
      },
      join_channel: {
        type: "CHANNEL",
        desc: "ID of the channel where welcome messages are sent.",
        emoji: "📩",
      },
      leave_channel: {
        type: "CHANNEL",
        desc: "ID of the channel where leave messages are sent.",
        emoji: "🚪",
      },
      join_dm: {
        type: "BOOL",
        desc: "Whether or not the bot should send a custom DM message to the user upon joining.",
        emoji: "📬",
        val: false,
      },
      dm_text: {
        type: "TEXT",
        desc: "Text sent in the user's DM when they join the server. Same syntax as join_text.",
        emoji: "📝",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
      },
      role_retain: {
        type: "BOOL",
        desc: "Keep user roles when they rejoin.",
        emoji: "🔄",
        val: false,
      },
      role_retain_except: {
        type: "TEXT",
        desc: "Roles to exclude from retention (comma-separated IDs)",
        emoji: "🚫",
      },
    },
  },
  easter: {
    description: "Enable/disable easter eggs.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Whether or not the bot should reply to certain messages with 'easter egg' messages.",
        emoji: "🐣",
        val: false,
      },
      allowed_channels: {
        type: "TEXT",
        desc: "Channel IDs where easter eggs are allowed (comma-separated).",
        emoji: "🗣️",
      },
    },
  },
};

export const settingsKeys = Object.keys(settingsDefinition) as (keyof typeof settingsDefinition)[];
const database = getDatabase(tableDefinition);
const getQuery = database.query("SELECT * FROM settings WHERE guildID = $1 AND key = $2;");
const listPublicQuery = database.query(
  "SELECT * FROM settings WHERE key = 'serverboard.shown' AND value = '1';",
);
const deletePublicQuery = database.query(
  "DELETE FROM settings WHERE guildID = $1 AND key = 'serverboard.shown' AND value = '1'",
);
const listPublicWithInvitesEnabledQuery = database.query(
  "SELECT * FROM settings WHERE EXISTS (SELECT 1 FROM settings WHERE key = 'serverboard.server_invite' AND value = '1') AND EXISTS (SELECT 1 FROM settings WHERE key = 'serverboard.shown' AND value = '1');",
);
const deleteQuery = database.query("DELETE FROM settings WHERE guildID = $1 AND key = $2;");
const insertQuery = database.query(
  "INSERT INTO settings (guildID, key, value) VALUES (?1, ?2, ?3);",
);

export function getSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(
  guildID: string,
  key: K,
  setting: S,
): SqlType<(typeof settingsDefinition)[K]["settings"][S]["type"]> | null {
  if (!settingsDefinition[key] || !settingsDefinition[key].settings[setting]) {
    console.error(`Setting ${key}.${setting} does not exist in the database. (invalid)`);
    return null;
  }

  let res = getQuery.all(JSON.stringify(guildID), key + "." + setting) as TypeOfDefinition<
    typeof tableDefinition
  >[];
  const set = settingsDefinition[key].settings[setting];

  if (!res.length) {
    if (!set) return null;
    if (set.type == "LIST") return null;
    return set.val;
  }

  switch (set.type) {
    case "TEXT":
      return res[0].value as SqlType<typeof set.type>;
    case "BOOL":
      return (res[0].value == "1" ? true : false) as SqlType<typeof set.type>;
    case "INTEGER":
      return parseInt(res[0].value) as SqlType<typeof set.type>;
    case "CHANNEL":
      return res[0].value;
    case "LIST":
      return kominator(res[0].value) as SqlType<typeof set.type>;
    default:
      return "WIP";
  }
}

export function setSetting<K extends keyof typeof settingsDefinition>(
  guildID: string,
  key: K,
  setting: string,
  value: string,
) {
  const doInsert = getSetting(guildID, key, setting) == null;
  if (!doInsert) deleteQuery.all(JSON.stringify(guildID), key + "." + setting);
  insertQuery.run(JSON.stringify(guildID), `${key}.${setting}`, value);
}

export function listPublicServers(): {
  guildID: string;
  showInvite: boolean;
  inviteChannelId: string | null;
}[] {
  const publicGuildSet = new Set(
    (listPublicQuery.all() as TypeOfDefinition<typeof tableDefinition>[]).map(entry =>
      JSON.parse(entry.guildID),
    ),
  );

  const inviteGuildsSet = new Set(
    (listPublicWithInvitesEnabledQuery.all() as TypeOfDefinition<typeof tableDefinition>[]).map(
      entry => JSON.parse(entry.guildID),
    ),
  );

  return Array.from(publicGuildSet).map(entry => {
    const inviteChannel = getSetting(entry, "serverboard", "invite_channel");

    return {
      guildID: entry,
      showInvite: inviteGuildsSet.has(entry),
      inviteChannelId: inviteChannel ? inviteChannel.toString() : null,
    };
  });
}

export function deletePublicServer(guildId: string) {
  try {
    deletePublicQuery.all(JSON.stringify(guildId));
  } catch (e) {
    console.error(e);
  }
}
