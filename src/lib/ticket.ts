import { ChannelTypes, isTextChannel } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { Time } from "@sapphire/time-utilities";
import { Nullish } from "@sapphire/utilities";
import { TextChannel } from "discord.js";
import pMemoize from "p-memoize";
import pRetry from "p-retry";

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

    try {
      return await pRetry(
        async () => {
          const msgs = await ticket.messages.fetch({ limit: 1, after: "0" });
          const msg = msgs.first();
          if (!msg) throw "no msg";
          if (!msg.author.bot) return;
          return msg;
        },
        {
          minTimeout: Time.Second * 1,
          retries: 3,
        },
      );
    } catch (e) {
      container.logger.error(
        "Failed to get ticket top",
        `#${ticket.name} (${ticket.id})`,
        e,
      );
      return;
    }
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
