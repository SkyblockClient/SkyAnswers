import { ApplyOptions } from '@sapphire/decorators';
import {
	InteractionHandler,
	InteractionHandlerTypes,
} from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import { notSkyClient } from '../../preconditions/notPublic.js';
import { PendingUpdatesDB } from '../../lib/db.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		if (notSkyClient(interaction.guildId))
			return;

		const pendingUpdates = PendingUpdatesDB.data;
		const data = pendingUpdates[interaction.message.id];
		if (!data)
			return interaction.reply({
				content: 'no update found (this shouldn\'t happen)',
				ephemeral: true,
			});
		if (data.initiator !== interaction.user.id)
			return interaction.reply({
				content: 'not your update',
				ephemeral: true,
			});

		return interaction.update({
			content: `first, double-check that this mod doesn't have a rat in it.
**(rat-to-peer may take a bit to boot up but it'll load within 15 seconds)**`,
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							url: `https://ktibow.github.io/RatRater2/?rat-to-peer-url=${encodeURIComponent(
								data.url,
							)}`,
							label: 'RatRater',
							style: ButtonStyle.Link,
						},
						{
							type: ComponentType.Button,
							customId: 'updateCheck2',
							label: 'It\'s safe, I checked',
							style: ButtonStyle.Success,
						},
					],
				},
			],
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'updateCheck1')
			return this.none();
		return this.some();
	}
}
