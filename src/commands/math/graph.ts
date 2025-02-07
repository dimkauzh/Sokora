import { createCanvas } from "canvas";
import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import * as math from "mathjs";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { genColor, genRGBColor } from "../../utils/colorGen";

export const data = new SlashCommandSubcommandBuilder()
  .setName("graph")
  .setDescription("Graph a mathematical function")
  .addStringOption(option =>
    option
      .setName("function")
      .setDescription("The function to graph (e.g., 'x^2' or 'sin(x)')")
      .setRequired(true),
  )
  .addNumberOption(option => option.setName("xmin").setDescription("Minimum x value"))
  .addNumberOption(option => option.setName("xmax").setDescription("Maximum x value"))
  .addNumberOption(option => option.setName("ymin").setDescription("Minimum y value"))
  .addNumberOption(option => option.setName("ymax").setDescription("Maximum y value"));

export async function run(interaction: ChatInputCommandInteraction) {
  const func = interaction.options.getString("function", true);
  const xmin = interaction.options.getNumber("xmin") ?? -10;
  const xmax = interaction.options.getNumber("xmax") ?? 10;
  const ymin = interaction.options.getNumber("ymin") ?? -10;
  const ymax = interaction.options.getNumber("ymax") ?? 10;

  try {
    const compiled = math.compile(func);
    compiled.evaluate({ x: 0 });

    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // me when background?!
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;

    const yAxis = height - ((0 - ymin) * height) / (ymax - ymin);
    ctx.beginPath();
    ctx.moveTo(0, yAxis);
    ctx.lineTo(width, yAxis);
    ctx.stroke();

    const xAxis = ((0 - xmin) * width) / (xmax - xmin);
    ctx.beginPath();
    ctx.moveTo(xAxis, 0);
    ctx.lineTo(xAxis, height);
    ctx.stroke();

    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.beginPath();

    const points = 1000;
    let first = true;

    for (let i = 0; i <= points; i++) {
      const x = xmin + (i * (xmax - xmin)) / points;

      try {
        const y = compiled.evaluate({ x });
        if (typeof y != "number" || !isFinite(y)) continue;

        const canvasX = ((x - xmin) * width) / (xmax - xmin);
        const canvasY = height - ((y - ymin) * height) / (ymax - ymin);

        if (first) {
          ctx.moveTo(canvasX, canvasY);
          first = false;
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      } catch {
        continue;
      }
    }

    ctx.stroke();
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "graph.png" });
    const embed = new EmbedBuilder()
      .setTitle("Function Graph")
      .setDescription(`\`f(x) = ${func}\``)
      .setImage("attachment://graph.png")
      .setColor(genColor(100));

    await interaction.reply({ embeds: [embed], files: [attachment] });
  } catch (error) {
    return await errorEmbed(
      interaction,
      "Invalid function",
      "Please provide a valid mathematical function. Examples: 'x^2', 'sin(x)', '2*x + 1'.",
    );
  }
}
