import { Events, Listener } from '@sapphire/framework';
import { Channel, Client, DiscordAPIError, roleMention } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { Servers, Users } from '../../const.js';
import { GuildBasedChannel, TextChannel } from 'discord.js';
import { getTicketOwner } from '../../lib/ticket.js';

const SupportTeams: Record<string, string> = {
	[Servers.SkyClient]: '931626562539909130',
	'822066990423605249': '997376364460114001',
	[Servers.Dev]: '1240761899092803715'
};

@ApplyOptions<Listener.Options>({
	once: true,
	event: Events.ClientReady
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
	public override async run(client: Client<true>) {
		await run(client);
		setInterval(() => run(client), 30000);
	}
}

const isTextChannel = (channel: GuildBasedChannel): channel is TextChannel => channel instanceof TextChannel;
const isGuildChannel = (channel: Channel): channel is GuildBasedChannel => !channel.isDMBased();

export async function run(client: Client<true>) {
	const tickets = Array.from(client.channels.cache.values())
		.filter(isGuildChannel)
		.filter(isTextChannel)
		.filter((c) => c.name.startsWith('ticket-'));
	await Promise.all(tickets.map(maintainTicket));
}

async function maintainTicket(ticket: TextChannel) {
	try {
		const support = SupportTeams[ticket.guildId];
		if (!support) return;

		const messages = await ticket.messages.fetch();
		const lastMessage = messages.filter((message) => message.author.id != Users.TicketTool).first();
		if (!lastMessage) return;
		const meLast = lastMessage.author.id == ticket.client.user.id;
		if (meLast && lastMessage.content.startsWith(roleMention(support))) return;

		const ownerId = await getTicketOwner(ticket);
		if (ownerId) {
			const owner = ticket.guild.members.resolve(ownerId);
			if (!owner) return pingStaff(ticket, 'owner left');
		}

		if (meLast && lastMessage.embeds.some((embed) => embed.title == 'Do you still need help?')) {
			// last message was bump
			const twoDays = new Date(lastMessage.createdTimestamp);
			twoDays.setDate(twoDays.getDate() + 2);
			if (twoDays < new Date()) console.log('close ticket', ticket);
			// return pingStaff(ticket, 'time to close');
		}
		return;
	} catch (e) {
		const header = `Failed to maintain ticket in ${ticket.name} in ${ticket.guild.name}:`;
		if (e instanceof DiscordAPIError) {
			if (e.code == 50001) return;
			console.log(header, e.code, e.message);
		} else console.log(header, e);
	}
}

const pingStaff = async (channel: TextChannel, msg: string) => {
	const support = SupportTeams[channel.guildId];
	if (!support) return;
	channel.send(`${roleMention(support)} ${msg}`);
};
