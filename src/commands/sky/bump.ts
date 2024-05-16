import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { hyperlink, time } from 'discord.js';
import { Users } from '../../const.js';
import { inPrivate } from '../../preconditions/notPublic.js';

@ApplyOptions<Command.Options>({
	description: 'Bumps a ticket to encourage closing',
	preconditions: ['notPublic']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		console.log('bump');
		if (inPrivate(interaction.guildId)) return;
		console.log('not in private');
		if (!interaction.channel) return;
		console.log('found channel');

		const pins = await interaction.channel.messages.fetchPinned();
		// const openingMessage = pins.filter((message) => message.author.id == Users.TicketTool && message.content.includes('Welcome')).first();
		const openingMessage = pins.find((message) => message.author.id == Users.TicketTool && message.content.includes('Welcome'));
		const ticketOwner = openingMessage?.content?.match(/[0-9]+/)?.at(0);

		const twoDays = new Date();
		twoDays.setDate(twoDays.getDate() + 2);
		const twoDaysStamp = time(twoDays, 'R');

		await interaction.reply({
			...(ticketOwner ? { content: `Hey <@${ticketOwner}>:` } : null),
			embeds: [
				{
					title: 'Do you still need help?',
					description:
						`***Yes***: Restate your problem clearly. If someone asked you to upload something, do that.
***No, all my problems are solved***: Close the ticket. View the ` +
						(openingMessage ? hyperlink('pinned message', openingMessage.url) : 'pinned message') +
						` at the top, and click the :lock: button to close your ticket.
If you do not respond in the next 2 days (${twoDaysStamp}), your ticket will be closed.`,
					color: 0xffff88
				}
			]
		});
	}
}
