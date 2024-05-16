import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Pack, getTrackedData, queryDownloadable } from '../../data.js';
import { getDistance, getDownloadableEmbed } from './mod.js';

@ApplyOptions<Command.Options>({
	description: 'Gives info about a pack'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option //
						.setName('query')
						.setDescription('the query')
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const query = interaction.options.getString('query', true);
		const items = Pack.array().parse(await getTrackedData(`https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/packs.json`));
		const item = queryDownloadable(items, query, 'packs');
		if (!item) {
			const sortedOptions = items.sort((a, b) => getDistance(a, query) - getDistance(b, query));
			const bestOption = sortedOptions[0];
			const bestDistance = getDistance(bestOption, query);
			return interaction.reply({
				content: `No pack found` + (bestDistance <= 3 ? `, did you mean "${bestOption.id}"?` : '')
			});
		}
		return interaction.reply({
			embeds: [getDownloadableEmbed(item)]
		});
	}
}
