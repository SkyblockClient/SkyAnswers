import { fetch, FetchResultTypes } from "@sapphire/fetch";
import { z } from "zod";
import { repoFilesURL } from "../const.js";
import { levenshteinDistance } from "@std/text";
import { container } from "@sapphire/framework";
import memoize, { memoizeClear } from "memoize";
import { Time } from "@sapphire/time-utilities";
import { filterNullish } from "@sapphire/utilities";
import { EmbedBuilder, hyperlink, InteractionReplyOptions } from "discord.js";
import { MessageBuilder } from "@sapphire/discord.js-utilities";

async function _getTrackedData(url: string): Promise<unknown> {
  container.logger.info("refetching", url);
  try {
    const resp = await fetch(url, FetchResultTypes.Result);
    if (!resp.ok) throw new Error(`http error ${resp.statusText}`);
    return resp.json();
  } catch (e) {
    container.logger.error(`error while fetching ${url}`, e);
    throw new Error(`error while fetching ${url}`);
  }
}
export const getTrackedData = memoize(_getTrackedData, { maxAge: Time.Hour });

export const getJSON = (jsonFilename: string) =>
  getTrackedData(`${repoFilesURL}/${jsonFilename}.json`);
export const invalidateTrackedData = () => memoizeClear(getTrackedData);

export const DataType = z.enum(["mods", "packs"]);
export type DataType = z.infer<typeof DataType>;

export const Data = z
  .object({
    id: z.string(),
    nicknames: z.string().array().optional(),
    display: z.string().optional(),
  })
  .passthrough();
export type Data = z.infer<typeof Data>;

// const Action = z.object({
// 	icon: z.string().optional(),
// 	text: z.string().optional(),
// 	link: z.string().optional(),
// 	method: z.enum(['hover']).optional(),
// 	document: z.string().optional()
// });

export const Downloadable = Data.extend({
  display: z.string(),
  // enabled: z.boolean().optional(),
  creator: z.string().optional(),
  description: z.string(),
  icon: z.string().optional(),
  // icon_scaling: z.literal('pixel').optional(),
  // discordcode: z.string().optional(),
  // actions: Action.array().optional(),
  categories: z.string().array().optional(),
  hidden: z.boolean().optional(),

  file: z.string(),
  url: z.string().optional(),
  hash: z.string().optional(),
}).passthrough();
export type Downloadable = z.infer<typeof Downloadable>;

export const Mod = Downloadable.extend({
  command: z.string().optional(),
  // warning: z
  // 	.object({
  // 		lines: z.string().array()
  // 	})
  // 	.optional(),
  // update_to_ids: z.string().array().optional(),
  // files: z.string().array().optional(),
  forge_id: z.string().optional(),
  packages: z.string().array().optional(),
})
  .passthrough()
  .transform((v) => ({
    ...v,
    download: v.url || `${repoFilesURL}/mods/${v.file}`,
  }));
export type Mod = z.infer<typeof Mod>;

export const Pack = Downloadable.extend({
  screenshot: z.string().optional(),
})
  .passthrough()
  .transform((v) => ({
    ...v,
    download: v.url || `${repoFilesURL}/packs/${v.file}`,
  }));
export type Pack = z.infer<typeof Pack>;

export const Discord = Data.extend({
  icon: z.string().optional(),
  description: z.string().optional(),
  // partner: z.boolean().optional(),
  // type: DataType.optional(),
  code: z.string(),
  fancyname: z.string().optional(),
  // mods: z.string().array().optional(),
  // packs: z.string().array().optional()
}).passthrough();
export type Discord = z.infer<typeof Discord>;

export const getMods = async () => Mod.array().parse(await getJSON("mods"));
export const getPacks = async () => Pack.array().parse(await getJSON("packs"));
export const getDiscords = async () =>
  Discord.array().parse(await getJSON("discords"));

export const queryData = <T extends Data>(items: T[], query: string) =>
  items.find((opt) => getDistance(opt, query) == 0);

export const probableMatches = <T extends Data>(items: T[], query: string) =>
  items
    .sort((a, b) => getDistance(a, query) - getDistance(b, query))
    .slice(0, 25);

export function getDistance(item: Data, query: string) {
  const distances = [item.id, item.display, ...(item.nicknames || [])]
    .filter(filterNullish)
    .map((name) => name.toLowerCase())
    .map((name) => levenshteinDistance(query.toLowerCase(), name));
  return Math.min(...distances);
}

const isMod = (obj: unknown): obj is Mod => Mod.safeParse(obj).success;
const isPack = (obj: unknown): obj is Pack => Pack.safeParse(obj).success;

export async function getDownloadableMessage(
  downloadable: Mod | Pack,
  bundledIn?: string,
): Promise<InteractionReplyOptions> {
  const message = new MessageBuilder();
  const embed = new EmbedBuilder({
    color: downloadable.hash
      ? Number("0x" + downloadable.hash.slice(0, 6))
      : undefined,
    title: downloadable.display,
    description: downloadable.description,
    footer: { text: `Created by ${downloadable.creator}` },
  });
  if (downloadable.icon)
    embed.setThumbnail(
      `${repoFilesURL}/icons/${encodeURIComponent(downloadable.icon)}`,
    );
  if (isPack(downloadable) && downloadable.screenshot)
    embed.setImage(downloadable.screenshot);
  if (downloadable.hidden)
    embed.addFields({
      name: "Note",
      value:
        "This item is hidden, so it won't show up in the normal installer. " +
        (bundledIn
          ? `You can get it in the bundle ${bundledIn}.`
          : "It might be internal or outdated."),
    });

  const mods = Mod.array().parse(await getMods());
  const downloads: string[] = [
    hyperlink(downloadable.file, encodeURI(downloadable.download)),
  ];
  if (isMod(downloadable) && downloadable.packages) {
    for (const pkgName of downloadable.packages) {
      const mod = mods.find((mod) => mod.id == pkgName);
      if (mod) downloads.push(hyperlink(mod.file, encodeURI(mod.download)));
      else downloads.push(pkgName);
    }
  }
  embed.addFields({
    name: downloads.length > 1 ? "Downloads" : "Download",
    value: downloads.join("\n"),
    inline: downloads.length == 1,
  });

  if (isMod(downloadable) && downloadable.command)
    embed.addFields({
      name: "Config Command",
      value: downloadable.command,
      inline: true,
    });

  return message.setEmbeds([embed]);
}
