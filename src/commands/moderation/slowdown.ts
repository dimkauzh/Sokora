import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import ms from "ms";
import { modActionEmbed } from "../../utils/embeds/modActionEmbed";
import { mention } from "../../utils/mention";
import { errorCheck } from "../../utils/embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("slowdown")
  .setDescription("Slows a channel down.")
  .addStringOption(string =>
    string
      .setName("time")
      .setDescription("Time to slow the channel down to (e.g 30m, 1d, 2h). 0 to remove slowdown.")
      .setRequired(true),
  )
  .addStringOption(string =>
    string.setName("reason").setDescription("The reason for the slowdown."),
  )
  .addChannelOption(channel =>
    channel
      .setName("channel")
      .setDescription("The channel that you want to slowdown.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.GuildVoice,
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (
    await errorCheck(
      "ManageChannels",
      { interaction },
      { allErrors: false, botError: true },
      "Manage Channels",
    )
  )
    return;

  const time = interaction.options.getString("time")!;
  const reason = interaction.options.getString("reason");
  const channelOption = interaction.options.getChannel("channel")!;
  const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
  let title = `Set a slowdown of ${channelOption ?? `${channel.name}`} to ${ms(ms(time), {
    long: true,
  })}.`;
  if (!ms(time)) title = `Removed the slowdown from ${channelOption ?? `${channel.name}`}.`;

  if (
    channel.type == ChannelType.GuildText &&
    ChannelType.PublicThread &&
    ChannelType.PrivateThread &&
    ChannelType.GuildVoice
  )
    await channel
      .setRateLimitPerUser(ms(time) / 1000, interaction.options.getString("reason")!)
      .catch(error => console.error(error));

  await modActionEmbed(
    {
      title,
      body: [
        `**Moderator**: ${interaction.user.displayName}`,
        reason ? `**Reason**: ${reason}` : "*No reason provided*",
        `**Channel**: ${channelOption ?? mention(channel.id, "CHANNEL")}`,
      ],
    },
    guild,
    interaction,
  );
}
