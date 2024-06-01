import type { GuildMember } from 'discord.js';
import z from 'zod';
import { getJSON } from '../data.js';
import { Roles, Users, isDevUser } from '../const.js';

const ModOwner = z.object({
	github: z.string(),
	mods: z.record(z.enum(['update', 'approve'])),
});
const ModOwners = z.record(ModOwner);

export async function checkMember(member: GuildMember) {
	if (member.roles.cache.has(Roles.GitHubKeeper))
		return { all: true };
	if (isDevUser && member.id === Users.BotDev)
		return { all: true };

	const owners = ModOwners.parse(await getJSON('mod_owners'));
	const data = owners[member.id];
	if (data)
		return {
			all: false,
			perms: data.mods,
		};

	return { all: false };
}
