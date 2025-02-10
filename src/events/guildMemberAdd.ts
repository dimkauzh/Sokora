import { EmbedBuilder, type TextChannel } from "discord.js";
import { genColor } from "../utils/colorGen";
import { getSetting } from "../utils/database/settings";
import { imageColor } from "../utils/imageColor";
import { replaceCodes } from "../utils/replace";
import { Event } from "../utils/types";

export default (async function run(member) {
  const guildID = member.guild.id;
  const id = getSetting(guildID, "welcome", "channel") as string;
  const user = member.user;
  const avatar = member.displayAvatarURL();

  let embed = new EmbedBuilder()
    .setAuthor({ name: `•  ${user.displayName} has joined.`, iconURL: avatar })
    .setFooter({ text: `User ID: ${member.id}` })
    .setThumbnail(avatar)
    .setColor(member.user.hexAccentColor ?? (await imageColor(undefined, avatar)) ?? genColor(200));

  if (id) {
    const channel = (await member.guild.channels.cache
      .find(channel => channel.id == id)
      ?.fetch()) as TextChannel;

    embed.setDescription(
      await replaceCodes(
        getSetting(guildID, "welcome", "join_text") as string,
        member.guild,
        member.user,
      ),
    );
    await channel.send({ embeds: [embed] });
  }

  if (!getSetting(guildID, "welcome", "join_dm") as boolean) return;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel) return;
  if (user.bot) return;

  embed.setDescription(
    await replaceCodes(
      getSetting(guildID, "welcome", "dm_text") as string,
      member.guild,
      member.user,
    ),
  );
  try {
    await dmChannel.send({ embeds: [embed] }).catch(() => null);
  } catch (e) {
    return console.error(e);
  }
} as Event<"guildMemberAdd">);
