// todo: apply this
import {
  NewsChannel,
  StageChannel,
  TextChannel,
  ThreadChannel,
  VoiceChannel,
  type Channel,
} from "discord.js";

export function isTextable(channel: Channel, voice?: boolean, thread?: boolean) {
  if (channel instanceof TextChannel || channel instanceof NewsChannel) return channel;

  if (voice) if (channel instanceof VoiceChannel || channel instanceof StageChannel) return channel;
  if (thread) if (channel instanceof ThreadChannel) return channel;
}
