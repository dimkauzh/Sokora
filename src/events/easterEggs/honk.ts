import type { Message, TextChannel } from "discord.js";

export async function run(message: Message) {
  const honks = ["hnok", "hokn", "hkon", "onk", "hon", "honhk", "hhonk", "honkk", "honk"]; // there is no reason why honk can't be part of this list, stop discrimination smh
  if (!honks.includes(message.content.trim().toLowerCase())) return;
  (message.channel as TextChannel).send("https://tenor.com/bW8sm.gif");
}
