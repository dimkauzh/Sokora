import {
  EmbedBuilder,
  type MessageReaction,
  type PartialMessageReaction,
  type PartialUser,
  type User,
} from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { getStarred, setStarred } from "../utils/database/starboard";
import { Event } from "../utils/types";

export default (async function run(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
) {
  console.log("🌟 Reaction Add Event Triggered");
  console.log(`Reaction emoji: ${reaction.emoji.name}`);
  console.log(`User: ${user.tag}`);

  if (reaction.partial)
    await reaction.fetch().catch(error => console.error(`Error fetching reaction: ${error}`));

  const message = await reaction.message.fetch();
  if (!message.guild) return console.log("No guild found, returning");

  const starEmoji = (getSetting(message.guild.id, "starboard", "emoji") as string) || "⭐";
  if (reaction.emoji.name != starEmoji)
    return console.log("Emoji does not match configured star emoji, returning");

  if (!getSetting(message.guild.id, "starboard", "enabled") as boolean)
    return console.log("Starboard not enabled, returning");

  if (!message.content && !message.attachments.size)
    return console.log("No content or attachments, returning");

  const starboardChannelId = getSetting(message.guild.id, "starboard", "channel") as string;
  console.log("Starboard channel ID:", starboardChannelId);

  if (!starboardChannelId) return console.log("No starboard channel configured, returning");
  const starboardChannel = message.guild.channels.cache.get(starboardChannelId);
  console.log("Found starboard channel:", starboardChannel?.name);

  if (!starboardChannel?.isTextBased())
    return console.log("Starboard channel not text-based or not found, returning");

  const starCount = reaction.count || 0;
  const threshold = parseInt(getSetting(message.guild.id, "starboard", "threshold") as string) || 3;
  if (starCount < threshold) return console.log("Star count below threshold, returning");

  const existingStarred = getStarred(message.guild.id, message.id);
  console.log("Existing starred message:", getStarred(message.guild.id, message.id) ? "yes" : "no");

  const embed = new EmbedBuilder()
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL(),
    })
    .setDescription(message.content || "")
    .addFields({
      name: "Source",
      value: `[Jump to message](${message.url})`,
    })
    .setTimestamp(message.createdAt)
    .setFooter({ text: `ID: ${message.id}` })
    .setColor(genColor(80));

  const attachment = message.attachments.first();
  if (attachment?.contentType?.startsWith("image/")) embed.setImage(attachment.url);

  const starText = `${starEmoji} ${starCount}`;
  try {
    if (!existingStarred) {
      console.log("Creating new starred message");
      const starMessage = await starboardChannel.send({ content: starText, embeds: [embed] });

      setStarred(
        message.guild.id,
        message.id,
        message.channel.id,
        message.author.id,
        starMessage.id,
        starCount,
        message.content || "",
        message.createdTimestamp.toString(),
      );
      return console.log("Successfully created new starred message");
    }

    console.log("Updating existing starred message");
    const [channelId, , starMessageId, , ,] = existingStarred;
    const starboardMessage = await starboardChannel.messages.fetch(starMessageId);
    await starboardMessage.edit({ content: starText, embeds: [embed] });

    setStarred(
      message.guild.id,
      message.id,
      channelId,
      message.author.id,
      starMessageId,
      starCount,
      message.content || "",
      message.createdTimestamp.toString(),
    );
    console.log("Successfully updated starred message");
  } catch (error) {
    console.error("Error handling starboard message:", error);
  }
} as Event<"messageReactionAdd">);
