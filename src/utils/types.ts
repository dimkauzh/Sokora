import { ClientEvents } from "discord.js";

export type Event<K extends keyof ClientEvents> = (...args: ClientEvents[K]) => any;
