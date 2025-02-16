import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { pluralOrNot } from "../../utils/pluralOrNot";
import { modActionEmbed } from "../../utils/embeds/modActionEmbed";
import { mention } from "../../utils/mention";

export const data = new SlashCommandSubcommandBuilder()
  .setName("clear")
  .setDescription("Clears messages.")
  .addNumberOption(number =>
    number
      .setName("amount")
      .setDescription("The amount of messages that you want to clear (maximum is 100).")
      .setRequired(true),
  )
  .addChannelOption(channel =>
    channel
      .setName("channel")
      .setDescription("The channel that has the messages that you want to clear.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.GuildVoice,
      ),
  )
  .addUserOption(user =>
    user.setName("user").setDescription("Only clear messages from this specific user"),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageMessages"))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      "You need the **Manage Messages** permission.",
    );

  const amount = interaction.options.getNumber("amount")!;
  if (amount > 100)
    return await errorEmbed(interaction, "You can only clear up to 100 messages at a time.");

  if (amount < 1) return await errorEmbed(interaction, "You must clear at least 1 message.");

  const channelOption = interaction.options.getChannel("channel")!;
  const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
  const targetUser = interaction.options.getUser("user");

  let deletedAmount = 0;
  if (
    channel.type == ChannelType.GuildText ||
    channel.type == ChannelType.PublicThread ||
    channel.type == ChannelType.PrivateThread ||
    channel.type == ChannelType.GuildVoice
  ) {
    try {
      if (targetUser) {
        const messages = await channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(m => m.author.id === targetUser.id).first(amount);

        if (userMessages.length == 0)
          return await errorEmbed(
            interaction,
            "No messages found",
            "No messages from this user were found in the recent history.",
          );

        await channel.bulkDelete(userMessages, true);
        deletedAmount = userMessages.length;
      } else {
        await channel.bulkDelete(amount, true);
        deletedAmount = amount;
      }
    } catch (error) {
      console.error(error);
      return await errorEmbed(
        interaction,
        "Error",
        "An error occurred while trying to delete messages.",
      );
    }
  }

  await modActionEmbed(
    `Cleared ${deletedAmount} ${pluralOrNot("message", deletedAmount)}.`,
    [
      `**Moderator**: ${interaction.user.displayName}`,
      `**Channel**: ${channelOption ?? mention(channel.id, "CHANNEL")}`,
      targetUser ? `**Target User**: ${targetUser.displayName}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    guild,
    interaction,
  );
}
