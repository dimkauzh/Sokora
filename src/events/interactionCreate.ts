import { commands, subCommands } from "../handlers/commands";
import { check } from "../utils/database/blocklist";
import { errorEmbed } from "../utils/embeds/errorEmbed";
import { noErrorsPlease } from "../utils/noErrorsPlease";
import type { Event } from "../utils/types";

export default (async function run(interaction) {
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;
  let command;
  const subCommand = subCommands.filter(
    subCommand => subCommand.data.name == interaction.options.getSubcommand(false),
  )[0];

  if (!subCommand)
    command = commands.filter(command => command.data.name == interaction.commandName)[0];
  else command = subCommand;
  //console.log(command.run);

  if (!command) return;
  if (interaction.isChatInputCommand()) {
    if (!check(interaction.member?.user.id!))
      return await errorEmbed({
        interaction,
        title: "The bot has experienced an internal error.",
        reason: "Please try again later.",
      });

    await noErrorsPlease(interaction);
    // TODO: fix error (command.run is an array when running /user settings)
    command.run(interaction);
  }
  if (command.autocomplete) command.autocomplete(interaction);
} as Event<"interactionCreate">);
