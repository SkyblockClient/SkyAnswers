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

export type Approver = {
  name: string;
  id: Snowflake;
};
export type PartialUpdate = {
  id: string;
  url: string;
  hash: string;
  sha256: string;
  file: string;
  pingMsg?: string;
  approvers: Approver[];
};
export type ModUpdate = PartialUpdate & {
  type: "mod";
  beta: boolean;
};
export type PackUpdate = PartialUpdate & { type: "pack" };

export type PendingUpdate = ModUpdate | PackUpdate;
type PendingUpdatesDB = Record<string, PendingUpdate>;
export const PendingUpdatesDB = await JSONFilePreset<PendingUpdatesDB>(
  "db/pendingUpdates.json",
  {},
);
