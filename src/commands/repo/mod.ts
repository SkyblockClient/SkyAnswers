import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Downloadable, DownloadableMod, DownloadablePack, Mod, getTrackedData, queryDownloadable } from '../../data.js';
import { APIEmbed, APIEmbedField, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionReplyOptions } from 'discord.js';
import levenshtein from 'js-levenshtein';

@ApplyOptions<Command.Options>({
	description: 'Gives info about a mod'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'query',
					description: 'Mod to search for',
					required: true
				}
			]
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const query = interaction.options.getString('query', true);
		const items = Mod.array().parse(await getTrackedData(`https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/mods.json`));
		const item = queryDownloadable(items, query, 'mods');
		if (!item) {
			const sortedOptions = items.sort((a, b) => getDistance(a, query) - getDistance(b, query));
			const bestOption = sortedOptions[0];
			const bestDistance = getDistance(bestOption, query);
			return interaction.reply('No mod found' + (bestDistance <= 3 ? `, did you mean "${bestOption.id}"?` : ''));
		}
		let bundledIn: string | undefined;
		if (item.hidden) {
			bundledIn = items.find((otherItem) => otherItem.packages?.includes(item.id))?.display;
		}
		return interaction.reply(getDownloadableMessage(item, bundledIn));
	}
}

const isMod = (downloadable: unknown): downloadable is DownloadableMod => DownloadableMod.safeParse(downloadable).success;
const isPack = (downloadable: unknown): downloadable is DownloadablePack => DownloadablePack.safeParse(downloadable).success;

export function getDownloadableMessage(downloadable: DownloadableMod | DownloadablePack, bundledIn?: string): InteractionReplyOptions {
	const fields: APIEmbedField[] = [];
	const embed: APIEmbed = {
		color: downloadable.hash ? Number('0x' + downloadable.hash.slice(0, 6)) : undefined,
		title: downloadable.display,
		description: downloadable.description,
		footer: { text: `Created by ${downloadable.creator}` }
	};
	if (downloadable.icon)
		embed.thumbnail = {
			url: `https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/icons/${encodeURIComponent(downloadable.icon)}`
		};
	if (isPack(downloadable) && downloadable.screenshot) embed.image = { url: encodeURI(downloadable.screenshot) };
	if (downloadable.hidden)
		fields.push({
			name: 'Note',
			value:
				"This item is hidden, so it won't show up in the normal installer. " +
				(bundledIn ? `You can get it in the bundle ${bundledIn}.` : 'It might be internal or outdated.')
		});
	if (isMod(downloadable) && downloadable.command) fields.push({ name: 'In-Game Command', value: downloadable.command });

	embed.fields = fields;
	return {
		embeds: [embed],
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.Button,
						url: downloadable.download,
						label: 'Download',
						style: ButtonStyle.Link
					}
				]
			}
		]
	};
}
export function getDistance(item: Downloadable, query: string) {
	const allNames = [item.id, ...(item.nicknames || [])].map((name) => name.toLowerCase());
	if (item.display) allNames.push(item.display.toLowerCase());
	const allDistances = allNames.map((name) => levenshtein(query, name));
	return Math.min(...allDistances);
}
