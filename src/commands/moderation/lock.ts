import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("lock")
  .setDescription("Locks a channel.")
  .addStringOption(string =>
    string.setName("reason").setDescription("The reason for locking the channnel."),
  )
  .addChannelOption(channel =>
    channel
      .setName("channel")
      .setDescription("The channel that you want to lock.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const channelOption = interaction.options.getChannel("channel")!;
  const reason = interaction.options.getString("reason");
  let channel = guild.channels.cache.get(interaction.channel!.id)!;
  if (channelOption) channel = guild.channels.cache.get(channelOption.id)!;

  if (
    await errorCheck("Manage Roles", {
      interaction,
      channel: channel.id,
      errorOptions: { allErrors: false, botError: true, channelError: true },
    })
  )
    return;

  if (!channel.permissionsFor(guild.id)?.has("SendMessages"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "The channel is already locked.",
    });

  if (
    !(
      channel.type == ChannelType.GuildText ||
      channel.type == ChannelType.GuildAnnouncement ||
      channel.type == ChannelType.GuildVoice ||
      channel.type == ChannelType.GuildStageVoice
    )
  )
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can't be locked.",
    });

  try {
    await Promise.all([
      channel.permissionOverwrites.create(guild.id, {
        SendMessages: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      }),
      modEmbed(
        {
          interaction,
          channel: channel.id,
          customText: { logTitle: "Locked a channel" },
        },
        reason,
      ),
    ]);
  } catch (error) {
    return await errorEmbed({
      interaction,
      error,
      forward: true,
      fileName: "lock.ts",
    });
  }
}
