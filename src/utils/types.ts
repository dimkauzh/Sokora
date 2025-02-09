import { ClientEvents } from "discord.js";

export type Event<K extends keyof ClientEvents> = (...args: ClientEvents[K]) => any;

export type ReplaceableStrings =
  | "(name)"
  | "(count)"
  | "(servername)"
  | "(serverowner)"
  | "(currentdate)";

export type Replacements = { text: ReplaceableStrings; replacement: string | number }[];
