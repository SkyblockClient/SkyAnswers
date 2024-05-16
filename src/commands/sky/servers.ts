import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { unorderedList } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'See what servers SkyAnswers got into.'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const { client } = interaction;
		const guilds = client.guilds.cache;

		const list = guilds.map((guild) => `${guild.name} (${guild.id})`);
		await interaction.reply({
			content: `${guilds.size} servers:
${unorderedList(list)}`,
			ephemeral: true
		});
	}
}
