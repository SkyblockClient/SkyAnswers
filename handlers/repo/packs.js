import { getTrackedData } from "../../modules/data.js";
export const command = async ({ member, respond }) => {
  const packs = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/packs.json"
  );
  const activePacks = packs.filter((pack) => !pack.hidden);
  const packType = (pack) =>
    pack.categories?.includes("1;All Skyblock")
      ? 1
      : pack.categories?.includes("3;All PvP")
      ? 2
      : 3;
  const formatPacks = (packList) =>
    packList
      .map((pack) => `- ${pack.display} by ${pack.creator}: ` + "`-pack " + pack.id + "`")
      .join("\n");

  const sbStr = formatPacks(activePacks.filter((pack) => packType(pack) == 1));
  const pvpStr = formatPacks(activePacks.filter((pack) => packType(pack) == 2));
  const otherStr = formatPacks(activePacks.filter((pack) => packType(pack) == 3));
  const embed = {
    color: member.displayColor || 0x8ff03f,
    description: `**Skyblock**
${sbStr}
**PvP**
${pvpStr}
**Other**
${otherStr}`,
  };
  await respond({
    embeds: [embed],
  });
};
export const when = {
  starts: ["-packs", "-packlist"],
  desc: "Lists all the packs in SkyClient",
  input: false,
};
