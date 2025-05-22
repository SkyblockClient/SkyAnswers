import { fetch, FetchResultTypes } from "@sapphire/fetch";
import { z } from "zod/v4-mini";
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
import type { StandardSchemaV1 } from "@standard-schema/spec";

async function _getTrackedURL(url: string): Promise<unknown> {
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
const getTrackedURL = memoize(_getTrackedURL, { maxAge: Time.Hour });

export async function getTrackedData(url: string): Promise<unknown>;
export async function getTrackedData<T extends StandardSchemaV1>(
  url: string,
  schema: T,
): Promise<StandardSchemaV1.InferOutput<T>>;
export async function getTrackedData(
  url: string,
  schema: StandardSchemaV1 = z.unknown(),
): Promise<unknown> {
  const resp = await getTrackedURL(url);
  let ret = schema["~standard"].validate(resp);
  if (ret instanceof Promise) ret = await ret;

  if (ret.issues) throw new Error(JSON.stringify(ret.issues, null, 2));
  return ret.value;
}

export async function getJSON(filename: string): Promise<unknown>;
export async function getJSON<T extends StandardSchemaV1>(
  filename: string,
  schema: T,
): Promise<StandardSchemaV1.InferOutput<T>>;
export async function getJSON(
  filename: string,
  schema: StandardSchemaV1 = z.unknown(),
): Promise<unknown> {
  return await getTrackedData(`${repoFilesURL}/${filename}.json`, schema);
}

export const invalidateTrackedData = () => memoizeClear(getTrackedURL);

export const DataType = z.enum(["mods", "packs"]);
export type DataType = z.infer<typeof DataType>;

export const Data = z.looseObject({
  id: z.string(),
  nicknames: z.optional(z.array(z.string())),
  display: z.optional(z.string()),
});
export type Data = z.infer<typeof Data>;

// const Action = z.object({
// 	icon: z.string().optional(),
// 	text: z.string().optional(),
// 	link: z.string().optional(),
// 	method: z.enum(['hover']).optional(),
// 	document: z.string().optional()
// });

export const Downloadable = z.extend(Data, {
  display: z.string(),
  // enabled: z.boolean().optional(),
  creator: z.optional(z.string()),
  description: z.string(),
  icon: z.optional(z.string()),
  // icon_scaling: z.literal('pixel').optional(),
  // discordcode: z.string().optional(),
  // actions: Action.array().optional(),
  categories: z.optional(z.array(z.string())),
  hidden: z.optional(z.boolean()),

  file: z.string(),
  url: z.optional(z.string()),
  hash: z.optional(z.string()),
  sha256: z.optional(z.string()),
});
export type Downloadable = z.infer<typeof Downloadable>;

export const Mod = z.pipe(
  z.extend(Downloadable, {
    command: z.optional(z.string()),
    // warning: z
    // 	.object({
    // 		lines: z.string().array()
    // 	})
    // 	.optional(),
    // update_to_ids: z.string().array().optional(),
    // files: z.string().array().optional(),
    forge_id: z.optional(z.string()),
    packages: z.optional(z.array(z.string())),
  }),
  z.transform((v) => ({
    ...v,
    download: v.url || `${repoFilesURL}/mods/${v.file}`,
  })),
);
export type Mod = z.output<typeof Mod>;

export const Pack = z.pipe(
  z.extend(Downloadable, {
    screenshot: z.optional(z.string()),
  }),
  z.transform((v) => ({
    ...v,
    download: v.url || `${repoFilesURL}/packs/${v.file}`,
  })),
);
export type Pack = z.output<typeof Pack>;

export const Discord = z.extend(Data, {
  icon: z.optional(z.string()),
  description: z.optional(z.string()),
  // partner: z.boolean().optional(),
  // type: DataType.optional(),
  code: z.string(),
  fancyname: z.optional(z.string()),
  // mods: z.string().array().optional(),
  // packs: z.string().array().optional()
});
export type Discord = z.infer<typeof Discord>;

export const Mods = z.array(Mod);
export const Packs = z.array(Pack);
export const Discords = z.array(Discord);

export const getMods = async () => await getJSON("mods", Mods);
export const getPacks = async () => await getJSON("packs", Packs);
export const getDiscords = async () => await getJSON("discords", Discords);

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

  const mods = await getMods();
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
