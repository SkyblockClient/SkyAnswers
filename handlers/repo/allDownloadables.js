import { getTrackedData } from "../../data.js";
import { hyperlink } from "discord.js";

/**
 * @param {import("../../bot.js").MessageDataPublic} message
 */
export const command = async ({ content, member, channel, respond }) => {
  const type = content.startsWith("-mod") ? "mod" : "pack";
  const items = await getTrackedData(
    `https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/${type}s.json`
  );
  const activeItems = items.filter((item) => !item.hidden);
  const categorizeItem = (item) =>
    item.packages
      ? 0
      : item.categories?.includes("2;All Skyblock") ||
        item.categories?.includes("1;All Skyblock")
      ? 1
      : item.categories?.includes("5;All PvP") ||
        item.categories?.includes("3;All PvP")
      ? 2
      : 3;
  const listItems = (items) =>
    items
      .map((item) => {
        const download =
          item.url ||
          `https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/${type}s/${item.file}`;
        const url = download.includes(" ") ? encodeURI(download) : download;
        return hyperlink(item.file, url);
      })
      .join("\n");
  const bundles = listItems(
    activeItems.filter((item) => categorizeItem(item) == 0)
  );
  const skyblockItems = listItems(
    activeItems.filter((item) => categorizeItem(item) == 1)
  );
  const pvpItems = listItems(
    activeItems.filter((item) => categorizeItem(item) == 2)
  );
  const otherItems = listItems(
    activeItems.filter((item) => categorizeItem(item) == 3)
  );
  const embeds = [];
  Object.entries({
    Bundles: bundles,
    Skyblock: skyblockItems,
    PvP: pvpItems,
    Other: otherItems,
  }).map(([title, items]) => {
    if (items)
      embeds.push({
        title,
        color: member.displayColor || 0x8ff03f,
        description: items,
      });
  });
  const totalLength = embeds.reduce((a, b) => a + b.description.length, 0);
  if (totalLength > 5000) {
    await respond({
      embeds: embeds.slice(0, -1),
    });
    await channel.send({
      embeds: embeds.slice(-1),
    });
    return;
  }
  await respond({
    embeds,
  });
};
export const when = {
  starts: ["-moddl", "-packdl"],
  desc: "Gives you all of the mods/packs' links",
  input: false,
  public: true,
};
