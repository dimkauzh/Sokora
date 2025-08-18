import type { Message, TextChannel } from "discord.js";

export async function run(message: Message) {
  if (!message.content.trim().toLowerCase().includes("bread")) return;

  if (Math.round(Math.random() * 100) <= 0.25)
    await (message.channel as TextChannel).send("https://tenor.com/bOMAb.gif");
  else {
    if (!message.guild?.members.cache.get(message.client.user.id)?.permissions.has("AddReactions"))
      return;

    for (const i of "🍞🇧🇷🇪🇦🇩👍") {
      if (typeof i == "object") {
        await message.react(i);
        continue;
      }
      for (const reaction of i) if (reaction != " ") await message.react(reaction);
    }
  }
}
