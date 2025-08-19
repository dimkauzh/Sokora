import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";
import ms from "ms";

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
        ChannelType.GuildAnnouncement,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const channelOption = interaction.options.getChannel("channel")!;
  let channel = guild.channels.cache.get(interaction.channel!.id)!;
  if (channelOption) channel = guild.channels.cache.get(channelOption.id)!;

  if (
    await errorCheck("Manage Channels", {
      interaction,
      channel: channel.id,
      errorOptions: { allErrors: false, botError: true, channelError: true },
    })
  )
    return;

  const time = interaction.options.getString("time")!;
  const reason = interaction.options.getString("reason");
  let title = `Set the slowdown to ${ms(ms(time), { long: true })}`;
  if (!ms(time)) title = "Removed the slowdown";

  if (
    !(
      channel.type == ChannelType.GuildText ||
      channel.type == ChannelType.GuildAnnouncement ||
      channel.type == ChannelType.GuildVoice ||
      channel.type == ChannelType.GuildStageVoice ||
      channel.type == ChannelType.PublicThread ||
      channel.type == ChannelType.PrivateThread
    )
  )
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can't be slowed down.",
    });

  await Promise.all([
    channel.setRateLimitPerUser(ms(time) / 1000, interaction.options.getString("reason")!),
    modEmbed(
      {
        interaction,
        channel: channel.id,
        customText: { logTitle: title },
      },
      reason,
    ),
  ]);
}
