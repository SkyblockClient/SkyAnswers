import { GuildMember } from "discord.js";
import { getJSON } from "./data.js";
import z from "zod";
import { SkyClient, isDevUser, Users } from "../const.js";

const ModOwner = z.object({
  github: z.string(),
  mods: z.record(z.enum(["update", "approve"])),
});
const ModOwners = z.record(ModOwner);

export const checkMember = async (member: GuildMember) => {
  if (member.roles.cache.has(SkyClient.roles.GitHubKeeper))
    return { all: true };
  if (isDevUser && member.id == Users.BotDev) return { all: true };

  const owners = ModOwners.parse(await getJSON("mod_owners"));
  const data = owners[member.id];
  if (data) {
    return {
      all: false,
      perms: data.mods,
    };
  }
  return { all: false };
};
