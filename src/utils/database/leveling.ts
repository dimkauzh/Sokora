import { kominator } from "utils/kominator";
import { getDatabase } from ".";
import { dekominator } from "../kominator";
import { getSetting, setSetting } from "./settings";
import { TableDefinition, TypeOfDefinition } from "./types";

const tableDefinition = {
  name: "leveling",
  definition: {
    guild: "TEXT",
    user: "TEXT",
    xp: "INTEGER",
  },
} satisfies TableDefinition;

const database = getDatabase(tableDefinition);
const getQuery = database.query("SELECT * FROM leveling WHERE guild = $1 AND user = $2;");
const deleteQuery = database.query("DELETE FROM leveling WHERE guild = $1 AND user = $2;");
const insertQuery = database.query("INSERT INTO leveling (guild, user, xp) VALUES (?1, ?2, ?3);");
const getGuildQuery = database.query("SELECT * FROM leveling WHERE guild = $1;");

export function getUserXp(guildID: string, userID: string): number {
  const res = getQuery.all(guildID, userID) as TypeOfDefinition<typeof tableDefinition>[];
  if (!res.length) return 0;
  return res[0].xp;
}

export function setUserXp(guildID: string | number, userID: string, xp: number) {
  if (getQuery.all(guildID, userID).length) deleteQuery.run(guildID, userID);
  insertQuery.run(guildID, userID, xp);
}

export async function getGuildLeaderboard(
  guildID: string,
): Promise<{ guild: string; user: string; xp: number; level: number }[]> {
  const xpData = getGuildQuery.all(guildID) as TypeOfDefinition<typeof tableDefinition>[];
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

type LevelReward = { id: string; level: number; channel: boolean };

export async function getLevelRewards(guildID: string): Promise<LevelReward[] | null> {
  const content = await getSetting(guildID, "leveling", "rewards");
  if (!content || typeof content !== "string") return null;
  return kominator(content).map(s => {
    const channel = s.includes("#");
    const [level, id] = s.split(channel ? "#" : "@");
    return { level: Number(level), id, channel };
  });
}

export async function addLevelRewards(guildID: string, rewards: LevelReward[]): Promise<void> {
  const encodedRewards = dekominator(
    rewards.map(reward => `${reward.level}${reward.channel ? "#" : "@"}${reward.id}`),
  );
  const content = await getSetting(guildID, "leveling", "rewards");
  if (!content || typeof content !== "string")
    setSetting(guildID, "leveling", "rewards", encodedRewards);
  else setSetting(guildID, "leveling", "rewards", dekominator([...encodedRewards, ...content]));
}

export async function removeLevelRewards(guildID: string, rewards: LevelReward[]): Promise<void> {
  const encodedRewards = rewards.map(
    reward => `${reward.level}${reward.channel ? "#" : "@"}${reward.id}`,
  );
  const content = await getSetting(guildID, "leveling", "rewards");
  if (!content || typeof content !== "string") return;
  const newRewards = [];
  for (const reward of kominator(content))
    if (!encodedRewards.includes(reward)) newRewards.push(reward);

  setSetting(guildID, "leveling", "rewards", dekominator(newRewards));
}
