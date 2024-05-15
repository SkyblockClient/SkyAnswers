import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { ButtonStyle, ComponentType } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		const ticketType = interaction.customId.split('|')[1];
		const ticketTypeName = {
			crash: 'Crashing',
			install: 'Help with installer',
			mods: 'Help with mods',
			other: 'Other'
		}[ticketType];
		const ticketTypeDesc = `**Ticket category**: ${ticketTypeName}`;
		if (ticketType == 'crash')
			return interaction.update({
				content: ticketTypeDesc + '\nSo we can fix your crash, what do you see when you crash?',
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: 'ticketCategorizeCrash|CP',
								label: 'Skyclient says "Minecraft has crashed!"',
								style: ButtonStyle.Primary
							},
							{
								type: ComponentType.Button,
								customId: 'ticketCategorizeCrash|launcher',
								label: 'The launcher says "Game crashed"',
								style: ButtonStyle.Primary
							},
							{
								type: ComponentType.Button,
								customId: 'ticketCategorizeCrash|other',
								label: 'Something else (like the game closing)',
								style: ButtonStyle.Primary
							}
						]
					}
				]
			});
		else
			return interaction.update({
				content: ticketTypeDesc + "\nDescribe your problem. I'll search for it and continue the support process.",
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								customId: 'ticketSearch',
								label: 'Search',
								style: ButtonStyle.Primary
							}
						]
					}
				]
			});
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('ticketCategorize|')) return this.none();
		return this.some();
	}
}
