import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { ComponentType, TextInputStyle } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		await interaction.showModal({
			title: 'Tell us your problem',
			customId: 'ticketSearchModal',
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.TextInput,
							label: 'Provide a description of your problem',
							customId: 'problem',
							style: TextInputStyle.Short
						}
					]
				}
			]
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'ticketSearch') return this.none();
		return this.some();
	}
}
