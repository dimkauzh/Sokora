import type { Message, TextChannel } from "discord.js";

export async function run(message: Message) {
  if (
    !["sokodunk", "sokodunk!", "sike", "sike!", "sokoballing", "sokoballer", "sokoballer!"].includes(
      message.content.trim().toLowerCase(),
    )
  )
    return;

  await (message.channel as TextChannel).send(
    "https://tenor.com/view/sokora-dunk-ice-skate-ice-dunk-balling-gif-7665972654807661282?quality=lossless",
  );
}
