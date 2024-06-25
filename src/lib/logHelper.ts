import { ChannelTypes, isDMChannel } from "@sapphire/discord.js-utilities";
import { User } from "discord.js";

export function formatChannel(channel: ChannelTypes): string {
  const name = isDMChannel(channel) ? "DM" : `#${channel.name}`;
  return `${name} (${channel.id})`;
}

export const formatUser = (user: User): string => `${user.tag} (${user.id})`;
