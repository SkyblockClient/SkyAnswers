import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Discord, getTrackedData, queryData } from '../../data.js';
import { APIEmbed, InteractionReplyOptions } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Gives the link to a discord'
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

		const data = await getTrackedData('https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/discords.json');
		const items = Discord.array().parse(data);
		const item = queryData(items, query);
		if (!item) return interaction.reply({ content: `No Discord found` });

		return interaction.reply(getDiscordEmbed(item));
	}
}

export function getDiscordEmbed(item: Discord): InteractionReplyOptions {
	const embed: APIEmbed = {
		color: 0x8ff03f,
		title: item.fancyname
	};
	if (item.icon)
		embed.thumbnail = {
			url: 'https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/discords/' + encodeURIComponent(item.icon)
		};
	if (item.description) embed.description = item.description;

	return {
		content: 'discord.gg/' + item.code,
		embeds: [embed]
	};
}
