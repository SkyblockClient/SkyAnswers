import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import { pendingUpdates } from '../../lib/update.js';
import { inPrivate } from '../../preconditions/notPublic.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		if (inPrivate(interaction.guildId)) return;

		const data = pendingUpdates[interaction.message.id];
		if (!data)
			return interaction.reply({
				content: 'no update found',
				ephemeral: true
			});
		if (data.initiator != interaction.user.id)
			return interaction.reply({
				content: 'not your update',
				ephemeral: true
			});

		return interaction.update({
			content: `next, get this approved by one of the mod developers or a github keeper.
(ping who you see fit.)`,
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							customId: 'updateCheck3',
							label: 'I want to push out this mod',
							style: ButtonStyle.Success
						}
					]
				}
			]
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'updateCheck2') return this.none();
		return this.some();
	}
}