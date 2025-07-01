import { errorEmbed } from "embeds/errorEmbed";
import { client } from "src/bot";
import { dekominator } from "utils/kominator";
import { getDatabase } from ".";
import { FieldData, SettingsDefinition, SqlType, TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "settings",
  definition: {
    guildID: "TEXT",
    key: "TEXT",
    value: "TEXT",
  },
} satisfies TableDefinition;

export const settingsDefinition: SettingsDefinition = {
  leveling: {
    description: "Customize the behavior of the leveling system.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Enable/disable the leveling system.",
        val: true,
      },
      channel: {
        type: "CHANNEL",
        desc: "ID of the log channel for leveling-related stuff (i.e someone leveling up).",
      },
      block_channels: {
        type: "CHANNEL",
        desc: "IDs of the channels where messages aren't counted.",
        iterable: true,
      },
      xp_gain: {
        type: "INTEGER",
        desc: "Set the amount of XP a user gains per message.",
        val: 2,
      },
      cooldown: {
        type: "INTEGER",
        desc: "Set the cooldown between messages that add XP (in seconds).",
        val: 2,
      },
      difficulty: {
        type: "INTEGER",
        desc: "Set the difficulty (ex: 2 will make it 2x harder to level up).",
        val: 2,
      },
      xp_per_chars: {
        type: "TEXT",
        desc: "XP per character count (format: xp:chars).",
        val: "1:50",
      },
    },
  },
  moderation: {
    description: "Change Sokora's settings related to moderation.",
    settings: {
      channel: {
        type: "CHANNEL",
        desc: "ID of the log channel for moderation-related stuff (i.e a message being edited).",
      },
      log_messages: {
        type: "BOOL",
        desc: "Whether or not edited/deleted messages should be logged.",
        val: true,
      },
      auto_slowdown: {
        type: "BOOL",
        desc: "Enable automatic channel slowdown during high activity.",
        val: false,
      },
      silent: {
        type: "BOOL",
        desc: "If enabled, all moderation actions will be done without pinging the affected user.",
        val: false,
      },
    },
  },
  logging: {
    description: "Manage the logging settings.",
    settings: {
      enabled: {
        type: "BOOL",
        desc: "Whether or not should the bot log different actions.",
        val: false,
      },
      events: {
        type: "LOG",
        desc: "Select what logs you want to see in your log channel.",
        iterable: true,
      },
      channel: {
        type: "CHANNEL",
        desc: "The channel where the logs should be sent. Forum channels supported.",
      },
    },
  },
  news: {
    description: "Configure news for your server.",
    settings: {
      channel_id: {
        type: "CHANNEL",
        desc: "ID of the channel where news messages are sent.",
      },
      role_id: {
        type: "ROLE",
        desc: "IDs of the roles that should be pinged when a news message is sent.",
        iterable: true,
      },
      edit_original_message: {
        type: "BOOL",
        desc: "Whether or not the original message should be edited when a news message is updated.",
        val: true,
      },
      dm_enabled: {
        type: "BOOL",
        desc: "Allow users to receive news in DMs.",
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
        val: false,
      },
      channel: {
        type: "CHANNEL",
        desc: "Channel where starred messages appear.",
      },
      emoji: {
        type: "TEXT",
        desc: "Emoji used for starring messages.",
        val: "⭐",
      },
      threshold: {
        type: "INTEGER",
        desc: "Reactions needed for a message to be starred.",
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
        val: false,
      },
      server_invite: {
        type: "BOOL",
        desc: "Whether to show server invite on the serverboard.",
        val: false,
      },
      invite_channel: {
        type: "CHANNEL",
        desc: "Channel for the invite. If not set, if a rules channel exists uses it, hides the invite otherwise.",
      },
    },
  },
  welcome: {
    description: "Change how Sokora welcomes your new users.",
    settings: {
      join_text: {
        type: "TEXT",
        desc: "Text sent when a user joins. Use (variables) to add dynamic info, run /help variables for info.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
      },
      leave_text: {
        type: "TEXT",
        desc: "Text sent when a user leaves. Use (variables) to add dynamic info, run /help variables for info.",
        val: "(name) has left the server! 😥",
      },
      join_channel: {
        type: "CHANNEL",
        desc: "ID of the channel where welcome messages are sent.",
      },
      leave_channel: {
        type: "CHANNEL",
        desc: "ID of the channel where leave messages are sent.",
      },
      join_dm: {
        type: "BOOL",
        desc: "Whether or not the bot should send a custom DM message to the user upon joining.",
        val: false,
      },
      dm_text: {
        type: "TEXT",
        desc: "Text sent in the user's DM when they join the server. Use (variables) to add dynamic info, run /help variables for info.",
        val: "Welcome to (servername), (name)! Interestingly, you just helped us reach (count) members. Have a nice day!",
      },
      roles: {
        type: "ROLE",
        desc: "The roles that should be given to the user when they join.",
        iterable: true,
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
      },
      enabled_eggs: {
        type: "EGG",
        desc: "Specific easter eggs to enable. If none are selected, all easter eggs are enabled.",
        iterable: true,
      },
      allowed_channels: {
        type: "CHANNEL",
        desc: "Channels where easter eggs are allowed.",
        iterable: true,
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
    });
    return null;
  }

  const res = getQuery.all(JSON.stringify(guildID), `${key}.${setting}`) as TypeOfDefinition<
    typeof tableDefinition
  >[];
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
        return (Number(value) == 1 ? true : false) as SqlType<typeof set.type>;
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

export async function setSetting<
  K extends keyof typeof settingsDefinition,
  S extends keyof (typeof settingsDefinition)[K]["settings"],
>(guildID: string, key: K, setting: S, value: any) {
  const set = Array.isArray(value) ? dekominator(value) : value;
  deleteQuery.all(JSON.stringify(guildID), `${key}.${setting}`);
  insertQuery.run(JSON.stringify(guildID), `${key}.${setting}`, set);
}

export function listPublicServers(): Promise<
  {
    guildID: string;
    showInvite: boolean;
    inviteChannelId: string | null;
  }[]
> {
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

export async function deletePublicServer(guildId: string) {
  try {
    deletePublicQuery.all(JSON.stringify(guildId));
  } catch (error) {
    return await errorEmbed({ client, error, log: true, forward: true });
  }
}
