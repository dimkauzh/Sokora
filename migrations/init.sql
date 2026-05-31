CREATE TABLE IF NOT EXISTS settings (
  "guildID" TEXT,
  "key" TEXT,
  "value" TEXT
);

CREATE TABLE IF NOT EXISTS user_settings (
  "userID" TEXT,
  "key" TEXT,
  "value" TEXT
);

CREATE TABLE IF NOT EXISTS leveling (
  "guild" TEXT,
  "userID" TEXT,
  "xp" INTEGER
);

CREATE TABLE IF NOT EXISTS moderation (
  "guild" TEXT,
  "userID" TEXT,
  "type" TEXT,
  "moderator" TEXT,
  "reason" TEXT,
  "id" INTEGER,
  "timestamp" TIMESTAMP,
  "expiresAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  "guildID" TEXT,
  "title" TEXT,
  "body" TEXT,
  "author" TEXT,
  "authorPFP" TEXT,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP,
  "messageID" TEXT,
  "imageURL" TEXT,
  "id" INTEGER
);

CREATE TABLE IF NOT EXISTS starboard (
  "guild" TEXT,
  "message" TEXT,
  "channel" TEXT,
  "author" TEXT,
  "star_message" TEXT,
  "stars" INTEGER,
  "content" TEXT,
  "timestamp" TIMESTAMP
);

ALTER TABLE settings ADD CONSTRAINT settings_pk PRIMARY KEY ("guild_id", "key");
ALTER TABLE user_settings ADD CONSTRAINT user_settings_pk PRIMARY KEY ("user_id", "key");
ALTER TABLE leveling ADD CONSTRAINT leveling_pk PRIMARY KEY ("guild_id", "user_id");
ALTER TABLE moderation ADD CONSTRAINT moderation_pk PRIMARY KEY ("guild_id", "id");
ALTER TABLE news ADD CONSTRAINT news_pk PRIMARY KEY ("guild_id", "id");
ALTER TABLE starboard ADD CONSTRAINT starboard_pk PRIMARY KEY ("guild_id", "message");
