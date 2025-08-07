import { Message } from "discord.js";

export const deletedMsgs: Map<
  string,
  Set<{ senderId: string; execId: string; date: number; content: string; delMsg: Message | null }>
> = new Map();
