import { OverwriteType, GuildChannel, TextBasedChannel } from 'discord.js';

export const plsBePatientTY = 'Expect a response within the next day. Support Team has already been pinged.';

export async function setTicketOpen(channel: GuildChannel, open: boolean) {
	const perms = Array.from(channel.permissionOverwrites.cache.values());
	const creator = perms.find(
		(perm) => perm.type == OverwriteType.Member && perm.allow.equals(open ? 1024n : 3072n) && perm.deny.equals(open ? 2048n : 0n)
	);
	console.log(open ? 'opening' : 'closing', `#${channel.name} (${channel.id})`, 'for', creator);
	if (creator) {
		await channel.permissionOverwrites.edit(creator.id, { SendMessages: open });
	} else console.warn(`While ${open ? 'opening' : 'closing'} ticket, failed to find member in`, perms);
}

const mentionRegex = /<@!?(?<id>\d{17,20})>/;
const ownerCache: Record<string, string | null> = {};
export async function getOwnerPin(ticket: TextBasedChannel) {
	const pins = await ticket.messages.fetchPinned();
	return pins.filter((message) => message.author.bot).find((v) => mentionRegex.test(v.content));
}
export async function getTicketOwner(ticket: TextBasedChannel) {
	if (ownerCache[ticket.id]) return ownerCache[ticket.id];

	const pin = await getOwnerPin(ticket);
	const owner = pin?.content.match(mentionRegex)?.at(1);
	ownerCache[ticket.id] = owner || null;
	return owner;
}
