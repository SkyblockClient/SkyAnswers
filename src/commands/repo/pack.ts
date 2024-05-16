import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { getDistance, getPacks, queryDownloadable } from '../../data.js';
import { getDownloadableMessage } from './mod.js';
import { ApplicationCommandOptionType } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Gives info about a pack'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'pack',
					description: 'Pack to search for',
					required: true,
					autocomplete: true
				}
			]
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const query = interaction.options.getString('pack', true);
		const items = await getPacks();
		const item = queryDownloadable(items, query, 'packs');
		if (!item) {
			const sortedOptions = items.sort((a, b) => getDistance(a, query) - getDistance(b, query));
			const bestOption = sortedOptions[0];
			const bestDistance = getDistance(bestOption, query);
			return interaction.reply('No pack found' + (bestDistance <= 3 ? `, did you mean "${bestOption.id}"?` : ''));
		}
		return interaction.reply(await getDownloadableMessage(item));
	}
}
