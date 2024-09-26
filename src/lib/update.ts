import { GuildMember } from "discord.js";
import { getJSON } from "./data.js";
import * as v from "valibot";
import { SkyClient, isDevUser, Users } from "../const.js";

const Permission = v.picklist(["update", "approve"]);
type Permission = v.InferOutput<typeof Permission>;

const UpdatePerm = v.object({
  github: v.string(),
  mods: v.optional(v.record(v.string(), Permission)),
  packs: v.optional(v.record(v.string(), Permission)),
});
const UpdatePerms = v.record(v.string(), UpdatePerm);

export async function getUpdatePerms() {
  return v.parse(UpdatePerms, await getJSON("update_perms"));
}

export async function checkMember(member: GuildMember): Promise<
  | { all: true }
  | {
      all: false;
      mods?: Record<string, Permission>;
      packs?: Record<string, Permission>;
    }
> {
  if (member.roles.cache.has(SkyClient.roles.GitHubKeeper))
    return { all: true };
  if (isDevUser && member.id == Users.BotDev) return { all: true };

  const owners = await getUpdatePerms();
  const data = owners[member.id];
  if (data) return { all: false, mods: data.mods, packs: data.packs };
  return { all: false };
}
