import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorCheck, modEmbed } from "../../utils/embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("note")
  .setDescription("Add a note on a user.")
  .addUserOption(user =>
    user
      .setName("user")
      .setDescription("The user that you want to add a note on.")
      .setRequired(true),
  )
  .addStringOption(string =>
    string.setName("note").setDescription("The content of the user note.").setRequired(true),
  )
  .addIntegerOption(bool =>
    bool
      .setName("previous_note_id")
      .setDescription(
        "If provided, will modify the user note with the given case id instead of adding a new one.",
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const note = interaction.options.getString("note");
  const previousID = interaction.options.getInteger("previous_note_id") ?? 0;
  if (
    await errorCheck(
      "ModerateMembers",
      { interaction, user, action: "Annotate" },
      { allErrors: true, botError: false, ownerError: true, outsideError: true },
      "Moderate Members",
    )
  )
    return;

  await modEmbed(
    { interaction, user, action: "Annotated", dm: false, dbAction: "NOTE", previousID: previousID },
    note,
  );
}
