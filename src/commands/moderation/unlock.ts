import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { logChannel } from "../../utils/logChannel";
import { modActionEmbed } from "../../utils/embeds/modActionEmbed";
import { mention } from "../../utils/mention";

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
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageRoles"))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "You need the **Manage Roles** permission.",
    );

  const channelOption = interaction.options.getChannel("channel")!;
  const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
  if (channel.permissionsFor(guild.id)?.has("SendMessages"))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "The channel is not locked.",
    );

  const embed = modActionEmbed("Unlocked a channel.", [
    `**Moderator**: ${interaction.user.displayName}`,
    `**Channel**: ${channelOption ?? mention(channel.id, "CHANNEL")}`,
  ]);

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

  await logChannel(guild, embed);
  await interaction.reply({ embeds: [embed] });
}
