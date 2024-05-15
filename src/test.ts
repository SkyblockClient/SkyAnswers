import { z } from 'zod';
import { getTrackedData } from './data.js';

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

try {
	const crashData = Crashes.parse(await getTrackedData('https://github.com/SkyblockClient/CrashData/raw/main/crashes.json'));
	console.log(crashData);
} catch (e) {
	console.log(JSON.stringify(e));
}
