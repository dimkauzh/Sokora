import { Message } from "discord.js";

export const deletedMsgs: Map<
  string,
  Set<{ senderId: string; execId: string; date: number; content: string; delMsg: Message | null }>
> = new Map();

export const emojis = {
  leftArrow: "1298708251256291379",
  rightArrow: "1298708281493160029",
  discord: "1266797021126459423",
};
