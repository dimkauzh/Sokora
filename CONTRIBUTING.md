# Sokora Contributing Guide

## Prerequisites

- Basic knowledge of [TypeScript](https://typescriptlang.org/) and [discord.js](https://discord.js.org/).
- [Bun](https://bun.sh) installed.

## Get started with contributing

### Getting the code

- Make a fork of this repository.
- Clone your fork.

### Creating your bot

- Head over to the [Discord Developer Portal](https://discord.com/developers/applications) and make a new application.
- Invite your bot to your server.
- Reset and then copy your bot's token.

### Choosing the database

Sokora has two database options: PostgreSQL and SQLite. SQLite is the easiest to set up, but Postgre will ultimately be used in production.

#### SQLite

- stuff to set up sqlite here

#### PostgreSQL

- stuff to set up postgre here

### Setting up .env

- Run `bun run setup` and our CLI tool will install dependencies and write .env for you. It'll ask you to paste in your bot's token.

### Running

- Run `bun dev`.

Be sure to open a pull request when you're ready to push your changes. Be descriptive of the changes you've made.

## Contribution guide

A few, simple guidelines onto how to contribute to Sokora.

### Reminders

- Remember to commit changes to `bun.lock` file.

### Code styling guidelines

A few guides onto how code contributed to Sokora should look like.

- Keep a consistent indentation of two spaces. Don't use tabs.
- Use `K&R` style for bracket placement (`function() {}` instead of `function() \n {}`).
- Avoid arrow parenthesis, this means preferring, for example, `.filter(s => s.trim())` above `.filter((s) => s.trim())`. Use parenthesis only if they're necessary, for example when you need to explicitly type a parameter.
- Use `camelCase` for both variables and function names.
- Keep lines reasonably short, don't fear linebreaks. Of course, longer lines are valid where needed.
- Use early returns to avoid nesting.
- Avoid curly braces in one-line `if` statements.
- Non-nullish assertions are valid when needed.
- Use the functions `safeChannel` and `safeMember` from `safeThings` instead of using the cache or fetching.
- Prefer `Promise.all` over having several `await` statements.

### Subete commit system (WIP)

We've created an alternative to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), aimed at improving its functionality. It'll be required to be used to contribute to this project when it gets proper documentation via a website.

Full layout: `![<type>@[scope] [part]] <description>`, where:

- `!` signifies a breaking change.
- `type` is the type of the commit, e.g `fix`, `feat`, `refactor`, etc.
- `scope` is where the changes happened.
- `part` shows the part of the commit.
- And finally, `description` is where the changes are described.

#### Examples

`[fix@settingsEmbed pt3] fixed OBJECT type`
`[chore] Update enhanced-ms to 4.3.0`
`![fix@settings] types have been fixed`

---

![PLEASE SUBMIT A PR, NO DIRECT COMMITS](https://user-images.githubusercontent.com/51555391/176925763-cdfd57ba-ae1e-4bf3-85e9-b3ebd30b1d59.png)
