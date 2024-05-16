/**
 * @param {import("discord.js").GuildMember | import("discord.js").PartialGuildMember} oldUser
 * @param {import("discord.js").GuildMember | import("discord.js").PartialGuildMember} user
 */
export const command = async (oldUser, user) => {
  const verboseBotLogs = /** @type {import("discord.js").TextChannel} */ (
    user.client.channels.cache.get("934968221923168266")
  );
  if (
    oldUser.roles.cache.has("829336516315971626") &&
    !user.roles.cache.has("829336516315971626")
  )
    verboseBotLogs.send(`${user.id} (${user.user.username}) stopped boosting`);
  if (
    !oldUser.roles.cache.has("829336516315971626") &&
    user.roles.cache.has("829336516315971626")
  )
    verboseBotLogs.send(`${user.id} (${user.user.username}) started boosting`);
};
export const when = {
  all: "member updates",
  desc: "Tracks when people (un)boost",
};
