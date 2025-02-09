import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { genColor } from "../../utils/colorGen";
import { replace } from "../../utils/replace";
import { Replacements } from "../../utils/types";

export const data = new SlashCommandSubcommandBuilder()
  .setName("codes")
  .setDescription(
    "Show a list of (codes) used to dynamically show data on join and leave messages",
  );

export async function run(interaction: ChatInputCommandInteraction) {
  try {
    // i know asserting types like this! is not a good practice but uhh yeah i have homework now, 'll validate this later
    const replacement: Replacements = [
      { text: "(name)", replacement: interaction.member!.user.username },
      { text: "(count)", replacement: interaction.guild!.memberCount },
      { text: "(servername)", replacement: interaction.guild!.name },
      { text: "(serverowner)", replacement: (await interaction.guild!.fetchOwner()).displayName },
      { text: "(currentdate)", replacement: `<t:${Math.floor(Date.now() / 1000)}>` },
    ];

    const example = `Welcome to (servername), **(name)**!`;
    const exampleTwo = `Hi **(name)**! Thanks for joining *(servername)* at (currentdate), **(serverowner)** and the ***(count)*** members are happy to meet you!`;

    const embed = new EmbedBuilder()
      .setTitle("Dynamic (codes)")
      .setDescription(
        "You can write the following codes in join and leave messages to dynamically show certain pieces of data. Data like 'current time' or 'member count' always refer to what that value is at the moment of sending the join / leave message.",
      )
      .setColor(genColor(200))
      .setFields([
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
            `\`(currentdate)\` - current date, as a Discord timestamp`,
          ].join("\n"),
        },
        {
          name: "Simple example",
          value: [
            `A simple example: \`${example}\` will result in:`,
            "",
            `> ${replace(example, replacement)}`,
          ].join("\n"),
        },
        {
          name: "Full example",
          value: [
            `Adding everything, like: \`${exampleTwo}\` will result in:`,
            "",
            `> ${replace(exampleTwo, replacement)}`,
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
