import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  type Client,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

export const commands: { data: SlashCommandBuilder; run: any; autocomplete: any }[] = [];
export const subCommands: {
  data: SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder;
  run: any;
  autocomplete: any;
}[] = [];

function pushCommand(array: any[], command: any) {
  return array.push({ data: command.data, run: command.run, autocomplete: command.autocomplete });
}

function pushSubCommand(client: Client, run: any[], autocomplete: any[], command: any) {
  run.push(command.run);
  pushCommand(subCommands, command);
  if (!("autocompleteHandler" in command)) return;
  command.autocompleteHandler(client);
  if (command.autocomplete) autocomplete.push(command.autocomplete);
}

async function createSubCommand(name: string, client: Client) {
  const commandsPath = join(process.cwd(), "src", "commands");
  const run: any[] = [];
  const autocomplete: any[] = [];
  const command = new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription("This command has no description.");

  for (const subCommandFile of readdirSync(join(commandsPath, name), {
    withFileTypes: true,
  })) {
    if (subCommandFile.isFile()) {
      const subCommand = await import(
        pathToFileURL(join(commandsPath, name, subCommandFile.name)).toString()
      );

      if (subCommand.data instanceof SlashCommandSubcommandBuilder)
        command.addSubcommand(subCommand.data);
      else command.addSubcommandGroup(subCommand.data);

      pushSubCommand(client, run, autocomplete, subCommand);
    }
  }

  return { data: command, run, autocomplete };
}

async function loadCommands(client: Client) {
  const commandsPath = join(process.cwd(), "src", "commands");

  for (const commandFile of readdirSync(commandsPath, { withFileTypes: true })) {
    const name = commandFile.name;
    if (commandFile.isFile()) {
      pushCommand(commands, await import(pathToFileURL(join(commandsPath, name)).toString()));
      continue;
    }
    pushCommand(commands, await createSubCommand(name, client));
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
