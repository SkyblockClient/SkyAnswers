import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { APIEmbed } from 'discord.js';
import { z } from 'zod';

const QueryResponse = z.object({
	questions: z.array(z.string()),
	answer: z.string()
});
type QueryResponse = z.infer<typeof QueryResponse>;

const RawResponse = z.object({
	answers: QueryResponse.array()
});

export const search = async (query: string): Promise<QueryResponse | null> => {
	const { answers } = RawResponse.parse(
		await fetch(
			'https://skyanswerstext.cognitiveservices.azure.com/language/:query-knowledgebases?' +
				new URLSearchParams({
					projectName: 'SkyAnswers',
					'api-version': '2021-10-01',
					deploymentName: 'production'
				}),
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Ocp-Apim-Subscription-Key': process.env.AZURE_QA_KEY || ''
				},
				body: JSON.stringify({
					top: 1,
					question: query,
					confidenceScoreThreshold: 0.3
				})
			},
			FetchResultTypes.JSON
		)
	);
	if (answers.length == 0) {
		console.error(answers);
		throw new Error('something went wrong in faq');
	}
	const [answer] = answers;
	if (answer.answer == `No idea ¯\\_(ツ)_/¯`) return null;
	return answer;
};

export async function searchEmbed(query: string): Promise<APIEmbed> {
	try {
		const answer = await search(query);
		if (!answer) {
			return {
				title: 'Nothing relevant in the FAQ found',
				color: 0xff8888
			};
		}
		return {
			title: `FAQ: ${answer.questions[0]}`,
			description: answer.answer,
			color: 0x88ff88
		};
	} catch (e) {
		return {
			title: 'Failed to search FAQ',
			color: 0xff8888
		};
	}
}

interface TrackedData {
	data: unknown;
	lastUpdated: number;
}
let trackedData: Record<string, TrackedData> = {};
export const invalidateTrackedData = () => (trackedData = {});
export async function getTrackedData(url: string) {
	const lastUpdated = trackedData[url]?.lastUpdated;
	if (!lastUpdated || Date.now() - lastUpdated > 1000 * 60 * 60) {
		console.log('refetching', url);
		let data;
		try {
			const resp = await fetch(url, FetchResultTypes.Result);
			if (!resp.ok) {
				throw new Error(`http error ${resp.statusText} while fetching ${url}`);
			}
			data = await resp.json();
		} catch (e) {
			throw new Error(`exception ${e} while fetching ${url}`);
		}
		trackedData[url] = { data, lastUpdated: Date.now() };
	}
	return trackedData[url].data;
}

export const DataType = z.enum(['mods', 'packs']);
export type DataType = z.infer<typeof DataType>;

export const Data = z
	.object({
		id: z.string(),
		nicknames: z.string().array().optional(),
		display: z.string().optional()
	})
	.passthrough();
export type Data = z.infer<typeof Data>;

export const Discord = Data.extend({
	icon: z.string().optional(),
	description: z.string().optional(),
	// partner: z.boolean().optional(),
	// type: DataType.optional(),
	code: z.string(),
	fancyname: z.string().optional()
	// mods: z.string().array().optional(),
	// packs: z.string().array().optional()
}).passthrough();
export type Discord = z.infer<typeof Discord>;

// const Action = z.object({
// 	icon: z.string().optional(),
// 	text: z.string().optional(),
// 	link: z.string().optional(),
// 	method: z.enum(['hover']).optional(),
// 	document: z.string().optional()
// });

export const Downloadable = Data.extend({
	// enabled: z.boolean().optional(),
	creator: z.string().optional(),
	description: z.string(),
	icon: z.string().optional(),
	// icon_scaling: z.literal('pixel').optional(),
	// discordcode: z.string().optional(),
	// actions: Action.array().optional(),
	categories: z.string().array().optional(),
	hidden: z.boolean().optional(),

	file: z.string(),
	url: z.string().optional(),
	hash: z.string().optional()
}).passthrough();
export type Downloadable = z.infer<typeof Downloadable>;

export const Mod = Downloadable.extend({
	command: z.string().optional(),
	// warning: z
	// 	.object({
	// 		lines: z.string().array()
	// 	})
	// 	.optional(),
	// update_to_ids: z.string().array().optional(),
	// files: z.string().array().optional(),
	forge_id: z.string().optional(),
	packages: z.string().array().optional()
}).passthrough();
export type Mod = z.infer<typeof Mod>;

export const Pack = Downloadable.extend({
	screenshot: z.string().optional()
}).passthrough();
export type Pack = z.infer<typeof Mod>;

export const DownloadableMod = Mod.transform((v) => ({
	...v,
	download: v.url || `https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/mods/${v.file}`
}));
export type DownloadableMod = z.infer<typeof DownloadableMod>;
export const DownloadablePack = Pack.transform((v) => ({
	...v,
	download: v.url || `https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/packs/${v.file}`
}));
export type DownloadablePack = z.infer<typeof DownloadablePack>;

export const queryData = <T extends Data>(options: T[], query: string): T | undefined =>
	options.find((opt) => opt.id == query || opt.nicknames?.includes?.(query) || opt.display?.toLowerCase() == query);

export function queryDownloadable(options: Mod[], query: string, hosting: 'mods'): DownloadableMod | undefined;
export function queryDownloadable(options: Pack[], query: string, hosting: 'packs'): DownloadablePack | undefined;
export function queryDownloadable<T extends Downloadable>(
	options: T[],
	query: string,
	hosting: DataType
): DownloadableMod | DownloadablePack | undefined {
	const option = queryData(options, query);
	if (!option) return;
	switch (hosting) {
		case 'mods':
			return DownloadableMod.parse(option);
		case 'packs':
			return DownloadablePack.parse(option);
	}
}
