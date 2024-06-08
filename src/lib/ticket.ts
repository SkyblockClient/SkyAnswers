import { ChannelTypes, isTextChannel } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { Time } from "@sapphire/time-utilities";
import { Nullish, sleep } from "@sapphire/utilities";
import { TextChannel } from "discord.js";
import pMemoize from "p-memoize";

export const plsBePatientTY =
  "Expect a response within the next day. Support Team has already been pinged.";

export async function setTicketOpen(channel: ChannelTypes, open: boolean) {
  if (!isTicket(channel)) return;

  const owner = await getTicketOwner(channel);
  container.logger.info(
    open ? "Opening" : "Closing",
    `#${channel.name} (${channel.id})`,
    `for ${owner}`,
  );
  if (owner)
    await channel.permissionOverwrites.edit(owner, { SendMessages: open });
  else container.logger.warn(`Failed to find owner`);
}

export const getTicketTop = pMemoize(
  async (ticket: ChannelTypes) => {
    if (!isTicket(ticket)) return;

    let msgs = await ticket.messages.fetch({ limit: 1, after: "0" });
    let msg = msgs.first();
    if (!msg) {
      await sleep(Time.Second);
      msgs = await ticket.messages.fetch({ limit: 1, after: "0" });
      msg = msgs.first();
      if (!msg) return;
    }
    if (!msg.author.bot) return;
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
