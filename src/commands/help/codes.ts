import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { genColor } from "../../utils/colorGen";
import { replaceCodes } from "../../utils/replace";

export const data = new SlashCommandSubcommandBuilder()
  .setName("codes")
  .setDescription(
    "Show a list of (codes) used to dynamically show data on join and leave messages",
  );

export async function run(interaction: ChatInputCommandInteraction) {
  try {
    const example = `Welcome to (servername), **(name)**!`;
    const exampleTwo = `Hi **(name)**! Thanks for joining *(servername)* at (currentdate, simple), **(serverowner)** and the ***(count)*** members are happy to meet you!`;

    const embed = new EmbedBuilder()
      .setTitle("Dynamic (codes)")
      .setDescription(
        "You can write the following codes in join and leave messages to dynamically show certain pieces of data. Data like 'current time' or 'member count' always refer to what that value is at the moment of sending the join / leave message.",
      )
      .setColor(genColor(200))
      .setFields([
        {
          name: "Simple example",
          value: [
            `A simple example: \`${example}\` will result in:`,
            "",
            `> ${await replaceCodes(example, interaction.guild!, interaction.user)}`,
          ].join("\n"),
        },
        {
          name: "Full example",
          value: [
            `Adding everything, like: \`${exampleTwo}\` will result in:`,
            "",
            `> ${await replaceCodes(exampleTwo, interaction.guild!, interaction.user)}`,
          ].join("\n"),
        },
        {
          name: "All codes",
          value: [
            `\`(name)\` - name of the user who joined`,
            `\`(count)\` - member count`,
            `\`(servername)\` - name of this server`,
            `\`(serverowner)\` - ${
              interaction.member?.user.id === interaction.guild?.ownerId
                ? "your name!"
                : "name of this server's owner"
            }`,
            `\`(currentdate)\` - current date in the 'February 10, 2025' format`,
            `\`(currentdate, simple)\` - current date in the '2/10/25' format`,
            `\`(currentdate, detailed)\` - current date in the 'February 10, 2025, at 4:36 PM' format`,
          ].join("\n"),
        },
      ])
      .setFooter({
        text: "Sokora /help codes",
      });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    return await errorEmbed(
      interaction,
      "Invalid function",
      "Please provide a valid mathematical function. Examples: 'x^2', 'sin(x)', '2*x + 1'.",
    );
  }
}
