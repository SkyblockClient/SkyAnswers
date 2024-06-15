import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { getTrackedData } from "../../lib/data.js";
import { ButtonStyle, ComponentType, Message } from "discord.js";
import { z } from "zod";
import { SkyClient } from "../../const.js";
import { postLog } from "../../lib/mcLogs.js";
import { FetchResultTypes, fetch } from "@sapphire/fetch";

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

    const log = [...msgLogs, ...findLogs(message.content)].at(0);
    if (!log) return;
    // TODO: https://github.com/aternosorg/mclogs/issues/116
    const toDelete = true; // !log.includes("mclo.gs/");

    await message.channel.sendTyping();

    const mcLog = await getNewLog(log);
    const text = await mcLog.getRaw();
    const insights = await mcLog.getInsights();

    const resp = [`${message.author} uploaded a ${insights.type}.`];

    const verb = await verbalizeCrash(text, message.guildId == SkyClient.id);
    if (verb) resp.push(verb);

    await message.channel.send({
      content: resp.join("\n"),
      embeds: [
        {
          title: `${insights.title} #${mcLog.id}`,
          url: mcLog.url,
          thumbnail: { url: "https://mclo.gs/img/logo.png" },
          fields: insights.analysis.information.map((v) => ({
            name: v.label,
            value: v.value,
            inline: true,
          })),
          author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL(),
          },
        },
      ],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              label: "Open Log",
              url: mcLog.url,
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              label: "Open Raw Log",
              url: mcLog.raw,
            },
          ],
        },
      ],
      allowedMentions: { parse: [] },
    });
    if (toDelete) await message.delete();
  }
}

// We want to use mclo.gs to censor logs,
// but we don't need to upload if the log is already from MCLogs.
async function getNewLog(url: string) {
  // TODO: https://github.com/aternosorg/mclogs/issues/116
  //if (url.includes("mclo.gs")) return getMCLog(url);

  let text = await fetch(url, FetchResultTypes.Text);
  text = text.replaceAll(/\w+\.\w+\.\w+:\w+/g, "REDACTED");
  return await postLog(text);
}

function findLogs(txt: string) {
  const ret = [];

  const hastebinMatch = txt.match(/hst\.sh\/(?:raw\/)?([a-z]+)/i);
  if (hastebinMatch) ret.push(`https://hst.sh/raw/${hastebinMatch[1]}`);

  const mclogsMatch = txt.match(/mclo\.gs\/(?:\/1\/raw)?([a-z0-9]+)/i);
  if (mclogsMatch) ret.push(`https://api.mclo.gs/1/raw/${mclogsMatch[1]}`);

  return ret;
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
