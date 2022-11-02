import { getTrackedData } from "../../modules/data.js";
export const command = async ({ respond, member }) => {
  const mods = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/mods.json"
  );
  const activeMods = mods.filter((mod) => !mod.hidden);
  const modType = (mod) =>
    mod.packages
      ? 0
      : mod.categories?.includes("2;All Skyblock")
      ? 1
      : mod.categories?.includes("5;All PvP")
      ? 2
      : 3;
  const formatMods = (modList) =>
    modList
      .map((mod) => `- ${mod.display} by ${mod.creator}: ` + "`-mod " + mod.id + "`")
      .join("\n");

  const bundleStr = activeMods
    .filter((mod) => modType(mod) == 0)
    .map(
      (mod) => `- ${mod.display}: ` + [mod.id, ...mod.packages].map((p) => "`" + p + "`").join(", ")
    )
    .join("\n");
  const sbStr = formatMods(activeMods.filter((mod) => modType(mod) == 1));
  const pvpStr = formatMods(activeMods.filter((mod) => modType(mod) == 2));
  const otherStr = formatMods(activeMods.filter((mod) => modType(mod) == 3));
  const embed = {
    color: member.displayColor || 0x8ff03f,
    description: `**Bundles**
${bundleStr}
**Skyblock**
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
  starts: ["-mods", "-modlist"],
  desc: "Lists all the mods in SkyClient",
  input: false,
};
