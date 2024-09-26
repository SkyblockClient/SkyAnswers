import { Events, Listener, container } from "@sapphire/framework";
import { Client } from "discord.js";
import { ApplyOptions } from "@sapphire/decorators";
import { BoostersDB } from "../../lib/db.js";
import { SkyClient } from "../../const.js";
import * as v from "valibot";
import { readGHFile, writeGHFile } from "../../lib/GHAPI.js";
import { format } from "prettier";
import { Time } from "@sapphire/time-utilities";
import { envParseString } from "@skyra/env-utilities";

@ApplyOptions<Listener.Options>({
  name: "boost-maintain",
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  public override async run(client: Client<true>) {
    if (!envParseString("GH_KEY", null))
      return container.logger.error("Missing GitHub API Key!");
    await run(client);
    setInterval(() => void run(client), Time.Minute * 5);
  }
}

const TagsJSON = v.object({
  tags: v.record(
    v.string(),
    v.union([v.tuple([v.string(), v.string()]), v.tuple([v.string()])]),
  ),
  perms: v.record(v.string(), v.array(v.string())),
  whitelist: v.boolean(),
  whitelisted: v.array(v.string()),
});

export async function run(client: Client<true>) {
  try {
    const members = client.guilds.cache.get(SkyClient.id)?.members;
    if (!members) return;
    const db = BoostersDB.data;
    const boosters: string[] = [];
    for (const [discordID, mcUUID] of Object.entries(db)) {
      const member = members.resolve(discordID);
      if (!member || !member.premiumSince) continue;
      boosters.push(mcUUID);
    }
    boosters.sort();

    await updateBoosters(
      "SkyblockClient/Website",
      "docs/assets/tags.json",
      boosters,
    );
  } catch (e) {
    container.logger.error("Failed to update boosters", e);
  }
}

async function updateBoosters(repo: string, path: string, boosters: string[]) {
  const oldFile = await readGHFile(repo, path);
  const tags = v.parse(TagsJSON, JSON.parse(oldFile.content));
  tags.perms["Booster"] = boosters;

  const content = await format(JSON.stringify(tags), { parser: "json" });
  await writeGHFile(oldFile, content, "chore: update booster list");
}
