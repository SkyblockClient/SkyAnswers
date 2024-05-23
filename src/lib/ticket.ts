import {
  OverwriteType,
  GuildChannel,
  TextBasedChannel,
  Message,
  TextChannel,
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
export async function getOwnerPin(
  ticket: TextBasedChannel,
): Promise<Message | undefined> {
  if (!(ticket instanceof TextChannel)) return;
  if (!ticket.name.startsWith("ticket-")) return;
  if (ownerPinCache[ticket.id]) return ownerPinCache[ticket.id] || undefined;

  const pins = await ticket.messages.fetchPinned();
  const pin = pins
    .filter((message) => message.author.bot)
    .find((v) => mentionRegex.test(v.content));
  ownerPinCache[ticket.id] = pin || null;
  return pin;
}
export async function getTicketOwner(
  ticket: TextBasedChannel,
): Promise<string | undefined> {
  if (!(ticket instanceof TextChannel)) return;
  if (!ticket.name.startsWith("ticket-")) return;

  const pin = await getOwnerPin(ticket);
  return pin?.content.match(mentionRegex)?.at(1);
}
