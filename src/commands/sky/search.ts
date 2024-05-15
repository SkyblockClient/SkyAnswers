import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { searchEmbed } from '../../data.js';

@ApplyOptions<Command.Options>({
	description: 'Searches for the query in the knowledge base',
	preconditions: ['notPublic']
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

		await interaction.channel?.sendTyping();
		const embed = await searchEmbed(query);
		await interaction.reply({ embeds: [embed] });
	}
}
