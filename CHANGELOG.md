<!-- markdownlint-disable md024 -->
<!-- preserve old changelogs here -->

# Sokora Changelog

## 0.3.0

### Fixed

#### News

- Fixed not being able to delete the first new you create.

#### Moderation

- Fixed the bot crashing because of too large messages being deleted.
- Fixed a `Jump to message` option being shown on deleted messages (you cannot jump to a deleted message).
- Fixed the bot showing "Application didn't respond" when unmuting someone muted by another bot.

## 0.2.0

### Added

#### Commands

- /changelog
- /credits
- /moderation notes

### Changed

- The bot will remove levels when an admin changed the leveling difficulty
- /leaderboard shows 6 users per page instead of 5
- When you add the bot, it sends a message in the system channel
- Remade the message logs
- Edit logs will let you jump to the message that got edited

#### /settings

- Autocompletes with channels/users/roles (you don't have to copy IDs now :tada:)
- In the embed it will show links to channels/users/roles instead of showing IDs

#### /about

- Vote button added

- Removed credits and put them in a different command to reduce the height of the embed

### Fixed

#### News

- Major issue related to the database, where the guild wasn't provided to ensure that news would be unique to every server, **thank you @Golem642!!!!**
- /news edit's modal errored when sending

#### Moderation commands

- /moderation clear removed one more message than the user provided
- /moderation unban errored internally (it should send an error embed) when the user didn\'t have the "Ban Members" permission

### Typos

- warn mentions in /moderation warn are now warning to be more consistent
- Removed old markdown remnants from /moderation slowdown
