import { Message, TextChannel, escapeMarkdown, unorderedList } from 'discord.js';
import { Channels, Roles } from '../../const.js';
import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { SkyClientOnly } from '../../lib/SkyClientOnly.js';

const streaks: Record<string, string[]> = {};

/** Flags users who are spamming for giveaways */
@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class MessageListener extends Listener<typeof Events.MessageCreate> {
	@SkyClientOnly()
	public override async run(message: Message) {
		const { author, guild, content, channel, client } = message;
		if (author.bot || !guild) return;
		const member = guild.members.cache.get(author.id);
		if (!member) return;

		// if (content.startsWith("-") || content.toLowerCase().startsWith("sky "))
		//   return; // exclude bot commands
		if (channel.id == Channels.Trolling) return; // exclude trolling
		if (member.roles.cache.has(Roles.CoolPeople)) return; // cool people
		if (member.roles.cache.has(Roles.NoGiveaways)) return; // already has no giveaways

		let streak = streaks[author.id];
		if (!streak) {
			streak = [];
			streaks[author.id] = streak;
		}

		const words = content.match(/[\w'`´]+/g);
		if (!words) return;

		const isShort = words.length < 3;
		if (isShort) streak.push(content);
		else streak.length = 0;

		if (streak.length != 6) return;

		try {
			await member.roles.add(Roles.NoGiveaways);

			const message = `${author.id} (${author.username}) sent 6 low effort messages in a row, so they were blocked from giveaways`;
			await channel.send(message);

			const verboseBotLogs = client.channels.cache.get(Channels.BotLogs) as TextChannel;
			if (!verboseBotLogs) return;

			const list = unorderedList(streak.map((v) => escapeMarkdown(v)));
			await verboseBotLogs.send({
				content: `${message}\n${list}`,
				allowedMentions: { parse: [] }
			});
		} catch (e) {
			console.log(e);
		}
	}
}
