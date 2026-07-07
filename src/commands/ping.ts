import {
  ContainerBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import ms from "enhanced-ms";
import { genColorCV2 } from "utils/colorGen";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Shows the current ping and uptime of Sokora.")
  .setContexts(0);

export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const sent = await interaction.reply({ content: "a", withResponse: true });
    const client = interaction.client;
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## Pong!"),
        new TextDisplayBuilder().setContent(
          [
            `\`Latency\` **${sent.resource?.message?.createdTimestamp! - interaction.createdTimestamp}ms**.`,
            `\`WebSocket heartbeat\` **${client.ws.ping}ms**.`,
            `\`Bot uptime\` **${ms(client.uptime, "short")}**.`,
          ].join("\n"),
        ),
        new TextDisplayBuilder().setContent(`-# ${replace("(madeWith)")}`),
      )
      .setAccentColor(genColorCV2(300)!);

    await interaction.editReply({ content: "", components: [container], flags: "IsComponentsV2" });
  } catch (error) {
    console.error(error);
  }
}
