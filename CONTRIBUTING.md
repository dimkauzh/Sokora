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
- Use `camelCase` for both variables and function names.
- Keep lines reasonably short, don't fear linebreaks. Of course, longer lines are valid where needed.
- Use early returns to avoid nesting.
- Avoid curly braces in one-line `if` statements.
- Non-nullish assertions are valid when needed.
- Use the cache instead of a new `fetch()` call where possible, to avoid unnecessary usage (e.g., if possible, prefer `guild.members.cache` over `await guild.members.fetch()`).

![PLEASE SUBMIT A PR, NO DIRECT COMMITS](https://user-images.githubusercontent.com/51555391/176925763-cdfd57ba-ae1e-4bf3-85e9-b3ebd30b1d59.png)
