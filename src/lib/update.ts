import { GuildMember } from "discord.js";
import { getJSON } from "./data.js";
import z from "zod";
import { SkyClient, isDevUser, Users } from "../const.js";

const Permission = z.enum(["update", "approve"]);
type Permission = z.infer<typeof Permission>;

const ModOwner = z.object({
  github: z.string(),
  mods: z.record(Permission).optional(),
  packs: z.record(Permission).optional(),
});
const ModOwners = z.record(ModOwner);

export async function checkMember(member: GuildMember): Promise<
  | { all: true }
  | {
      all: false;
      mods?: Record<string, Permission>;
      packs?: Record<string, Permission>;
    }
> {
  if (member.permissions.has("Administrator")) return { all: true };
  if (member.roles.cache.has(SkyClient.roles.GitHubKeeper))
    return { all: true };
  if (isDevUser && member.id == Users.BotDev) return { all: true };

  const owners = ModOwners.parse(await getJSON("update_perms"));
  const data = owners[member.id];
  if (data) return { all: false, mods: data.mods, packs: data.packs };
  return { all: false };
}
