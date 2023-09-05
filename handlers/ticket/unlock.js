import { ChannelType } from "discord.js";
import { setTicketOpen } from "./start.js";

/**
 * @param {import("../../bot.js").MessageData} message
 */
export const command = async ({ channel, respond }) => {
  if (
    !channel.name.startsWith("ticket-") ||
    channel.type != ChannelType.GuildText
  )
    return;
  await setTicketOpen(channel, true);
  await respond({ content: "ticket opened (in theory)" });
};
export const when = {
  starts: ["sky unlock"],
  desc: "Makes the person who made a ticket have send message perms",
  input: false,
};
