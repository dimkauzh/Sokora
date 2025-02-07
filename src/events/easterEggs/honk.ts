import type { Message, TextChannel } from "discord.js";

export async function run(message: Message) {
  const honks = ["hnok", "hokn", "hkon", "onk", "hon", "honhk", "hhonk", "honkk"];
  if (!honks.includes(message.content.toLowerCase().trim())) return;
  (message.channel as TextChannel).send("https://tenor.com/bW8sm.gif");
}
