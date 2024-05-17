import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { TextChannel, PartialGuildMember, GuildMember } from 'discord.js';
import { Channels, Roles } from '../../const.js';

const role = Roles.NitroBooster;

/** Tracks when people (un)boost */
@ApplyOptions<Listener.Options>({
	event: Events.GuildMemberUpdate
})
export class UserEvent extends Listener<typeof Events.GuildMemberUpdate> {
	public override async run(oldUser: GuildMember | PartialGuildMember, user: GuildMember) {
		const verboseBotLogs = user.client.channels.cache.get(Channels.BotLogs);
		if (!(verboseBotLogs instanceof TextChannel)) return;

		if (oldUser.roles.cache.has(role) && !user.roles.cache.has(role))
			return verboseBotLogs.send(`${user.id} (${user.user.username}) stopped boosting`);
		if (!oldUser.roles.cache.has(role) && user.roles.cache.has(role))
			return verboseBotLogs.send(`${user.id} (${user.user.username}) started boosting`);
		return;
	}
}
