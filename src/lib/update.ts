import { GuildMember } from "discord.js";
import { getJSON } from "./data.js";
import { z } from "zod/v4-mini";
import { SkyClient, isDevUser, Users } from "../const.js";

const Permission = z.enum(["update", "approve"]);
type Permission = z.infer<typeof Permission>;

const UpdatePerm = z.object({
  github: z.string(),
  mods: z.optional(z.record(z.string(), Permission)),
  packs: z.optional(z.record(z.string(), Permission)),
});
const UpdatePerms = z.record(z.string(), UpdatePerm);

export const getUpdatePerms = async () =>
  await getJSON("update_perms", UpdatePerms);

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
