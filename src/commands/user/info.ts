import { calculateLevel, getUserXp, getXpForNextLevel } from "database/leveling";
import { getSetting } from "database/settings";
import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { colorize, Sokolors } from "utils/colorGen";
import { dotCheck } from "utils/dotCheck";
import { mention } from "utils/mention";
import { pluralOrNot } from "utils/pluralOrNot";
import { replace } from "utils/replace";
import { safeMember, safeMembers } from "utils/safeThings";

export const data = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Shows your (or another user's) info.")
  .addUserOption(user => user.setName("user").setDescription("Select the user."));

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  let user = interaction.options.getUser("user") ?? interaction.user;
  let avatar = user.displayAvatarURL();
  let name = user.displayName;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${dotCheck({ string: avatar, doubleSpace: true })}${name}`,
      iconURL: avatar,
    })
    .setFields({
      name: `<:discord:${replace("(discord)")}> • Discord info`,
      value: [
        `Username is **${user.username}**`,
        `Display name is ${
          user.displayName == user.username ? "*not there*" : `**${user.displayName}**`
        }`,
        `Created their account on **${mention(user.createdAt.valueOf(), "DEFAULT_TIMESTAMP")}**`,
      ].join("\n"),
    })
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(await colorize({ user, avatar, hue: Sokolors.Blue }));

  if ((await safeMembers(guild)).has(user.id)) {
    const target = await safeMember(guild, user.id);
    avatar = target.displayAvatarURL();
    name = target.nickname ?? name;
    user = target.user;

    const serverInfo = [
      `Joined this server on **${mention(target.joinedAt!.valueOf(), "DEFAULT_TIMESTAMP")}**`,
    ];
    const guildRoles = guild.roles.cache.filter(role => target.roles.cache.has(role.id))!;
    const memberRoles = [...guildRoles].sort(
      (role1, role2) => role2[1].position - role1[1].position,
    );
    memberRoles.pop();
    const rolesLength = memberRoles.length;
    const xp = getUserXp(guild.id, target.id);
    const nextLevelXp = await getXpForNextLevel(guild.id, user.id);
    const difficulty = (await getSetting(guild.id, "leveling", "difficulty")) as number;
    const level = calculateLevel({ difficulty, xp });

    if (target.premiumSinceTimestamp)
      serverInfo.push(
        `Boosting since **${mention(target.premiumSinceTimestamp, "DEFAULT_TIMESTAMP")}**`,
      );

    if ((await getSetting(`${guild.id}`, "leveling", "enabled")) && !user.bot)
      serverInfo.push(
        `Level **${level}** • ${xp && xp > 0 ? `**${xp.toLocaleString("en-US")}**/*${nextLevelXp.toLocaleString("en-US")} (level ${level + 1})* XP` : "**No** XP!"}`,
      );

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

    embed.addFields({ name: "📒 • Server info", value: serverInfo.join("\n") });
  }

  await interaction.reply({ embeds: [embed] });
}
