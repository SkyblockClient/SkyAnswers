import { getTrackedData, queryDownloadable } from "../../data.js";
import { hyperlink } from "discord.js";
export const getDownloadableEmbed = (downloadable) => ({
  ...(downloadable.screenshot ? { image: { url: encodeURI(downloadable.screenshot) } } : {}),
  color: downloadable.hash && Number("0x" + downloadable.hash.slice(0, 6)),
  title: downloadable.display,
  description: downloadable.description,
  fields: [
    ...(downloadable.command ? [{ name: "Command", value: downloadable.command }] : []),
    ...(downloadable.hidden
      ? [
          {
            name: "Warning",
            value:
              "This item is hidden, so it won't show up in the normal installer. It might be internal, part of a bundle, or outdated.",
          },
        ]
      : []),
    { name: "Download", value: hyperlink(downloadable.file, encodeURI(downloadable.download)) },
  ],
  footer: { text: `Created by ${downloadable.creator}` },
  thumbnail: {
    url: `https://raw.githubusercontent.com/nacrt/SkyblockClient-REPO/main/files/icons/${encodeURIComponent(
      downloadable.icon
    )}`,
  },
});
export const command = async ({ content, respond }, query) => {
  const type = content.startsWith("-mod") ? "mod" : "pack";
  const items = await getTrackedData(
    `https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/${type}s.json`
  );
  const item = await queryDownloadable(items, query, type);
  if (!item) {
    return await respond({ content: `No ${type} found for "${query}"` });
  }
  await respond({
    embeds: [getDownloadableEmbed(item)],
  });
};
export const when = {
  starts: ["-mod", "-pack"],
  desc: "Gives info about a mod or pack",
  input: true,
  public: true,
};
