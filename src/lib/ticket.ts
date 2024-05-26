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
  console.log(
    open ? "opening" : "closing",
    `#${channel.name} (${channel.id})`,
    "for",
    creator,
  );
  if (creator) {
    await channel.permissionOverwrites.edit(creator.id, { SendMessages: open });
  } else
    console.warn(
      `While ${open ? "opening" : "closing"} ticket, failed to find member in`,
      perms,
    );
}

const mentionRegex = /<@!?(?<id>\d{17,20})>/;
const ownerPinCache: Record<string, Message | null> = {};
export async function getTicketTop(
  ticket: TextBasedChannel,
): Promise<Message | undefined> {
  if (!isTicket(ticket)) return;
  if (ownerPinCache[ticket.id]) return ownerPinCache[ticket.id] || undefined;

  const msgs = await ticket.messages.fetch({ limit: 1, after: "0" });
  const msg = msgs.first();
  let pin: Message<true> | undefined;
  if (msg && msg.author.bot) pin = msg;
  ownerPinCache[ticket.id] = pin || null;
  return pin;
}
export async function getTicketOwner(
  ticket: TextBasedChannel,
): Promise<string | undefined> {
  if (!isTicket(ticket)) return;

  const pin = await getTicketTop(ticket);
  if (!pin) return;

  const contentMatch = pin.content.match(mentionRegex);
  const embedMatch = pin.embeds[0]?.description?.match(mentionRegex);
  if (contentMatch) return contentMatch[1];
  else if (embedMatch) return embedMatch[1];
  else return;
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
