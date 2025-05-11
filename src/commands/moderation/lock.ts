import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { modActionEmbed } from "../../utils/embeds/modActionEmbed";
import { errorCheck } from "../../utils/embeds/modEmbed";
import { mention } from "../../utils/mention";

export const data = new SlashCommandSubcommandBuilder()
  .setName("lock")
  .setDescription("Locks a channel.")
  .addChannelOption(channel =>
    channel
      .setName("channel")
      .setDescription("The channel that you want to lock.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.GuildVoice,
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const channelOption = interaction.options.getChannel("channel")!;
  const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
  if (
    await errorCheck(
      "ManageRoles",
      { interaction, channel },
      { allErrors: false, botError: true, channelError: true },
      "Manage Roles",
    )
  )
    return;

  if (!channel.permissionsFor(guild.id)?.has("SendMessages"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "The channel is already locked.",
    });

  if (
    channel.type == ChannelType.GuildText &&
    ChannelType.PublicThread &&
    ChannelType.PrivateThread &&
    ChannelType.GuildVoice
  )
    channel.permissionOverwrites
      .create(guild.id, {
        SendMessages: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      })
      .catch(
        async error =>
          await errorEmbed({
            interaction,
            error,
            forward: true,
          }),
      );

  await modActionEmbed(
    {
      title: "Locked a channel.",
      body: [
        `**Moderator**: ${interaction.user.displayName}`,
        `**Channel**: ${channelOption ?? (await mention(channel.id, "CHANNEL"))}`,
      ],
    },
    guild,
    interaction,
  );
}
