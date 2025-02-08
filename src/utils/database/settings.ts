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

export const settingsDefinition: Record<
  string,
  {
    description: string;
    settings: Record<string, { type: FieldData; desc: string; val?: any; emoji: string }>;
  }
> = {
  leveling: {
    description: "Customize the behavior of the leveling system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable/disable the leveling system.",
        val: true,
        emoji: "🍍",
      },
      channel: {
        type: "CHANNEL",
        desc: "ID of the log channel for leveling-related stuff (i.e someone leveling up).",
        emoji: "🍍",
      },
      block_channels: {
        type: "CHANNEL",
        desc: "ID(s) of the channels where messages aren't counted, comma separated.",
        emoji: "🍍",
      },
      xp_gain: {
        type: "INTEGER",
        desc: "Set the amount of XP a user gains per message.",
        val: 2,
        emoji: "🍍",
      },
      cooldown: {
        type: "INTEGER",
        desc: "Set the cooldown between messages that add XP (in seconds).",
        val: 2,
        emoji: "🍍",
      },
      difficulty: {
        type: "INTEGER",
        desc: "Set the difficulty (ex: 2 will make it 2x harder to level up).",
        val: 1,
        emoji: "🍍",
      },
      rewards: {
        type: "TEXT",
        desc: "Role rewards for levels (format: roleID:level,roleID:level)",
        emoji: "🍍",
      },
      multipliers: {
        type: "TEXT",
        desc: "XP multipliers for roles/channels (format: multiplier:ID1,ID2)",
        emoji: "🍍",
      },
      xp_per_chars: {
        type: "TEXT",
        desc: "XP per character count (format: xp:chars)",
        val: "1:50",
        emoji: "🍍",
      },
    },
  },
  moderation: {
    description: "Change where Sokora sends moderation logs.",
    settings: {
      channel: {
        type: "CHANNEL",
        desc: "ID of the log channel for moderation-related stuff (i.e a message being edited).",
        emoji: "🍍",
      },
      log_messages: {
        type: "BOOL",
        desc: "Whether or not edited/deleted messages should be logged.",
        val: true,
        emoji: "🍍",
      },
      anti_log_delete: {
        type: "BOOL",
        desc: "Whether or not the bot should resend a deleted log message.",
        val: false,
        emoji: "🍍",
      },
      mute_role: {
        type: "ROLE",
        desc: "Role used for muting members (separate from timeout).",
        emoji: "🍍",
      },
      automod_enabled: {
        type: "BOOL",
        desc: "Enable/disable the automod system.",
        val: false,
        emoji: "🍍",
      },
      role_autokick: {
        type: "TEXT",
        desc: "Role autokick settings (format: roleID:days,roleID:days)",
        emoji: "🍍",
      },
      auto_slowdown: {
        type: "BOOL",
        desc: "Enable automatic channel slowdown during high activity.",
        val: false,
        emoji: "🍍",
      },
      regex_filters: {
        type: "TEXT",
        desc: "Custom regex patterns for automod (format: pattern:action)",
        emoji: "🍍",
      },
      autokick_delay: {
        type: "TEXT",
        desc: "Role autokick delay settings",
        val: "0", //disabled yes
        emoji: "🍍",
      },
      autokick_enabled: {
        type: "BOOL",
        desc: "Delay before autokicking is triggered",
        val: false,
        emoji: "🍍",
      },
    },
  },
  news: {
    description: "Configure news for your server.",
    settings: {
      channel_id: {
        type: "CHANNEL",
        desc: "ID of the channel where news messages are sent.",
        emoji: "🍍",
      },
      role_id: {
        type: "ROLE",
        desc: "ID of the roles that should be pinged when a news message is sent.",
        emoji: "🍍",
      },
      edit_original_message: {
        type: "BOOL",
        desc: "Whether or not the original message should be edited when a news message is updated.",
        val: true,
        emoji: "🍍",
      },
      categories: {
        type: "TEXT",
        desc: "News categories and their roles (format: name:roleID)",
        val: "",
        emoji: "🍍",
      },
      dm_enabled: {
        type: "BOOL",
        desc: "Allow users to receive news in DMs.",
        val: false,
        emoji: "🍍",
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
        emoji: "🍍",
      },
      channel: {
        type: "CHANNEL",
        desc: "Channel where starred messages appear.",
        emoji: "🍍",
      },
      emoji: {
        type: "TEXT",
        desc: "Emoji used for starring messages.",
        val: "⭐",
        emoji: "🍍",
      },
      threshold: {
        type: "INTEGER",
        desc: "Reactions needed for a message to be starred.",
        val: 3,
        emoji: "🍍",
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
        emoji: "🍍",
      },
      server_invite: {
        type: "BOOL",
        desc: "Whether to show server invite on the serverboard.",
        val: false,
        emoji: "🍍",
      },
      invite_channel: {
        type: "CHANNEL",
        desc: "Channel for the invite. If unset, if a rules channel exists uses it, hides the invite otherwise.",
        emoji: "🍍",
      },
    },
  },
  welcome: {
    description: "Change how Sokora welcomes your new users.",
    settings: {
      join_text: {
        type: "TEXT",
        desc: "Text sent when a user joins. (name) - username, (count) - member count, (servername) - server name.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
        emoji: "🍍",
      },
      leave_text: {
        type: "TEXT",
        desc: "Text sent when a user leaves. (name) - username, (count) - member count, (servername) - server name.",
        val: "(name) has left the server! 😥",
        emoji: "🍍",
      },
      channel: {
        type: "CHANNEL",
        desc: "ID of the channel where welcome messages are sent.",
        emoji: "🍍",
      },
      join_dm: {
        type: "BOOL",
        desc: "Whether or not the bot should send a custom DM message to the user upon joining.",
        val: false,
        emoji: "🍍",
      },
      dm_text: {
        type: "TEXT",
        desc: "Text sent in the user's DM when they join the server. Same syntax as join_text.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
        emoji: "🍍",
      },
      role_retain: {
        type: "BOOL",
        desc: "Keep user roles when they rejoin.",
        val: false,
        emoji: "🍍",
      },
      role_retain_except: {
        type: "TEXT",
        desc: "Roles to exclude from retention (comma-separated IDs)",
        emoji: "🍍",
      },
    },
  },
  easter: {
    description: "Enable/disable easter eggs.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Whether or not the bot should reply to certain messages with 'easter egg' messages.",
        val: false,
        emoji: "🍍",
      },
      allowed_channels: {
        type: "TEXT",
        desc: "Channel IDs where easter eggs are allowed (comma-separated).",
        emoji: "🍍",
      },
    },
  },
  commands: {
    description: "Configure command availability.",
    settings: {
      disabled: {
        type: "TEXT",
        desc: "Disabled commands (comma-separated names).",
        emoji: "🍍",
      },
    },
  },
  currency: {
    description: "Configure the multi-currency system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable the currency system.",
        val: true,
        emoji: "🍍",
      },
      primary_name: {
        type: "TEXT",
        desc: "Name of the primary currency.",
        val: "coins",
        emoji: "🍍",
      },
      secondary_name: {
        type: "TEXT",
        desc: "Name of the secondary currency.",
        val: "gems",
        emoji: "🍍",
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
      return (res[0].value === "1" ? true : false) as SqlType<typeof set.type>;
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
  // you know that time-complexity thingy? idk much but uh an array has O(n) and a JS Set() has O(1) which should mean using a Set is more performant
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
