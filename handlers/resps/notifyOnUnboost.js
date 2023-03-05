/**
 * @param {import("discord.js").GuildMember} oldUser
 * @param {import("discord.js").GuildMember} user
 */
export const command = async (oldUser, user) => {
  const verboseBotLogs = user.client.channels.cache.get("934968221923168266");
  if (oldUser.roles.cache.has("829336516315971626") && !user.roles.cache.has("829336516315971626"))
    verboseBotLogs.send(user.id + " stopped boosting");
  if (!oldUser.roles.cache.has("829336516315971626") && user.roles.cache.has("829336516315971626"))
    verboseBotLogs.send(user.id + " started boosting");
};
export const when = {
  all: "member updates",
  desc: "Tracks when people (un)boost",
};
