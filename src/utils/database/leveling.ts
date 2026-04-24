import { Satisfies } from "utils/types";
import { db, values } from ".";
import { dekominator } from "../kominator";
import { getSetting, setSetting } from "./settings";
import { LevelReward, TableDefinition, TypeOfDefinition } from "./types";

type Def = Satisfies<
  TableDefinition,
  {
    name: "leveling";
    definition: {
      guild: "TEXT";
      userID: "TEXT";
      xp: "INTEGER";
    };
  }
>;

const getQuery = async (guild: string | number, userID: string) =>
  values(await db`SELECT * FROM leveling WHERE "guild" = ${guild} AND "userID" = ${userID};`);

export async function getUserXp(guildID: string, userID: string): Promise<number> {
  const res = (await getQuery(guildID, userID)) as TypeOfDefinition<Def>[];
  if (!res.length) return 0;
  return res[0].xp;
}

export async function setUserXp(guildID: string | number, userID: string, xp: number) {
  await db.begin(async tx => {
    await tx`DELETE FROM leveling WHERE "guild" = ${guildID} AND "userID" = ${userID};`;
    await tx`INSERT INTO leveling ("guild", "userID", "xp") VALUES (${guildID}, ${userID}, ${xp});`;
  });
}

export async function getGuildLeaderboard(
  guildID: string,
): Promise<{ guild: string; userID: string; xp: number; level: number }[]> {
  const xpData = values(
    await db`SELECT * FROM leveling WHERE "guild" = ${guildID};`,
  ) as TypeOfDefinition<Def>[];

  const difficulty = (await getSetting(guildID, "leveling", "difficulty")) as number;
  return xpData.map(x => {
    return { ...x, level: calculateLevel({ xp: x.xp, difficulty }) };
  });
}

const formula = (difficulty: number, level: number) =>
  difficulty * (20 * level ** 2 + 200 * level + 100);

export function calculateLevel(arg: { difficulty: number; xp: number }) {
  const { difficulty, xp } = arg;
  let level = 0;
  let baseXp = 0;
  while (baseXp <= xp) {
    level++;
    baseXp = formula(difficulty, level + 1);
  }

  return level;
}

export async function getXpForNextLevel(guildID: string, userID: string): Promise<number> {
  const difficulty = (await getSetting(guildID, "leveling", "difficulty")) as number;
  return formula(
    difficulty,
    calculateLevel({ difficulty, xp: await getUserXp(guildID, userID) }) + 1,
  );
}

export async function getLevelRewards(guildID: string): Promise<LevelReward[] | null> {
  const content = (await getSetting(guildID, "leveling", "rewards")) as string[];
  if (!content) return null;
  return content.map(s => {
    const channel = s.includes("#");
    const [level, id] = s.split(channel ? "#" : "@");
    return { level: Number(level), id, channel };
  });
}

export async function addLevelRewards(guildID: string, rewards: LevelReward[]): Promise<void> {
  const encodedRewards = dekominator(
    rewards.map(reward => `${reward.level}${reward.channel ? "#" : "@"}${reward.id}`),
  );
  const content = (await getSetting(guildID, "leveling", "rewards")) as string[];
  if (!content) return await setSetting(guildID, "leveling", "rewards", encodedRewards);

  return await setSetting(
    guildID,
    "leveling",
    "rewards",
    dekominator([...encodedRewards, ...content]),
  );
}

export async function removeLevelRewards(guildID: string, rewards: LevelReward[]): Promise<void> {
  const encodedRewards = rewards.map(
    reward => `${reward.level}${reward.channel ? "#" : "@"}${reward.id}`,
  );
  const content = (await getSetting(guildID, "leveling", "rewards")) as string[];
  if (!content) return;
  const newRewards = [];
  for (const reward of content) if (!encodedRewards.includes(reward)) newRewards.push(reward);

  return await setSetting(guildID, "leveling", "rewards", dekominator(newRewards));
}
