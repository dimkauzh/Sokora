import {
  ChannelType,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck } from "embeds/modEmbed";
import { genColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { mention } from "utils/mention";
import { pluralOrNot } from "utils/pluralOrNot";

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
        ChannelType.GuildStageVoice,
      ),
  )
  .addUserOption(user =>
    user.setName("user").setDescription("Only clear messages from this specific user."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const channelOption = interaction.options.getChannel("channel")!;
  const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;

  if (
    await errorCheck(
      "ManageMessages",
      { interaction, channel: channel.id },
      { allErrors: false, botError: true, channelError: true },
      "Manage Messages",
    )
  )
    return;

  const amount = interaction.options.getNumber("amount")!;
  if (amount > 100)
    return await errorEmbed({
      interaction,
      title: "You can only clear up to 100 messages at a time.",
    });

  if (amount < 1)
    return await errorEmbed({ interaction, title: "You must clear at least 1 message." });

  const targetUser = interaction.options.getUser("user");
  let deletedAmount = 0;
  if (
    !(
      channel.type == ChannelType.GuildText ||
      channel.type == ChannelType.PublicThread ||
      channel.type == ChannelType.PrivateThread ||
      channel.type == ChannelType.GuildVoice ||
      channel.type == ChannelType.GuildStageVoice
    )
  )
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can't have messages to clear.",
    });

  try {
    if (targetUser) {
      const userMessages = (await channel.messages.fetch({ limit: 100 }))
        .filter(m => m.author.id == targetUser.id)
        .first(amount);

      if (userMessages.length == 0)
        return await errorEmbed({
          interaction,
          title: "No messages found.",
          reason: "No messages from this user were found in the recent history.",
        });

      await channel.bulkDelete(userMessages, true);
      deletedAmount = userMessages.length;
    } else {
      await channel
        .bulkDelete(amount, true)
        .then(async messages => (deletedAmount = messages.size));

      if (deletedAmount == 0)
        return await errorEmbed({
          interaction,
          title: "No messages found.",
          reason: "No messages were found in the recent history.",
        });
    }
  } catch (error) {
    return await errorEmbed({
      interaction,
      error,
      forward: true,
    });
  }

  const user = interaction.user;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}Cleared ${deletedAmount} ${pluralOrNot("message", deletedAmount)}`,
      iconURL: avatar,
    })
    .setDescription(
      [`**Moderator**: ${user.username}`, `**Channel**: ${mention(channel.id, "CHANNEL")}`]
        .filter(Boolean)
        .join("\n"),
    )
    .setTimestamp(new Date())
    .setFooter({ text: `Channel ID: ${channel.id}` })
    .setColor(genColor(0));

  await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
}
