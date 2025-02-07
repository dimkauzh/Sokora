import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../../utils/colorGen";
import { addAutomodRule } from "../../utils/database/automod";
import { setSetting } from "../../utils/database/settings";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { logChannel } from "../../utils/logChannel";

export const data = new SlashCommandSubcommandBuilder()
  .setName("automod")
  .setDescription("Configure automod settings")
  .addStringOption(option =>
    option.setName("pattern").setDescription("The regex pattern to match").setRequired(true),
  )
  .addStringOption(option =>
    option
      .setName("action")
      .setDescription("Action to take when pattern matches")
      .setRequired(true)
      .addChoices(
        { name: "Delete Message", value: "delete" },
        { name: "Timeout User", value: "timeout" },
        { name: "Kick User", value: "kick" },
        { name: "Ban User", value: "ban" },
      ),
  )
  .addStringOption(option =>
    option.setName("duration").setDescription("Duration for timeout/ban (e.g., 1h, 1d)"),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageGuild"))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "You need the **Manage Server** permission.",
    );

  const pattern = interaction.options.getString("pattern", true);
  const action = interaction.options.getString("action", true);
  const duration = interaction.options.getString("duration") || "1h";
  try {
    new RegExp(pattern);
  } catch (error) {
    return await errorEmbed(
      interaction,
      "Invalid regex pattern",
      "The provided pattern is not a valid regular expression.",
    );
  }

  addAutomodRule(guild.id, pattern, action, duration, [], []);
  setSetting(guild.id, "moderation", "automod_enabled", "1");

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Automod Rule Added" })
    .setDescription(
      [`**Pattern**: \`${pattern}\``, `**Action**: ${action}`, `**Duration**: ${duration}`].join(
        "\n",
      ),
    )
    .setColor(genColor(100));

  await logChannel(guild, embed);
  await interaction.reply({ embeds: [embed] });
}
