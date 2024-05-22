import { resolve, join } from 'path';
import * as fs from 'fs/promises';
import { debounce } from '@sapphire/utilities';
import { z } from 'zod';
const dbDir = resolve('./db');

try {
	await fs.mkdir(dbDir);
} catch {}

export enum DB {
	Boosters = 'boosters'
	// Presence = 'presence'
}

export const BoostersDB = z.record(z.string()).default({});
export type BoostersDB = z.infer<typeof BoostersDB>;
// const PresenceDB = z.object({}).default({});

const DBZods: Record<DB, z.ZodType<unknown>> = {
	[DB.Boosters]: BoostersDB
};

type CachedDB = { data?: unknown; outdated?: boolean };
const cache = new Map<DB, CachedDB>();

export async function readDB(db: DB): Promise<unknown> {
	const path = getDBPath(db);
	let data = cache.get(db)?.data;
	if (!data) {
		try {
			data = JSON.parse(await fs.readFile(path, 'utf-8'));
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code == 'ENOENT') {
			} else throw e;
		}
		data = DBZods[db].parse(data);
		cache.set(db, { data });
	}
	DBZods[db].parse(data);
	return data;
}

export async function writeDB(db: DB.Boosters, data: BoostersDB): Promise<void>;
export async function writeDB(db: DB, data: unknown) {
	DBZods[db].parse(data);
	cache.set(db, { data, outdated: true });
	saveDB();
}

const getDBPath = (db: DB) => join(dbDir, `${db}.json`);

async function _flush() {
	console.log('Flushing DBs...');
	for (const [db, cached] of cache) {
		const path = getDBPath(db);
		if (cached.outdated) {
			cache.set(db, { ...cached, outdated: false });
			await fs.writeFile(path, JSON.stringify(cached.data, undefined, 2));
		}
	}
}

process.on('SIGINT', () => {
	saveDB.flush();
});

export const saveDB = debounce(_flush, { wait: 60_000 });
