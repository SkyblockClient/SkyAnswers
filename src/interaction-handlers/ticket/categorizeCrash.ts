import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { TextChannel } from 'discord.js';
import { plsBePatientTY, setTicketOpen } from '../../lib/ticket.js';

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
			components: [] // components stay behind without this
		});

		switch (crashType) {
			case 'CP':
				await interaction.channel.send(
					`**Click the copy icon on the right side and paste the results here.**\n${plsBePatientTY}`
				);
				break;
			case 'launcher':
				await interaction.channel.send(`You'll need to send your crashlog. Here's how to do so.
1. Open your SkyClient folder. See this: https://youtu.be/BHIM2htfMk8
2.
**If you saw a "View Crash Report" button in the launcher:**
Go to the \`crash-reports\` folder and upload the most recent file here.
**If you didn't see the button:**
Go to the \`logs\` folder and upload the file called \`latest\` or \`latest.log\`.

${plsBePatientTY}`);
				break;
			case 'other':
				await interaction.channel.send(`Please describe your crash so we can help you.\n${plsBePatientTY}`);
				break;
		}
		await setTicketOpen(interaction.channel, true);
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('ticketCategorizeCrash|')) return this.none();
		return this.some();
	}
}
