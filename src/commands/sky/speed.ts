import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	description: 'gets a measure of speed'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const recievedTime = Date.now();
		const message = await interaction.reply({
			content: 'blazingly fast ⚡',
			fetchReply: true
		});
		const ping = interaction.client.ws.ping;
		const recieveTime = recievedTime - interaction.createdTimestamp;
		const sendTime = message.createdTimestamp - recievedTime;
		const totalTime = message.createdTimestamp - interaction.createdTimestamp;
		return interaction.editReply(
			`blazingly fast ⚡
ws: ${ping}ms
this interaction: ${recieveTime}ms to recieve interaction, ${sendTime}ms to send message - total ${totalTime}ms`
		);
	}
}
