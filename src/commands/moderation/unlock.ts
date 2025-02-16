import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { modActionEmbed } from "../../utils/embeds/modActionEmbed";
import { mention } from "../../utils/mention";
import { errorCheck } from "../../utils/embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unlock")
  .setDescription("Unlocks a channel.")
  .addChannelOption(channel =>
    channel
      .setName("channel")
      .setDescription("The channel that you want to unlock.")
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

  const channelOption = interaction.options.getChannel("channel")!;
  const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
  if (channel.permissionsFor(guild.id)?.has("SendMessages"))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "The channel is not locked.",
    );

  if (
    channel.type == ChannelType.GuildText &&
    ChannelType.PublicThread &&
    ChannelType.PrivateThread &&
    ChannelType.GuildVoice
  )
    channel.permissionOverwrites
      .create(guild.id, {
        SendMessages: null,
        SendMessagesInThreads: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
      })
      .catch(error => console.error(error));

  await modActionEmbed(
    "Unlocked a channel.",
    [
      `**Moderator**: ${interaction.user.displayName}`,
      `**Channel**: ${channelOption ?? mention(channel.id, "CHANNEL")}`,
    ],
    guild,
    interaction,
  );
}
