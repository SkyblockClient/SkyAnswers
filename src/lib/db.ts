import * as fs from 'node:fs/promises';
import { JSONFilePreset } from 'lowdb/node';

try {
	await fs.mkdir('db');
}
catch {
	/* no op */
}

type BoostersDB = Record<string, string>;
export const BoostersDB = await JSONFilePreset<BoostersDB>(
	'db/boosters.json',
	{},
);

interface PendingUpdate {
	forge_id: string;
	url: string;
	hash: string;
	file: string;
	initiator: string;
	beta: boolean;
}
type PendingUpdatesDB = Record<string, PendingUpdate>;
export const PendingUpdatesDB = await JSONFilePreset<PendingUpdatesDB>(
	'db/pendingUpdates.json',
	{},
);
