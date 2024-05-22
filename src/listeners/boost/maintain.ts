import { Events, Listener } from '@sapphire/framework';
import { Client } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { BoostersDB, DB, readDB } from '../../lib/db.js';
import { Servers } from '../../const.js';
import { z } from 'zod';
import { readGHFile, writeGHFile } from '../../lib/GHAPI.js';
import { format } from 'prettier';

@ApplyOptions<Listener.Options>({
	name: 'boost-maintain',
	once: true,
	event: Events.ClientReady
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
	public override async run(client: Client<true>) {
		if (!process.env.GH_KEY) return console.log('Missing GitHub API Key!');
		await run(client);
		setInterval(() => run(client), 60000 * 5);
	}
}

const TagsJSON = z.object({
	tags: z.record(z.tuple([z.string(), z.string()])),
	perms: z.record(z.string().array()),
	whitelist: z.boolean(),
	whitelisted: z.string().array()
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

	const oldFile = await readGHFile('SkyblockClient/SCC-Data', 'features/tags.json');
	const tags = TagsJSON.parse(JSON.parse(oldFile.content));
	tags.perms.Booster = boosters;

	const content = await format(JSON.stringify(tags), { parser: 'json' });
	await writeGHFile(oldFile, content, 'chore: update booster list');
}
