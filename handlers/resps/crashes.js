import { getTrackedData } from "../../data.js";
const hastebinRegex = /https:\/\/hst\.sh\/(?:raw\/)?([a-z]*)/i;

const verbalizeCrash = async (log, isSkyclient) => {
  const pathIndicator = "`";
  const gameRoot = ".minecraft";
  const profileRoot = isSkyclient ? ".minecraft/skyclient" : ".minecraft";
  const crashData = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/CrashData/main/crashes.json"
  );
  const relevantInfo = crashData.fixes.filter((fix) =>
    fix.causes.every((type) => {
      if (type.method == "contains") return log.includes(type.value);
      else if (type.method == "regex") return log.match(new RegExp(type.value));
      else if (type.method == "contains_not") return !log.includes(type.value);
    })
  );
  const crashGroups = crashData.fixtypes.map((type, i) => {
    const groupInfo = relevantInfo.filter(
      (info) => (info.fixtype ?? crashData.default_fix_type) == i
    );
    if (!groupInfo.length) return;
    return `**${type.name}**
${groupInfo
  .map((info) =>
    info.fix
      .replaceAll("%pathindicator%", pathIndicator)
      .replaceAll("%gameroot%", gameRoot)
      .replaceAll("%profileroot%", profileRoot)
  )
  .join("\n")}`;
  });
  return crashGroups.filter((group) => group).join("\n");
};
/**
 * @param {import("discord.js").Message} message
 */
export const command = async (message) => {
  const hasLogs = message.attachments.some(
    (attachment) => /crash.+-client\.txt/.test(attachment.name) || attachment.name.endsWith(".log")
  );
  if (hasLogs) message.channel.sendTyping();

  const logsToCheck = message.attachments
    .filter((attachment) => attachment.name.endsWith(".txt") || attachment.name.endsWith(".log"))
    .map((attachment) => attachment.url);
  const hastebinMatch = message.content.match(hastebinRegex);
  if (hastebinMatch) logsToCheck.push(`https://hst.sh/raw/${hastebinMatch[1]}`);

  await Promise.all(
    logsToCheck.map(async (log) => {
      const resp = await fetch(log);
      const text = await resp.text();
      const info = await verbalizeCrash(text);
      if (info) await message.channel.send(info);
    })
  );
};
export const when = {
  all: "messages",
  desc: "Provides info and recommendations for crashes",
  public: true,
};
