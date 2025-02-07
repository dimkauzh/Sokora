import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed.ts";

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
    option.setName("opponent").setDescription("The user to play against (optional)"),
  );

function getWinner(choice1: RPSChoice, choice2: RPSChoice): number {
  if (choice1 === choice2) return 0;
  if (
    (choice1 === "rock" && choice2 === "scissors") ||
    (choice1 === "paper" && choice2 === "rock") ||
    (choice1 === "scissors" && choice2 === "paper")
  )
    return 1;
  return 2;
}

export async function run(interaction: ChatInputCommandInteraction) {
  const opponent = interaction.options.getUser("opponent");
  if (opponent) {
    if (opponent.bot)
      return await errorEmbed(interaction, "Invalid opponent", "You cannot play against a bot!");

    if (opponent.id == interaction.user.id)
      return await errorEmbed(interaction, "Invalid opponent", "You cannot play against yourself!");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...rpsChoices.map((choice: RPSChoice) =>
        new ButtonBuilder()
          .setCustomId(`rps_${choice}`)
          .setEmoji(rpsEmojis[choice])
          .setStyle(ButtonStyle.Primary),
      ),
    );

    const embed = new EmbedBuilder()
      .setTitle("Rock Paper Scissors")
      .setDescription(
        `${interaction.user} has challenged ${opponent} to a game!\n` +
          `Both players, make your choice!`,
      )
      .setColor("#00ff00");

    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
    });

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
              .setColor("#ff0000"),
          ],
          components: [],
        });

      if (reason === "game-complete") {
        const p1Choice = playerChoices.get(interaction.user.id)!;
        const p2Choice = playerChoices.get(opponent.id)!;
        const winner = getWinner(p1Choice, p2Choice);

        const resultEmbed = new EmbedBuilder()
          .setTitle("Game Results")
          .setDescription(
            `${interaction.user}: ${rpsEmojis[p1Choice]}\n` +
              `${opponent}: ${rpsEmojis[p2Choice]}\n\n` +
              `Winner: ${
                winner === 0 ? "It's a tie!" : winner === 1 ? interaction.user : opponent
              }`,
          )
          .setColor(winner === 0 ? "#ffff00" : "#00ff00");

        await interaction.editReply({
          embeds: [resultEmbed],
          components: [],
        });
      }
    });
    return;
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...rpsChoices.map((choice: RPSChoice) =>
      new ButtonBuilder()
        .setCustomId(`rps_${choice}`)
        .setEmoji(rpsEmojis[choice])
        .setStyle(ButtonStyle.Primary),
    ),
  );

  const embed = new EmbedBuilder()
    .setTitle("Rock Paper Scissors")
    .setDescription(`Choose your weapon!`)
    .setColor("#00ff00");

  const reply = await interaction.reply({
    embeds: [embed],
    components: [row],
  });

  const collector = reply.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: 30000,
  });

  collector.on("collect", async (i: ButtonInteraction) => {
    const playerChoice = i.customId.split("_")[1] as RPSChoice;
    const botChoice = rpsChoices[Math.floor(Math.random() * rpsChoices.length)];
    const winner = getWinner(playerChoice, botChoice);

    const resultEmbed = new EmbedBuilder()
      .setTitle("Game Results")
      .setDescription(
        `You: ${rpsEmojis[playerChoice]}\n` +
          `Bot: ${rpsEmojis[botChoice]}\n\n` +
          `Result: ${winner === 0 ? "It's a tie!" : winner === 1 ? "You win!" : "Bot wins!"}`,
      )
      .setColor(winner === 0 ? "#ffff00" : winner === 1 ? "#00ff00" : "#ff0000");

    await i.update({
      embeds: [resultEmbed],
      components: [],
    });
    collector.stop();
  });

  collector.on("end", async (_, reason) => {
    if (reason != "time") return;
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Game Timed Out")
          .setDescription("The game has been cancelled due to inactivity.")
          .setColor("#ff0000"),
      ],
      components: [],
    });
  });
}
