import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';
import { TextChannel } from 'discord.js';
import { setTicketOpen } from '../../listeners/ticket/start.js';
import { searchEmbed } from '../../data.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ModalHandler extends InteractionHandler {
	public async run(interaction: ModalSubmitInteraction) {
		if (!interaction.channel || !interaction.message || !(interaction.channel instanceof TextChannel)) return;
		const origContent = interaction.message.content;
		const question = interaction.fields.getTextInputValue('problem');
		await interaction.deferUpdate();
		await interaction.editReply({
			...(await searchEmbed(question)),
			content: `${origContent.split('\n')[0]}
**Problem**: ${question}`,
			components: []
		});
		await setTicketOpen(interaction.channel, true);
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId !== 'ticketSearchModal') return this.none();
		return this.some();
	}
}
