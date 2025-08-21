import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import ms from "enhanced-ms";
import { colorize } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Shows the current ping and uptime of Sokora.");

export async function run(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const user = client.user;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: `${dotCheck({ string: avatar, doubleSpace: true })}Pong!`, iconURL: avatar })
    .setDescription(
      [
        `\`Latency\` **${Date.now() - interaction.createdTimestamp}ms**.`,
        `\`API Latency\` **${client.ws.ping}ms**.`,
        `\`Bot uptime\` **${ms(client.uptime, "fullPrecision")}**.`,
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(await colorize({ user, avatar, hue: 270 }));

  await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
}
