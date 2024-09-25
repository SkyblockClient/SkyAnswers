import { type Snowflake } from "discord.js";
import * as fs from "fs/promises";
import { JSONFilePreset } from "lowdb/node";

try {
  await fs.mkdir("db");
} catch {
  // Directory already exists
}

type BoostersDB = Record<Snowflake, string>;
export const BoostersDB = await JSONFilePreset<BoostersDB>(
  "db/boosters.json",
  {},
);

export type ModUpdate = {
  type: "mod";
  forge_id: string;
  url: string;
  hash: string;
  file: string;
  initiator: string;
  beta: boolean;
};
export type PackUpdate = {
  type: "pack";
  packId: string;
  url: string;
  hash: string;
  file: string;
  initiator: string;
};

export type PendingUpdate = ModUpdate | PackUpdate;
type PendingUpdatesDB = Record<string, PendingUpdate>;
export const PendingUpdatesDB = await JSONFilePreset<PendingUpdatesDB>(
  "db/pendingUpdates.json",
  {},
);
