import { SlashCommandBuilder, SlashCommandSubcommandBuilder, type Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

export let commands: { data: SlashCommandBuilder; run: any; autocomplete: any }[] = [];
export let subCommands: { data: SlashCommandSubcommandBuilder; run: any; autocomplete: any }[] = [];
async function createSubCommand(name: string, client: Client, ...disabledCommands: string[]) {
  const commandsPath = join(process.cwd(), "src", "commands");
  const run = [];
  const autocomplete = [];
  const command = new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription("This command has no description.");

  for (const subCommandFile of readdirSync(join(commandsPath, name), {
    withFileTypes: true
  })) {
    const subCommandName = subCommandFile.name.replaceAll(".ts", "");
    if (
      disabledCommands?.find(
        command => command?.split("/")?.[0] == name && command?.split("/")?.[1] == subCommandName
      )
    )
      continue;

    if (!subCommandFile.isFile()) continue;
    const subCommandModule = await import(
      pathToFileURL(join(commandsPath, name, subCommandFile.name)).toString()
    );
    const subCommand = new subCommandModule.default();

    command.addSubcommand(subCommand.data);
    run.push(subCommand.run);
    subCommands.push({
      data: subCommand.data,
      run: subCommand.run,
      autocomplete: subCommand.autocomplete
    });

    if ("autocompleteHandler" in subCommand) {
      subCommand.autocompleteHandler(client);
      autocomplete.push(subCommand.autocomplete);
    }
  }

  return { data: command, run: run, autocomplete: autocomplete };
}

async function loadCommands(client: Client, ...disabledCommands: string[]) {
  const commandsPath = join(process.cwd(), "src", "commands");
  for (const commandFile of readdirSync(commandsPath, { withFileTypes: true })) {
    const name = commandFile.name;
    if (disabledCommands?.includes(name.replaceAll(".ts", ""))) continue;

    if (commandFile.isFile()) {
      const commandImport = await import(pathToFileURL(join(commandsPath, name)).toString());
      commands.push(new commandImport.default());
      continue;
    }

    const subCommand = await createSubCommand(
      name,
      client,
      join(commandsPath, name),
      ...disabledCommands
    );

    commands.push({
      data: subCommand.data,
      run: subCommand.run,
      autocomplete: subCommand.autocomplete
    });
  }

  return commands;
}

export async function removeGuildCommands(client: Client) {
  const guilds = client.guilds.cache;
  for (const guildID of guilds.keys()) await guilds.get(guildID)?.commands.set([]);
}

export async function removeGlobalCommands(client: Client) {
  await client.application?.commands.set([]);
}

export async function registerGuildCommands(client: Client) {
  await loadCommands(client);
  const guilds = client.guilds.cache;

  for (const guildID of guilds.keys())
    await guilds.get(guildID)?.commands.set(commands.map(command => command.data));
}

export async function registerGlobalCommands(client: Client) {
  await loadCommands(client);
  await client.application?.commands.set(commands.map(command => command.data));
}
