import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { removeAutokickData, setAutokickData } from "../../utils/database/autokick";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { logChannel } from "../../utils/logChannel";

export const data = new SlashCommandSubcommandBuilder()
  .setName("autokick")
  .setDescription("Configure user auto-kick settings")
  .addUserOption(option =>
    option
      .setName("user")
      .setDescription("The member to configure auto-kick for")
      .setRequired(true),
  )
  .addIntegerOption(option =>
    option
      .setName("days")
      .setDescription("Days after which to kick (0 to disable)")
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(365),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageGuild")) {
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "You need the **Manage Server** permission.",
    );
  }

  const targetUser = interaction.options.getUser("user", true);
  const days = interaction.options.getInteger("days", true);

  if (days === 0) {
    removeAutokickData(guild.id, targetUser.id);

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Auto-kick Disabled" })
      .setDescription(
        [`**Member**: ${targetUser.tag}`, "Auto-kick has been disabled for this member."].join(
          "\n",
        ),
      )
      .setColor(genColor(100));

    await logChannel(guild, embed);
    await interaction.reply({ embeds: [embed] });
    return;
  }

  setAutokickData(guild.id, targetUser.id, days);

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Auto-kick Configured" })
    .setDescription(
      [
        `**Member**: ${targetUser.tag}`,
        `**Delay**: ${days} days`,
        `Members with this role will be automatically kicked after ${days} days.`,
      ].join("\n"),
    )
    .setColor(genColor(100));

  await logChannel(guild, embed);
  await interaction.reply({ embeds: [embed] });
}
