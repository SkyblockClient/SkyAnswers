import { fetch, FetchResultTypes } from "@sapphire/fetch";
import * as v from "valibot";
import { repoFilesURL } from "../const.js";
import { levenshteinDistance } from "@std/text";
import { container } from "@sapphire/framework";
import memoize, { memoizeClear } from "memoize";
import { Time } from "@sapphire/time-utilities";
import { filterNullish } from "@sapphire/utilities";
import {
  EmbedBuilder,
  hyperlink,
  type InteractionReplyOptions,
} from "discord.js";
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

export const DataType = v.picklist(["mods", "packs"]);
export type DataType = v.InferOutput<typeof DataType>;

export const Data = v.looseObject({
  id: v.string(),
  nicknames: v.optional(v.array(v.string())),
  display: v.optional(v.string()),
});
export type Data = v.InferOutput<typeof Data>;

// const Action = z.object({
// 	icon: z.string().optional(),
// 	text: z.string().optional(),
// 	link: z.string().optional(),
// 	method: z.enum(['hover']).optional(),
// 	document: z.string().optional()
// });

export const Downloadable = v.looseObject({
  ...Data.entries,
  display: v.string(),
  // enabled: z.boolean().optional(),
  creator: v.optional(v.string()),
  description: v.string(),
  icon: v.optional(v.string()),
  // icon_scaling: z.literal('pixel').optional(),
  // discordcode: z.string().optional(),
  // actions: Action.array().optional(),
  categories: v.optional(v.array(v.string())),
  hidden: v.optional(v.boolean()),

  file: v.string(),
  url: v.optional(v.string()),
  hash: v.optional(v.string()),
});
export type Downloadable = v.InferOutput<typeof Downloadable>;

export const Mod = v.pipe(
  v.looseObject({
    ...Downloadable.entries,
    command: v.optional(v.string()),
    // warning: z
    // 	.object({
    // 		lines: z.string().array()
    // 	})
    // 	.optional(),
    // update_to_ids: z.string().array().optional(),
    // files: z.string().array().optional(),
    forge_id: v.optional(v.string()),
    packages: v.optional(v.array(v.string())),
  }),
  v.transform((v) => ({
    ...v,
    download: v.url || `${repoFilesURL}/mods/${v.file}`,
  })),
);
export type Mod = v.InferOutput<typeof Mod>;

export const Pack = v.pipe(
  v.looseObject({
    ...Downloadable.entries,
    screenshot: v.optional(v.string()),
  }),
  v.transform((v) => ({
    ...v,
    download: v.url || `${repoFilesURL}/packs/${v.file}`,
  })),
);
export type Pack = v.InferOutput<typeof Pack>;

export const Discord = v.looseObject({
  ...Data.entries,
  icon: v.optional(v.string()),
  description: v.optional(v.string()),
  // partner: z.boolean().optional(),
  // type: DataType.optional(),
  code: v.string(),
  fancyname: v.optional(v.string()),
  // mods: z.string().array().optional(),
  // packs: z.string().array().optional()
});
export type Discord = v.InferOutput<typeof Discord>;

export const Mods = v.array(Mod);
export const Packs = v.array(Pack);
export const Discords = v.array(Discord);

export const getMods = async () => v.parse(Mods, await getJSON("mods"));
export const getPacks = async () => v.parse(Packs, await getJSON("packs"));
export const getDiscords = async () =>
  v.parse(Discords, await getJSON("discords"));

export const queryData = <T extends Data>(items: T[], query: string) =>
  items.find((opt) => getDistance(opt, query) == 0);

export const probableMatches = <T extends Data>(items: T[], query: string) => {
  return (
    !query
      ? items
      : items.sort((a, b) => getDistance(a, query) - getDistance(b, query))
  ).slice(0, 25);
};

export function getDistance(item: Data, query: string) {
  const distances = [item.id, item.display, ...(item.nicknames || [])]
    .filter(filterNullish)
    .map((name) => name.toLowerCase())
    .map((name) => levenshteinDistance(query.toLowerCase(), name));
  return Math.min(...distances);
}

const isMod = (obj: unknown): obj is Mod => v.safeParse(Mod, obj).success;
const isPack = (obj: unknown): obj is Pack => v.safeParse(Pack, obj).success;

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

  const mods = v.parse(Mods, await getMods());
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
