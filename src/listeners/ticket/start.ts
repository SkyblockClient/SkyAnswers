import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ComponentType, ButtonStyle, OverwriteType, GuildChannel, TextChannel } from 'discord.js';
import { delay } from '@std/async/delay';

/** Requires the user to choose a category for their ticket */
@ApplyOptions<Listener.Options>({
	event: Events.ChannelCreate
})
export class UserEvent extends Listener<typeof Events.ChannelCreate> {
	public override async run(channel: GuildChannel) {
		if (!(channel instanceof TextChannel)) return;
		if (!channel.name.startsWith('ticket-')) return;

		await delay(500);
		await channel.send({
			content: 'What is your ticket about? You must click on one to continue.',
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							customId: 'ticketCategorize|crash',
							label: "I'm crashing",
							style: ButtonStyle.Primary
						},
						{
							type: ComponentType.Button,
							customId: 'ticketCategorize|install',
							label: 'I need help with the installer',
							style: ButtonStyle.Primary
						},
						{
							type: ComponentType.Button,
							customId: 'ticketCategorize|mods',
							label: 'I need help with mods',
							style: ButtonStyle.Primary
						},
						{
							type: ComponentType.Button,
							customId: 'ticketCategorize|other',
							label: 'Something else (meta)',
							style: ButtonStyle.Secondary
						}
					]
				}
			]
		});
		await setTicketOpen(channel, false);
	}
}

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
