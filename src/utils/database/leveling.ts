import { sql } from "bun";
import { dekominator } from "../kominator";
import { getSetting, setSetting } from "./settings";
import { LevelReward, TableDefinition, TypeOfDefinition } from "./types";

const def = {
  name: "leveling",
  definition: {
    guild: "TEXT",
    userID: "TEXT",
    xp: "INTEGER",
  },
} satisfies TableDefinition;

await sql`CREATE TABLE IF NOT EXISTS leveling (guild TEXT, userID TEXT, xp INTEGER);`;
const getQuery = sql`SELECT * FROM leveling WHERE guild = $1 AND userID = $2;`;
const getGuildQuery = sql`SELECT * FROM leveling WHERE guild = $1;`;
const deleteQuery = sql`DELETE FROM leveling WHERE guild = $1 AND userID = $2;`;
const insertQuery = sql`INSERT INTO leveling (guild, userID, xp) VALUES (?1, ?2, ?3);`;

export function getUserXp(guildID: string, userID: string): number {
  const res = getQuery.all(guildID, userID) as TypeOfDefinition<typeof def>[];
  if (!res.length) return 0;
  return res[0].xp;
}

export function setUserXp(guildID: string | number, userID: string, xp: number) {
  if (getQuery.all(guildID, userID).length) deleteQuery.run(guildID, userID);
  insertQuery.run(guildID, userID, xp);
}

export async function getGuildLeaderboard(
  guildID: string,
): Promise<{ guild: string; userID: string; xp: number; level: number }[]> {
  const xpData = getGuildQuery.all(guildID) as TypeOfDefinition<typeof def>[];
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
  return formula(difficulty, calculateLevel({ difficulty, xp: getUserXp(guildID, userID) }) + 1);
}

export async function getXpForCurrentLevel(guildID: string, userID: string): Promise<number> {
  const difficulty = (await getSetting(guildID, "leveling", "difficulty")) as number;
  return formula(difficulty, calculateLevel({ difficulty, xp: getUserXp(guildID, userID) }));
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
  if (!content) return setSetting(guildID, "leveling", "rewards", encodedRewards);

  return setSetting(guildID, "leveling", "rewards", dekominator([...encodedRewards, ...content]));
}

export async function removeLevelRewards(guildID: string, rewards: LevelReward[]): Promise<void> {
  const encodedRewards = rewards.map(
    reward => `${reward.level}${reward.channel ? "#" : "@"}${reward.id}`,
  );
  const content = (await getSetting(guildID, "leveling", "rewards")) as string[];
  if (!content) return;
  const newRewards = [];
  for (const reward of content) if (!encodedRewards.includes(reward)) newRewards.push(reward);

  return setSetting(guildID, "leveling", "rewards", dekominator(newRewards));
}
