import { AuditLogEvent } from "discord.js";

/**
 * @param {import("discord.js").GuildMember | import("discord.js").PartialGuildMember} _
 * @param {import("discord.js").GuildMember | import("discord.js").PartialGuildMember} user
 */
export const command = async (_, user) => {
  if (user.id != "794377681331945524") return;
  const fetchedUpdateLogs = await user.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberUpdate,
  });
  const fetchedRoleLogs = await user.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberRoleUpdate,
  });
  const lastUpdateLog = fetchedUpdateLogs.entries.first();
  const lastRoleLog = fetchedRoleLogs.entries.first();
  const updateLog =
    (lastUpdateLog?.target?.id == user.id && lastUpdateLog) ||
    (lastRoleLog?.target?.id == user.id && lastRoleLog);
  if (updateLog) {
    await user.send(
      `${updateLog.executor} updated you. Changes:
` +
        "```json\n" +
        JSON.stringify(updateLog.changes, null, 2) +
        "\n```"
    );
  } else {
    await user.send(
      "You were updated, but the audit log was for someone else."
    );
  }
};
export const when = {
  all: "member updates",
  desc: "Tells kti when they get updated",
};
