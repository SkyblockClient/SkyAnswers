import { GuildMember } from 'discord.js';
import { getTrackedData } from '../data.js';
import z from 'zod';
import { isDevUser, Roles, Users } from '../const.js';

const ModOwner = z.object({
	github: z.string(),
	mods: z.record(z.enum(['update', 'approve']))
});
const ModOwners = z.record(ModOwner);

export const checkMember = async (member: GuildMember) => {
	if (member.roles.cache.has(Roles.GitHubKeeper)) return { all: true };
	if (isDevUser && member.id == Users.BotDev) return { all: true };

	const owners = ModOwners.parse(await getTrackedData('https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/mod_owners.json'));
	const data = owners[member.id];
	if (data) {
		return {
			all: false,
			perms: data.mods
		};
	}
	return { all: false };
};

interface Update {
	forge_id: string;
	url: string;
	hash: string;
	file: string;
	initiator: string;
	type: 'normal' | 'beta';
}

export const pendingUpdates: Record<string, Update> = {};
