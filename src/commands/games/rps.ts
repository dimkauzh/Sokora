import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../../utils/colorGen.ts";
import { errorEmbed } from "../../utils/embeds/errorEmbed.ts";
import { randomize } from "../../utils/randomize.ts";

type RPSChoice = "rock" | "paper" | "scissors";
const rpsChoices: RPSChoice[] = ["rock", "paper", "scissors"];
const rpsEmojis: Record<RPSChoice, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

export const data = new SlashCommandSubcommandBuilder()
  .setName("rps")
  .setDescription("Play Rock Paper Scissors")
  .addUserOption(option =>
    option.setName("opponent").setDescription("The user to play against (optional)."),
  );

function getWinner(choice1: RPSChoice, choice2: RPSChoice): 0 | 1 | 2 {
  if (choice1 == choice2) return 0;
  if (
    (choice1 == "rock" && choice2 == "scissors") ||
    (choice1 == "paper" && choice2 == "rock") ||
    (choice1 == "scissors" && choice2 == "paper")
  )
    return 1;
  return 2;
}

export async function run(interaction: ChatInputCommandInteraction) {
  const opponent = interaction.options.getUser("opponent");
  const optionsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...rpsChoices.map((choice: RPSChoice) =>
      new ButtonBuilder()
        .setCustomId(`rps_${choice}`)
        .setEmoji(rpsEmojis[choice])
        .setStyle(ButtonStyle.Primary),
    ),
  );
  const baseEmbed = new EmbedBuilder()
    .setTitle("Rock Paper Scissors")
    .setDescription(
      opponent
        ? `${interaction.user} has challenged ${opponent} to a game!\n` +
            `Both players, make your choice!`
        : `Choose your weapon!`,
    )
    .setColor(genColor(110));

  if (opponent) {
    if (opponent.bot)
      return await errorEmbed({
        interaction,
        title: "Invalid opponent",
        reason: `You cannot play against a bot!${
          opponent.id == interaction.client.user.id
            ? " To challenge Sokora itself, run `/games rps` without specifying the opponent."
            : ""
        }`,
      });

    if (opponent.id == interaction.user.id)
      return await errorEmbed({
        interaction,
        title: "Invalid opponent.",
        reason: "You cannot play against yourself.",
      });

    const reply = await interaction.reply({ embeds: [baseEmbed], components: [optionsRow] });
    const playerChoices = new Map<string, RPSChoice>();
    const collector = reply.createMessageComponentCollector({
      filter: i => [interaction.user.id, opponent.id].includes(i.user.id),
      time: 30000,
    });

    collector.on("collect", async (i: ButtonInteraction) => {
      playerChoices.set(i.user.id, i.customId.split("_")[1] as RPSChoice);
      await i.reply({ content: "Choice recorded!", flags: "Ephemeral" });
      if (playerChoices.size == 2) collector.stop("game-complete");
    });

    collector.on("end", async (_, reason) => {
      if (reason == "time")
        return await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Game Timed Out")
              .setDescription("The game has been cancelled due to inactivity.")
              .setColor(genColor(0)),
          ],
          components: [],
        });

      if (reason == "game-complete") {
        const p1Choice = playerChoices.get(interaction.user.id)!;
        const p2Choice = playerChoices.get(opponent.id)!;
        const winner = getWinner(p1Choice, p2Choice);

        const resultEmbed = new EmbedBuilder()
          .setTitle("Game Results")
          .setDescription(
            `${interaction.user}: ${rpsEmojis[p1Choice]}\n` +
              `${opponent}: ${rpsEmojis[p2Choice]}\n\n` +
              `Winner: ${winner == 0 ? "It's a tie!" : winner == 1 ? interaction.user : opponent}`,
          )
          .setColor(winner == 0 ? genColor(60) : genColor(120));

        await interaction.editReply({ embeds: [resultEmbed], components: [] });
      }
    });
    return;
  }

  const reply = await interaction.reply({ embeds: [baseEmbed], components: [optionsRow] });

  const collector = reply.createMessageComponentCollector({
    filter: i => i.user.id == interaction.user.id,
    time: 30000,
  });

  collector.on("collect", async (i: ButtonInteraction) => {
    const playerChoice = i.customId.split("_")[1] as RPSChoice;
    const botChoice = randomize(rpsChoices);
    const winner = getWinner(playerChoice, botChoice);

    const resultEmbed = new EmbedBuilder()
      .setTitle("Game Results")
      .setDescription(
        `You: ${rpsEmojis[playerChoice]}\n` +
          `Bot: ${rpsEmojis[botChoice]}\n\n` +
          `Result: ${winner == 0 ? "It's a tie!" : winner == 1 ? "You win!" : "Bot wins!"}`,
      )
      .setColor(winner == 0 ? genColor(60) : winner == 1 ? genColor(120) : genColor(0));

    await i.update({ embeds: [resultEmbed], components: [] });
    collector.stop();
  });

  collector.on("end", async (_, reason) => {
    if (reason != "time") return;
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Game timed out")
          .setDescription("The game was cancelled due to inactivity.")
          .setColor(genColor(0)),
      ],
      components: [],
    });
  });
}
