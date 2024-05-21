import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { getTrackedData } from '../../data.js';
import { Message } from 'discord.js';
import { z } from 'zod';
import { Servers } from '../../const.js';

const hastebinRegex = /https:\/\/hst\.sh\/(?:raw\/)?([a-z]*)/i;

/** Provides info and recommendations for crashes */
@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message<true>) {
		// TODO: Adapt for Polyforst
		if (message.guildId != Servers.SkyClient) return;

		const hasLogs = message.attachments.some((attachment) => /crash.+-client\.txt/.test(attachment.name) || attachment.name.endsWith('.log'));
		if (hasLogs) message.channel.sendTyping();

		const logsToCheck = message.attachments
			.filter((attachment) => attachment.name.endsWith('.txt') || attachment.name.endsWith('.log'))
			.map((attachment) => attachment.url);
		const hastebinMatch = message.content.match(hastebinRegex);
		if (hastebinMatch) logsToCheck.push(`https://hst.sh/raw/${hastebinMatch[1]}`);

		await Promise.all(
			logsToCheck.map(async (log) => {
				const resp = await fetch(log);
				const text = await resp.text();
				const info = await verbalizeCrash(text);
				if (info) await message.channel.send(info);
			})
		);
	}
}

const CrashCause = z.object({
	method: z.enum(['contains', 'contains_not', 'regex']),
	value: z.string()
});
const CrashFix = z.object({
	name: z.string().optional(),
	fixtype: z.number().optional(),
	fix: z.string(),
	causes: CrashCause.array()
});
const FixType = z.object({
	name: z.string()
});
const Crashes = z.object({
	fixes: CrashFix.array(),
	fixtypes: FixType.array(),
	default_fix_type: z.number()
});

async function verbalizeCrash(log: string, isSkyclient?: boolean) {
	const pathIndicator = '`';
	const gameRoot = '.minecraft';
	const profileRoot = isSkyclient ? '.minecraft/skyclient' : '.minecraft';
	const crashData = Crashes.parse(await getTrackedData('https://github.com/SkyblockClient/CrashData/raw/main/crashes.json'));
	const relevantInfo = crashData.fixes.filter((fix) =>
		fix.causes.every((type) => {
			if (type.method == 'contains') return log.includes(type.value);
			else if (type.method == 'regex') return log.match(new RegExp(type.value));
			else if (type.method == 'contains_not') return !log.includes(type.value);
			else return false;
		})
	);
	const crashGroups = crashData.fixtypes.map((type, i) => {
		const groupInfo = relevantInfo.filter((info) => (info.fixtype ?? crashData.default_fix_type) == i);
		if (!groupInfo.length) return;
		return `**${type.name}**
${groupInfo
	.map((info) => info.fix.replaceAll('%pathindicator%', pathIndicator).replaceAll('%gameroot%', gameRoot).replaceAll('%profileroot%', profileRoot))
	.join('\n')}`;
	});
	return crashGroups.filter((group) => group).join('\n');
}
