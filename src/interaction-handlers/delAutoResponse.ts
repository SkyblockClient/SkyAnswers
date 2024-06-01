import { ApplyOptions } from '@sapphire/decorators';
import {
	InteractionHandler,
	InteractionHandlerTypes,
	container,
} from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		if (!interaction.inCachedGuild())
			return;
		const respondedTo = interaction.customId.split('|')[1];
		if (
			respondedTo !== interaction.member.id
			&& !interaction.member.permissions.has('ManageMessages')
			&& !interaction.member.roles.cache.has('931626562539909130') // support person
		)
			return interaction.reply({
				content: 'not your autoresponse',
				ephemeral: true,
			});

		try {
			return interaction.message.delete();
		}
		catch (e) {
			container.logger.warn('could not delete', interaction.message, e);
			return interaction.reply({
				content: 'could not delete',
				ephemeral: true,
			});
		}
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('deleteResp'))
			return this.none();

		return this.some();
	}
}
