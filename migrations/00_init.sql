-- If we ever go postgres only
-- CREATE SCHEMA IF NOT EXISTS Discord
-- SET SCHEMA "Discord"

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
  "id" TEXT,
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
  "id" TEXT
);

CREATE TABLE IF NOT EXISTS starboard (
  "guild" TEXT,
  "message" TEXT,
  "channel" TEXT,
  "author" TEXT,
  "star_message" TEXT,
  "stars" INTEGER,
  "content" TEXT,
  "timestamp" TEXT
);