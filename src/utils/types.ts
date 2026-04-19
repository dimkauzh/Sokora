import { ClientEvents } from "discord.js";

export type Event<K extends keyof ClientEvents> = (...args: ClientEvents[K]) => any;

export type ReplaceableStrings =
  | "(name)"
  | "(username)"
  | "(count)"
  | "(servername)"
  | "(serverowner)"
  | "(currentdate)"
  | "(currentdate, simple)"
  | "(currentdate, detailed)";

export type Replacements = { text: ReplaceableStrings; replacement: string | number }[];

export type Satisfies<K, T extends K> = T;
