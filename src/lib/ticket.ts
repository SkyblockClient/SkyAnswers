import { ChannelTypes, isTextChannel } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { Time } from "@sapphire/time-utilities";
import { Nullish, sleep } from "@sapphire/utilities";
import { TextChannel } from "discord.js";
import pMemoize from "p-memoize";
import { formatChannel } from "./logHelper.js";

export const plsBePatientTY =
  "Expect a response within the next day. Support Team has already been pinged.";

export async function setTicketOpen(channel: ChannelTypes, open: boolean) {
  const header = `${open ? "Opening" : "Closing"} ${formatChannel(channel)}`;
  if (!isTicket(channel)) {
    container.logger.warn(header, "Not a ticket");
    return;
  }

  const owner = await getTicketOwner(channel);
  if (owner) {
    container.logger.info(header, "for", owner);
    await channel.permissionOverwrites.edit(owner, { SendMessages: open });
  } else container.logger.warn(header, "Failed to find owner");
}

export const getTicketTop = pMemoize(
  async (ticket: ChannelTypes) => {
    if (!isTicket(ticket)) return;

    await sleep(Time.Second * 2);
    const msgs = await ticket.messages.fetch({ limit: 1, after: "0" });
    const msg = msgs.first();
    if (!msg || !msg.author.bot) return;
    return msg;
  },
  { cacheKey: ([channel]) => channel.id },
);

const mentionRegex = /<@!?(?<id>\d{17,20})>/;
export const getTicketOwner = pMemoize(
  async (ticket: ChannelTypes) => {
    if (!isTicket(ticket)) return;

    const pin = await getTicketTop(ticket);
    if (!pin) return;

    const contentMatch = pin.content.match(mentionRegex);
    if (contentMatch) return contentMatch[1];

    const embedMatch = pin.embeds[0]?.description?.match(mentionRegex);
    if (embedMatch) return embedMatch[1];

    return;
  },
  { cacheKey: ([channel]) => channel.id },
);

export function isTicket(
  channel: ChannelTypes | Nullish,
): channel is TextChannel {
  return (
    isTextChannel(channel) &&
    channel.name.startsWith("ticket-") &&
    channel.name != "ticket-logs" &&
    channel.name != "ticket-transcripts"
  );
}
