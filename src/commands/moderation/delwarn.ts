import { listUserModeration, removeModeration } from "database/moderation";
import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("delwarn")
  .setDescription("Removes a warning from a user.")
  .addUserOption(user =>
    user
      .setName("user")
      .setDescription("The user that you want to free from the warning.")
      .setRequired(true),
  )
  .addNumberOption(number =>
    number.setName("id").setDescription("The id of the warn.").setRequired(true),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const guild = interaction.guild!;
  const name = user.username;
  const id = interaction.options.getNumber("id");
  const warns = listUserModeration(guild.id, user.id, "WARN");
  const newWarns = warns.filter(warn => warn.id != `${id}`);

  if (
    await errorCheck("Moderate Members", {
      interaction,
      user,
      action: "Remove a warning",
      errorOptions: { allErrors: true, botError: false },
    })
  )
    return;

  if (newWarns.length == warns.length)
    return await errorEmbed({ interaction, title: `There is no warning with the id of ${id}.` });

  try {
    removeModeration(guild.id, `${id}`);
  } catch (error) {
    return await errorEmbed({
      interaction,
      error,
      forward: true,
    });
  }

  await modEmbed({
    interaction,
    user,
    dm: true,
    customText: {
      logTitle: `Removed a warning from ${name}`,
      dmTitle: "Your warning has been removed",
    },
  });
}
