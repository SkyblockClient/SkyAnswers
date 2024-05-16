import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { z } from 'zod';
import { repoFilesURL } from './const.js';
import levenshtein from 'js-levenshtein';

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
export const getJSON = (jsonFilename: string) => getTrackedData(`${repoFilesURL}/${jsonFilename}.json`);
export const getMods = async () => Mod.array().parse(await getJSON('mods'));
export const getPacks = async () => Pack.array().parse(await getJSON('packs'));

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
	display: z.string(),
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

export function queryData<T extends Data>(options: T[], query: string): T | undefined {
	const q = query.toLowerCase();
	return options.find((opt) => opt.id == q || opt.nicknames?.includes?.(q) || opt.display?.toLowerCase() == q);
}

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

export function probableMatches<T extends Data>(items: T[], query: string): T[] {
	const ret = items.sort((a, b) => getDistance(a, query) - getDistance(b, query));
	return ret.slice(0, 25);
}

export function getDistance(item: Data, query: string) {
	const allNames = [item.id, ...(item.nicknames || [])].map((name) => name.toLowerCase());
	if (item.display) allNames.push(item.display.toLowerCase());
	const allDistances = allNames.map((name) => levenshtein(query, name));
	return Math.min(...allDistances);
}
