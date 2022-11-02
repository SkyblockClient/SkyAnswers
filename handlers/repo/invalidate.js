import { invalidateTrackedData } from "../../data.js";
export const command = async ({ respond, member }) => {
  if (!member.roles.cache.has("799020944487612428") && !member.permissions.has("Administrator")) {
    return await respond({ content: "why do you think you can do this?" });
  }
  invalidateTrackedData();
  await respond({ content: "cleared caches" });
};
export const when = {
  starts: ["-invalidate"],
  desc: "Clears the data (eg mods, autoresponses, etc) caches",
  input: false,
};
