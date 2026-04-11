ALTER TABLE settings ADD CONSTRAINT settings_pk PRIMARY KEY ("guildID", "key");
ALTER TABLE user_settings ADD CONSTRAINT user_settings_pk PRIMARY KEY ("userID", "key");
ALTER TABLE leveling ADD CONSTRAINT leveling_pk PRIMARY KEY ("guild", "userID"); -- Why is it guild and not guildID
ALTER TABLE moderation ADD CONSTRAINT moderation_pk PRIMARY KEY ("guild", "id");
ALTER TABLE news ADD CONSTRAINT news_pk PRIMARY KEY ("guildID", "id");
ALTER TABLE starboard ADD CONSTRAINT starboard_pk PRIMARY KEY ("guild", "message");