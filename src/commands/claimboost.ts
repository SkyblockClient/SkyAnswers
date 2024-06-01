import { ApplyOptions } from '@sapphire/decorators';
import { Command, container } from '@sapphire/framework';
import { ApplicationCommandOptionType } from 'discord.js';
import { Servers } from '../const.js';
import { getMCName } from '../lib/mcAPI.js';
import { BoostersDB } from '../lib/db.js';

@ApplyOptions<Command.Options>({
	description: 'Claims your in-game rank for boosting',
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'username',
					description: 'Minecraft Username',
					required: true,
				},
			],
		});
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		if (interaction.guildId !== Servers.SkyClient)
			return;

		interaction.guild?.members.resolve(interaction.user);
		const member = interaction.guild?.members.resolve(interaction.user);
		if (!member)
			return;
		const hasNitro = !!member.premiumSince;

		const mcName = interaction.options.getString('username', true);
		const uuid = await getMCName(mcName);
		if (!uuid)
			return interaction.reply({
				content: 'Couldn\'t find this Minecraft account.',
				ephemeral: true,
			});

		await BoostersDB.update((data) => {
			data[interaction.user.id] = uuid;
		});
		container.logger.info(
			'Saving Booster',
			hasNitro,
			interaction.user.id,
			uuid,
		);
		if (hasNitro)
			return interaction.reply({
				content: `**Thanks for the boost!** <3
Your in-game rank has been claimed and will appear in 5-10 minutes.
If you don't see it, make sure you have SkyClient Cosmetics and type \`/scc reload\` in game.`,
				ephemeral: true,
			});
		else
			return interaction.reply({
				content: `**You don't appear to be Server Boosting.**
Give us a boost to receive an in-game role with SkyClient Cosmetics!`,
				ephemeral: true,
			});
	}
}
