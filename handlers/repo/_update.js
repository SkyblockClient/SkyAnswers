import { getTrackedData } from "../../data.js";

/**
 * @param {{roles: import("discord.js").GuildMemberRoleManager; id: string;}} member
 */
export const checkMember = async (member) => {
  if (member.roles.cache.has("799020944487612428")) return { all: true };
  if (process.env.USER == "kendell" && member.id == "794377681331945524")
    return {
      all: true,
    };

  const owners = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/mod_owners.json"
  );
  const data = owners[member.id];
  if (data) {
    return {
      all: false,
      some: Object.keys(data.mods).filter((mod) => data.mods[mod] == "update"),
    };
  }
  return { all: false };
};
/**
 * @type {Record<string, { forge_id: string; url: string; hash: string; file: string; initiator: string; type: "normal" | "beta" }>}
 */
export const pendingUpdates = {};
