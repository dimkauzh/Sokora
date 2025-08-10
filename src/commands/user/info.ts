import { getLevel } from "database/leveling";
import { getSetting } from "database/settings";
import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor, genImageColor } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { mention } from "utils/mention";
import { pluralOrNot } from "utils/pluralOrNot";
import { emojis } from "utils/constants";

export const data = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Shows your (or another user's) info.")
  .addUserOption(user => user.setName("user").setDescription("Select the user."));

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const user = interaction.options.getUser("user") ?? interaction.user;
  const target = guild.members.cache.get(user.id);
  const avatar = target?.displayAvatarURL() ?? user.displayAvatarURL();
  const embedColor =
    (await target?.user.fetch())?.hexAccentColor ??
    (await genImageColor(undefined, avatar)) ??
    genColor(200);

  if (!target) return;
  const serverInfo = [`Joined on **<t:${Math.round(target.joinedAt!.valueOf()! / 1000)}:D>**`];
  const guildRoles = guild.roles.cache.filter(role => target.roles.cache.has(role.id))!;
  const memberRoles = [...guildRoles].sort((role1, role2) => role2[1].position - role1[1].position);
  memberRoles.pop();
  const rolesLength = memberRoles.length;

  if (target.premiumSinceTimestamp)
    serverInfo.push(`Boosting since **<t:${target.premiumSinceTimestamp}:D>**`);

  if (memberRoles.length)
    serverInfo.push(
      `**${guildRoles.filter(role => target.roles.cache.has(role.id)).size! - 1}** ${pluralOrNot(
        "role",
        memberRoles.length,
      )} • ${memberRoles
        .slice(0, 3)
        .map(role => mention(role[1].id, "ROLE"))
        .join(" • ")}${rolesLength > 3 ? ` and **${rolesLength - 3}** more` : ""}`,
    );

  const enabled = await getSetting(`${guild.id}`, "leveling", "enabled");
  const difficulty = (await getSetting(guild.id, "leveling", "difficulty")) as number;
  const [level, xp] = getLevel(guild.id, target.id);
  const nextLevelXp = Math.floor(
    100 * difficulty * (level + 1) ** 2 - 80 * difficulty * level ** 2,
  )?.toLocaleString("en-US");

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${target?.nickname ?? user.displayName}`,
      iconURL: avatar,
    })
    .setFields({
      name: `<:discord:${emojis.discord}> • Discord info`,
      value: [
        `Username is **${user.username}**`,
        `Display name is ${
          user.displayName == user.username ? "*not there*" : `**${user.displayName}**`
        }`,
        `Created on **<t:${Math.round(user.createdAt.valueOf() / 1000)}:D>**`,
      ].join("\n"),
      inline: true,
    })
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(embedColor);

  if (enabled && !user.bot)
    embed.addFields({
      name: `⚡ • Level ${level}`,
      value: [
        xp && xp > 0
          ? `**${xp.toLocaleString("en-US")}/${nextLevelXp}** XP`
          : `**No XP** out of **${nextLevelXp}** XP!`,
        `The next level is **${level + 1}**`,
      ].join("\n"),
      inline: true,
    });

  embed.addFields({
    name: "📒 • Server info",
    value: serverInfo.join("\n"),
  });

  await interaction.reply({ embeds: [embed] });
}
