import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { hyperlink, time } from 'discord.js';
import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { Duration } from '@sapphire/time-utilities';
import { getTicketOwner, getTicketTop, isTicket } from '../../lib/ticket.js';

@ApplyOptions<Command.Options>({
	description: 'Bumps a ticket to encourage closing',
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
		});
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const { channel } = interaction;
		if (!isTicket(channel))
			return interaction.reply({
				content: 'not a ticket lol',
				ephemeral: true,
			});

		const pinMsg = await getTicketTop(channel);
		const owner = await getTicketOwner(channel);

		const twoDays = new Duration('2d').fromNow;
		const twoDaysStamp = time(twoDays, 'R');

		const pinnedMsg = pinMsg
			? hyperlink('pinned message', pinMsg.url)
			: 'pinned message';
		const message = new MessageBuilder({
			embeds: [
				{
					title: 'Do you still need help?',
					description: `***Yes***: Restate your problem clearly. If someone asked you to upload something, do that.
***No, all my problems are solved***: Close the ticket. View the ${pinnedMsg} at the top, and click the :lock: button to close your ticket.
If you do not respond ${twoDaysStamp}, your ticket will be closed.`,
					color: 0xFFFF88,
				},
			],
		});
		if (owner)
			message.setContent(`Hey <@${owner}>:`);
		return interaction.reply(message);
	}
}
