import { container } from "@sapphire/framework";
import {
  OverwriteType,
  GuildChannel,
  TextBasedChannel,
  Message,
  TextChannel,
  Channel,
  BaseChannel,
} from "discord.js";

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

const topCache: Record<string, Message<true> | null> = {};
export async function getTicketTop(ticket: TextBasedChannel) {
  if (topCache[ticket.id]) return topCache[ticket.id] || undefined;
  const ret = await _getTop(ticket);
  topCache[ticket.id] = ret || null;
  return ret;
}

async function _getTop(ticket: TextBasedChannel) {
  if (!isTicket(ticket)) return;

  const msgs = await ticket.messages.fetch({ limit: 1, after: "0" });
  const msg = msgs.first();
  if (msg && msg.author.bot) return msg;

  return;
}

const ownerCache: Record<string, string | null> = {};
export async function getTicketOwner(ticket: TextBasedChannel) {
  if (ownerCache[ticket.id]) return ownerCache[ticket.id] || undefined;
  const ret = await _getOwner(ticket);
  ownerCache[ticket.id] = ret || null;
  return ret;
}

const mentionRegex = /<@!?(?<id>\d{17,20})>/;
async function _getOwner(ticket: TextBasedChannel) {
  if (!isTicket(ticket)) return;

  const pin = await getTicketTop(ticket);
  if (!pin) return;

  const contentMatch = pin.content.match(mentionRegex);
  if (contentMatch) return contentMatch[1];

  const embedMatch = pin.embeds[0]?.description?.match(mentionRegex);
  if (embedMatch) return embedMatch[1];

  return;
}

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
