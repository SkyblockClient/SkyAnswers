import { Events, Listener } from '@sapphire/framework';
import { Client } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { BoostersDB, DB, readDB } from '../../lib/db.js';
import { Servers } from '../../const.js';
import { Octokit } from '@octokit/core';
import { z } from 'zod';

const octokit = new Octokit({
	auth: process.env.GH_KEY
});

@ApplyOptions<Listener.Options>({
	name: 'boost-maintain',
	once: true,
	event: Events.ClientReady
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
	public override async run(client: Client<true>) {
		if (!process.env.GH_KEY) return console.log('Missing GitHub API Key!');
		await run(client);
		setInterval(() => run(client), 60000);
	}
}

const TagsJSON = z.object({
	tags: z.record(z.tuple([z.string(), z.string()])),
	perms: z.record(z.string().array()),
	whitelist: z.boolean(),
	whitelisted: z.string().array()
});

const GHGetContents = z.object({
	content: z.string().transform(atob),
	sha: z.string()
});

export async function run(client: Client<true>) {
	const members = client.guilds.cache.get(Servers.SkyClient)?.members;
	if (!members) return;
	const db = BoostersDB.parse(await readDB(DB.Boosters));
	const boosters = [];
	for (const [discordID, mcUUID] of Object.entries(db)) {
		const member = members.resolve(discordID);
		if (!member || !member.premiumSince) continue;
		boosters.push(mcUUID);
	}
	boosters.sort();

	const rawData = (await octokit.request('GET /repos/SkyblockClient/SCC-Data/contents/features/tags.json')).data;
	const data = GHGetContents.parse(rawData);
	const tags = TagsJSON.parse(JSON.parse(data.content));

	if (`${tags.perms.Booster}` == `${boosters}`) return;
	tags.perms.Booster = boosters;

	await octokit.request('PUT /repos/SkyblockClient/SCC-Data/contents/features/tags.json', {
		message: 'chore: update booster list',
		committer: {
			name: 'SkyClient-repo-bot',
			email: 'SkyClient-repo-bot@users.noreply.github.com'
		},
		content: btoa(JSON.stringify(tags, null, 3)),
		sha: data.sha
	});
}
