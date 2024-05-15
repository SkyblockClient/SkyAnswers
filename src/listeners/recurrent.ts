import { Events, Listener } from '@sapphire/framework';
import { Client } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { Servers, Channels, Users } from '../const.js';
import { Collection, Guild, GuildBasedChannel, Message, TextChannel } from 'discord.js';

@ApplyOptions<Listener.Options>({
	once: true,
	event: Events.ClientReady
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
	public override async run(client: Client) {
		const skyclient = client.guilds.cache.get(Servers.SkyClient);
		if (!skyclient) return;
		await run(skyclient);
		setInterval(() => run(skyclient), 30000);
	}
}

const ticketMatcher = /(?:ticket|closed)-(\d+)/;

function isTextChannel(channel: GuildBasedChannel): channel is TextChannel {
	return channel instanceof TextChannel;
}

enum Action {
	Archive,
	CloseOwnerless,
	CloseBumped,
	BumpStale1,
	BumpStale2,
	None1,
	None2,
	None3
}

const messages: { [key in Action]?: string } = {
	[Action.Archive]: '**ARCHIVE**',
	[Action.CloseOwnerless]: '**CLOSE** (no owner)',
	[Action.CloseBumped]: '**CLOSE** (dead)',
	[Action.BumpStale1]: '**bump** (restale)',
	[Action.BumpStale2]: '**bump** (stale)'
	// [Action.None1]: 'none but will restale soon',
	// [Action.None2]: 'none but will close soon',
	// [Action.None3]: 'none but will stale soon'
};

export const run = async (guild: Guild) => {
	const allTickets = Array.from(guild.channels.cache.values())
		.filter(isTextChannel)
		.filter((c) => ticketMatcher.test(c.name));
	allTickets.sort((a, b) => a.name.localeCompare(b.name));

	const table: {
		ticket: TextChannel;
		message: string;
	}[] = [];
	await Promise.all(
		allTickets.map(async (ticket) => {
			const action = await (async () => {
				if (ticket.name.startsWith('closed')) return Action.Archive;

				const ownerId = await getOwner(ticket);
				if (!ownerId) return Action.CloseOwnerless;
				const owner = guild.members.cache.get(ownerId);
				if (!owner) return Action.CloseOwnerless;

				const messages = await ticket.messages.fetch();
				const bump = getBumpMessage(messages);
				const lastMessage = getLastMessage(messages, ownerId) || getLastMessage(messages, Users.Fire);

				if (bump) {
					if (lastMessage && lastMessage.createdTimestamp > bump.createdTimestamp) {
						if (Date.now() - lastMessage.createdTimestamp > 1000 * 60 * 60 * 24 * 2) return Action.BumpStale1;
						return Action.None1;
					}
					if (Date.now() - bump.createdTimestamp > 1000 * 60 * 60 * 24 * 2) return Action.CloseBumped;
					return Action.None2;
				} else {
					if (lastMessage && Date.now() - lastMessage.createdTimestamp > 1000 * 60 * 60 * 24 * 2) return Action.BumpStale2;
					return Action.None3;
				}
			})();

			const friendly = messages[action] || undefined;
			if (friendly)
				table.push({
					ticket,
					message: `<#${ticket.id}> ${friendly}`
				});
		})
	);

	table.sort((a, b) => {
		const aId = a.ticket.name.split('-')[1];
		const bId = b.ticket.name.split('-')[1];
		return Number(aId) - Number(bId);
	});

	const ticketChannel = guild.channels.cache.get(Channels.Tickets) as TextChannel;
	if (ticketChannel) {
		const messages = await ticketChannel.messages.fetch();
		let sticky = messages.first();
		if (!sticky || sticky.author.id != guild.client.user.id) sticky = await ticketChannel.send('sticky');

		await sticky.edit(table.length == 0 ? 'No action needed.' : table.map(({ message }) => message).join('\n'));
	}
};

async function getOwner(ticket: TextChannel) {
	const pins = await ticket.messages.fetchPinned();
	const openingMessage = pins
		.filter((message) => {
			return message.author.id == Users.TicketTool && message.content.includes('Welcome');
		})
		.first();
	const ticketOwner = openingMessage?.content?.match(/[0-9]+/)?.at(0);
	return ticketOwner;
}
const getBumpMessage = (messages: Collection<string, Message<true>>) =>
	messages.filter((message) => message.embeds.some((embed) => embed.title == 'Do you still need help?')).first();
const getLastMessage = (messages: Collection<string, Message<true>>, ownerId: string) =>
	messages.filter((message) => message.author.id == ownerId).first();
// const getCloseMessage = (messages: Collection<string, Message<true>>) =>
// 	messages
// 		.filter((message) => message.author.id == Users.TicketTool && message.embeds.some((embed) => embed.description?.includes('Ticket Closed by')))
// 		.first();
