import { resolve, join } from "path";
import * as fs from "fs/promises";
import * as ofs from "fs";
import { debounce } from "@sapphire/utilities";
import { z } from "zod";
const dbDir = resolve("./db");

try {
  await fs.mkdir(dbDir);
} catch {}

export enum DB {
  Boosters = "boosters",
  PendingUpdates = "pendingUpdates",
  // Presence = 'presence'
}

export const BoostersDB = z.record(z.string()).default({});
export type BoostersDB = z.infer<typeof BoostersDB>;

export const PendingUpdate = z.object({
  forge_id: z.string(),
  url: z.string(),
  hash: z.string(),
  file: z.string(),
  initiator: z.string(),
  beta: z.boolean(),
});
export type PendingUpdate = z.infer<typeof PendingUpdate>;
export const PendingUpdatesDB = z.record(PendingUpdate).default({});
export type PendingUpdatesDB = z.infer<typeof PendingUpdatesDB>;

// const PresenceDB = z.object({}).default({});

const DBZods: Record<DB, z.ZodType<unknown>> = {
  [DB.Boosters]: BoostersDB,
  [DB.PendingUpdates]: PendingUpdatesDB,
};

type CachedDB = { data?: unknown; outdated?: boolean };
const cache = new Map<DB, CachedDB>();

export async function readDB(db: DB): Promise<unknown> {
  const path = getDBPath(db);
  let data = cache.get(db)?.data;
  if (!data) {
    try {
      data = JSON.parse(await fs.readFile(path, "utf-8"));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code == "ENOENT") {
      } else throw e;
    }
    data = DBZods[db].parse(data);
    cache.set(db, { data });
  }
  DBZods[db].parse(data);
  return data;
}

export async function writeDB(db: DB.Boosters, data: BoostersDB): Promise<void>;
export async function writeDB(
  db: DB.PendingUpdates,
  data: PendingUpdatesDB,
): Promise<void>;
export async function writeDB(db: DB, data: unknown) {
  DBZods[db].parse(data);
  cache.set(db, { data, outdated: true });
  setImmediate(saveDB);
}

const getDBPath = (db: DB) => join(dbDir, `${db}.json`);

function _flush() {
  console.log("Flushing DBs...");
  for (const [db, cached] of cache) {
    const path = getDBPath(db);
    if (cached.outdated) {
      cache.set(db, { ...cached, outdated: false });
      ofs.writeFileSync(path, JSON.stringify(cached.data, undefined, 2));
    }
  }
}

process.on("SIGINT", () => {
  saveDB.flush();
  process.exit(0);
});

export const saveDB = debounce(_flush, { wait: 60_000 });
