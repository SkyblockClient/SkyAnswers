import { OverwriteType, GuildChannel } from 'discord.js';

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
