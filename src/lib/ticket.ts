import { container } from "@sapphire/framework";
import {
  OverwriteType,
  GuildChannel,
  TextBasedChannel,
  TextChannel,
  Channel,
  BaseChannel,
} from "discord.js";
import pMemoize from "p-memoize";

export const plsBePatientTY =
  "Expect a response within the next day. Support Team has already been pinged.";

export async function setTicketOpen(channel: GuildChannel, open: boolean) {
  const perms = Array.from(channel.permissionOverwrites.cache.values());
  const creator = perms.find(
    (perm) =>
      perm.type == OverwriteType.Member &&
      perm.allow.equals(open ? 1024n : 3072n) &&
      perm.deny.equals(open ? 2048n : 0n),
  );
  container.logger.info(
    open ? "opening" : "closing",
    `#${channel.name} (${channel.id})`,
    "for",
    creator,
  );
  if (creator) {
    await channel.permissionOverwrites.edit(creator.id, { SendMessages: open });
  } else
    container.logger.warn(
      `While ${open ? "opening" : "closing"} ticket, failed to find member in`,
      perms,
    );
}

export const getTicketTop = pMemoize(
  async (ticket: TextBasedChannel) => {
    if (!isTicket(ticket)) return;

    const msgs = await ticket.messages.fetch({ limit: 1, after: "0" });
    const msg = msgs.first();
    if (msg && msg.author.bot) return msg;

    return;
  },
  { cacheKey: ([channel]) => channel.id },
);

const mentionRegex = /<@!?(?<id>\d{17,20})>/;
export const getTicketOwner = pMemoize(
  async (ticket: TextBasedChannel) => {
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
  channel: BaseChannel | Channel | null,
): channel is TextChannel {
  return (
    channel instanceof TextChannel &&
    channel.name.startsWith("ticket-") &&
    channel.name != "ticket-logs" &&
    channel.name != "ticket-transcripts"
  );
}
