import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { TextChannel } from 'discord.js';
import { setTicketOpen } from '../../listeners/ticket/start.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		if (!(interaction.channel instanceof TextChannel)) return;

		const origContent = interaction.message.content;
		const crashType = interaction.customId.split('|')[1];
		const crashTypeName = {
			CP: 'CrashPatch',
			launcher: 'Launcher',
			other: 'Other'
		}[crashType];
		await interaction.update({
			content: `${origContent.split('\n')[0]}
**Crash type**: ${crashTypeName}`,
			components: []
		});

		switch (crashType) {
			case 'CP':
				await interaction.channel.send('**Click the copy button and paste it here.**');
				break;
			case 'launcher':
				await interaction.channel.send(`1. Open your SkyClient folder. See this: https://youtu.be/BHIM2htfMk8
2.
**If you see a "View Crash Report" button:**
Go to the \`crash-reports\` folder and upload the most recent file here.
**If you don't:**
Go to the \`logs\` folder and upload the file called \`latest.log\`.`);
				break;
			case 'other':
				await interaction.channel.send('Describe how you crashed so we can help you.');
				break;
		}
		await setTicketOpen(interaction.channel, true);
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('ticketCategorizeCrash|')) return this.none();
		return this.some();
	}
}
