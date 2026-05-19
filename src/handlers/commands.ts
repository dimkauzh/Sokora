import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  type Client,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type AutocompleteFunction = (interaction: AutocompleteInteraction) => Promise<void>;
type RunFunction = (interaction: ChatInputCommandInteraction) => Promise<unknown>;
interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder;
  run: RunFunction;
  autocomplete?: AutocompleteFunction;
}

export const commands: (Command & { data: SlashCommandBuilder })[] = [];
export const subCommands: (Command & { data: SlashCommandSubcommandBuilder })[] = [];

function pushCommand(array: Command[], command: Command): number {
  return array.push({ data: command.data, run: command.run, autocomplete: command.autocomplete });
}

function pushSubCommand(
  client: Client,
  run: RunFunction[],
  autocomplete: AutocompleteFunction[],
  command: Command & { autocompleteHandler?: (client: Client) => void },
): void {
  run.push(command.run);
  pushCommand(subCommands, command);
  if (typeof command.autocompleteHandler !== "function") return;
  command.autocompleteHandler(client);
  if (command.autocomplete) autocomplete.push(command.autocomplete);
}

async function createSubCommand(name: string, client: Client): Promise<Command> {
  const commandsPath = join(process.cwd(), "src", "commands");
  const run: RunFunction[] = [];
  const autocomplete: AutocompleteFunction[] = [];
  const command = new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription("This command has no description.")
    .setContexts(0);

  for (const subCommandFile of readdirSync(join(commandsPath, name), {
    withFileTypes: true,
  })) {
    const subName = subCommandFile.name;
    if (subCommandFile.isFile()) {
      const subCommand = (await import(
        pathToFileURL(join(commandsPath, name, subName)).toString()
      )) as Command & { data: SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder };
      if (subCommand.data instanceof SlashCommandSubcommandBuilder)
        command.addSubcommand(subCommand.data);
      else command.addSubcommandGroup(subCommand.data);

      pushSubCommand(client, run, autocomplete, subCommand);
      continue;
    }

    const subCommandGroup = new SlashCommandSubcommandGroupBuilder()
      .setName(subName.replaceAll(".ts", "").toLowerCase())
      .setDescription("This subcommand group has no description.");

    for (const subCommandGroupFile of readdirSync(join(commandsPath, name, subName), {
      withFileTypes: true,
    })) {
      if (!subCommandGroupFile.isFile()) continue;
      const subCommand = (await import(
        pathToFileURL(join(commandsPath, name, subName, subCommandGroupFile.name)).toString()
      )) as Command & { data: SlashCommandSubcommandBuilder };
      subCommandGroup.addSubcommand(subCommand.data);
      pushSubCommand(client, run, autocomplete, subCommand);
    }
    command.addSubcommandGroup(subCommandGroup);
  }

  return { data: command, run: run[0], autocomplete: autocomplete[0] };
}

async function loadCommands(client: Client): Promise<Command[]> {
  const commandsPath = join(process.cwd(), "src", "commands");

  for (const commandFile of readdirSync(commandsPath, { withFileTypes: true })) {
    const name = commandFile.name;
    if (commandFile.isFile()) {
      pushCommand(
        commands,
        (await import(pathToFileURL(join(commandsPath, name)).toString())) as Command,
      );
      continue;
    }
    pushCommand(commands, await createSubCommand(name, client));
  }

  return commands;
}

export async function removeGuildCommands(client: Client): Promise<void> {
  const guilds = client.guilds.cache;
  for (const guildID of guilds.keys()) await guilds.get(guildID)?.commands.set([]);
}

export async function removeGlobalCommands(client: Client): Promise<void> {
  await client.application?.commands.set([]);
}

export async function registerGuildCommands(client: Client): Promise<void> {
  await loadCommands(client);
  const guilds = client.guilds.cache;

  for (const guildID of guilds.keys())
    await guilds.get(guildID)?.commands.set(commands.map(command => command.data));
}

export async function registerGlobalCommands(client: Client): Promise<void> {
  await loadCommands(client);
  await client.application?.commands.set(commands.map(command => command.data));
}
