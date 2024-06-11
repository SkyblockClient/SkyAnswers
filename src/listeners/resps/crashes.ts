import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { getTrackedData } from "../../lib/data.js";
import { Message } from "discord.js";
import { z } from "zod";
import { Servers } from "../../const.js";
import { sleep } from "@sapphire/utilities";

/** Provides info and recommendations for crashes */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public override async run(message: Message<true>) {
    const msgLogs = message.attachments
      .filter(
        (attachment) =>
          attachment.name.endsWith(".txt") || attachment.name.endsWith(".log"),
      )
      .map((attachment) => attachment.url);

    const logsToCheck = [...msgLogs, ...findLogs(message.content)];
    if (logsToCheck.length > 0) message.channel.sendTyping();

    await Promise.all(
      logsToCheck.map(async (log) => {
        const resp = await fetch(log);
        const text = await resp.text();
        const info = await verbalizeCrash(
          text,
          message.guildId == Servers.SkyClient,
        );
        if (info) {
          await sleep(500);
          await message.channel.send(info);
        }
      }),
    );
  }
}

const CrashCause = z.object({
  method: z.enum(["contains", "contains_not", "regex"]),
  value: z.string(),
});
const CrashFix = z.object({
  name: z.string().optional(),
  fixtype: z.number().optional(),
  fix: z.string(),
  causes: CrashCause.array(),
});
const FixType = z.object({
  name: z.string(),
});
const Crashes = z.object({
  fixes: CrashFix.array(),
  fixtypes: FixType.array(),
  default_fix_type: z.number(),
});

function findLogs(txt: string) {
  const ret = [];

  const hastebinMatch = txt.match(/https:\/\/hst\.sh\/(?:raw\/)?([a-z]*)/i);
  if (hastebinMatch) ret.push(`https://hst.sh/raw/${hastebinMatch[1]}`);

  const mclogsMatch = txt.match(/https:\/\/mclo\.gs\/([a-z0-9]*)/i);
  if (mclogsMatch) ret.push(`https://api.mclo.gs/1/raw/${mclogsMatch[1]}`);

  return ret;
}

async function verbalizeCrash(log: string, isSkyclient?: boolean) {
  const pathIndicator = "`";
  const gameRoot = ".minecraft";
  const profileRoot = isSkyclient ? ".minecraft/skyclient" : ".minecraft";
  const crashData = Crashes.parse(
    await getTrackedData(
      "https://github.com/SkyblockClient/CrashData/raw/main/crashes.json",
    ),
  );
  const relevantInfo = crashData.fixes.filter((fix) =>
    fix.causes.every((type) => {
      if (type.method == "contains") return log.includes(type.value);
      else if (type.method == "regex") return log.match(new RegExp(type.value));
      else if (type.method == "contains_not") return !log.includes(type.value);
      else return false;
    }),
  );

  const cheater = relevantInfo.find((info) => info.fix.startsWith("Cheater"));
  if (cheater) return `# ${cheater.fix}`;

  const crashGroups = crashData.fixtypes.map((type, i) => {
    const groupInfo = relevantInfo.filter(
      (info) => (info.fixtype ?? crashData.default_fix_type) == i,
    );
    if (!groupInfo.length) return;
    return `**${type.name}**
${groupInfo
  .map((info) =>
    info.fix
      .replaceAll("%pathindicator%", pathIndicator)
      .replaceAll("%gameroot%", gameRoot)
      .replaceAll("%profileroot%", profileRoot),
  )
  .join("\n")}`;
  });
  return crashGroups.filter(Boolean).join("\n");
}
