import fetch from "cross-fetch";
import { createHash } from "crypto";
import { ButtonStyle, ComponentType, hyperlink, TextInputStyle } from "discord.js";
import JSZip from "jszip";
import { getTrackedData, queryDownloadable } from "./data.js";

const getDownloadableEmbed = (downloadable) => ({
  ...(downloadable.screenshot ? { image: { url: downloadable.screenshot } } : {}),
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

/**
 * @param {import("discord.js").Message} message
 * @param string query
 * @param string type
 */
export const findItem = async (message, query, type) => {
  const items = await getTrackedData(
    `https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/${type}.json`
  );
  const item = await queryDownloadable(items, query, type);
  if (!item) {
    await message.reply(`No ${type.slice(0, -1)} found for "${query}"`);
    return;
  }
  await message.reply({
    embeds: [getDownloadableEmbed(item)],
    allowedMentions: { repliedUser: false },
  });
};

/**
 * @param {string} query
 * @returns {import("discord.js").Message}
 */
export const getDiscordMessage = async (query) => {
  const items = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/discords.json"
  );
  const item = await queryDownloadable(items, query);
  if (!item) {
    return { content: `No discord found for "${query}"` };
  }
  const message = {
    content: "discord.gg/" + item.code,
    embeds: [
      {
        color: 0x8ff03f,
        title: item.fancyname,
      },
    ],
  };
  if (item.icon) {
    message.embeds[0].thumbnail = {
      url:
        "https://raw.githubusercontent.com/nacrt/SkyblockClient-REPO/main/files/discords/" +
        encodeURIComponent(item.icon),
    };
  }
  if (item.description) {
    message.embeds[0].description = item.description;
  }
  return message;
};

/**
 * @param {import("discord.js").Message} message
 */
export const listMods = async (message) => {
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
    color: message.member.displayColor || 0x8ff03f,
    description: `**Bundles**
${bundleStr}
**Skyblock**
${sbStr}
**PvP**
${pvpStr}
**Other**
${otherStr}`,
  };
  await message.reply({
    embeds: [embed],
  });
};
/**
 * @param {import("discord.js").Message} message
 */
export const listPacks = async (message) => {
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
    color: message.member.displayColor || 0x8ff03f,
    description: `**Skyblock**
${sbStr}
**PvP**
${pvpStr}
**Other**
${otherStr}`,
  };
  await message.reply({
    embeds: [embed],
  });
};

let activeModUpdates = {};
/**
 * @param {import("discord.js").Message} message
 * @param {string} url
 */
export const updateMod = async (message, url) => {
  if (
    !message.member.roles.cache.has("799020944487612428") &&
    !message.member.permissions.has("Administrator")
  ) {
    await message.reply("why do you think you can do this?");
    return;
  }
  const statusMsg = await message.reply(`downloading <${url}>...`);
  const modResp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36",
    },
  });
  if (!modResp.ok) {
    console.log(await modResp.text());
    throw modResp.statusText;
  }
  const modFile = await modResp.arrayBuffer();

  statusMsg.edit("unzipping...");
  const modZip = await JSZip.loadAsync(modFile);
  const modInfoFile = modZip.file("mcmod.info");
  let modId;
  if (modInfoFile) {
    const modInfoStr = await modInfoFile.async("text");
    const modInfo = JSON.parse(modInfoStr);
    modId = modInfo[0].modid;
  }

  statusMsg.edit(`getting the new data for ${modId}...`);
  const modData = {
    id: modId,
    url,
    file: decodeURI(url).split("/").pop(),
    hash: createHash("md5").update(new Uint8Array(modFile)).digest("hex"),
  };

  statusMsg.edit({
    content: `okay, ready to push out:
url: \`${modData.url}\`
filename: \`${modData.file}\`
hash: \`${modData.hash}\`
nothing will happen until you press a button`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          ...(modId
            ? [
                {
                  type: ComponentType.Button,
                  customId: "confirmModUpdate",
                  label: "Confirm",
                  style: ButtonStyle.Primary,
                },
              ]
            : []),
          {
            type: ComponentType.Button,
            customId: "editModUpdate",
            label: "Edit",
            style: ButtonStyle.Secondary,
          },
        ],
      },
    ],
  });
  activeModUpdates[statusMsg.id] = modData;
};
const sendNewMod = async (modData) => {
  const modsFileResp = await fetch(
    "https://api.github.com/repos/KTibow/SkyblockClient-REPO/contents/files/mods.json",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GH_KEY}`,
      },
    }
  );
  const modsFileInfo = await modsFileResp.json();
  const mods = JSON.parse(atob(modsFileInfo.content));

  const updatedMods = mods.map((mod) => (mod.id == modData.id ? { ...mod, ...modData } : mod));
  const resp = await fetch(
    "https://api.github.com/repos/KTibow/SkyblockClient-REPO/contents/files/mods.json",
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GH_KEY}`,
      },
      body: JSON.stringify({
        message: `Update ${modData.id} to ${modData.file}`,
        content: btoa(JSON.stringify(updatedMods, null, 4) + "\n"),
        sha: modsFileInfo.sha,
      }),
    }
  );
  if (!resp.ok) {
    console.log(await resp.text());
    throw resp.statusText;
  }
};

/**
 * @param {import("discord.js").Interaction} interaction
 */
const confirmModUpdate = async (interaction) => {
  if (
    !interaction.member.roles.cache.has("799020944487612428") &&
    !interaction.member.permissions.has("Administrator")
  ) {
    await interaction.reply({ content: "why do you think you can do this?", ephemeral: true });
    return;
  }
  await interaction.update({ content: "pushing out update...", components: [] });

  const source = interaction.message.id;
  const modData = activeModUpdates[source];
  await sendNewMod(modData);
  await interaction.message.edit(`updated ${modData.id} :D`);
};
/**
 * @param {import("discord.js").Interaction} interaction
 */
const editModUpdate = async (interaction) => {
  if (
    !interaction.member.roles.cache.has("799020944487612428") &&
    !interaction.member.permissions.has("Administrator")
  ) {
    await interaction.reply({ content: "why do you think you can do this?", ephemeral: true });
    return;
  }

  const source = interaction.message.id;
  const modData = activeModUpdates[source];
  const inputs = [
    {
      label: "Mod ID",
      customId: "id",
    },
    {
      label: "Mod URL",
      customId: "url",
    },
    {
      label: "Mod hash",
      customId: "hash",
    },
    {
      label: "Mod filename",
      customId: "file",
    },
  ];
  await interaction.showModal({
    title: "Edit the mod data",
    customId: "modalUpdate",
    components: inputs.map((i) => ({
      type: ComponentType.ActionRow,
      components: [
        {
          ...i,
          type: ComponentType.TextInput,
          value: modData[i.customId],
          style: TextInputStyle.Short,
        },
      ],
    })),
  });
};
/**
 * @param {import("discord.js").Interaction} interaction
 */
const handleModalUpdate = async (interaction) => {
  const modData = Object.fromEntries(interaction.fields.fields.map((i) => [i.customId, i.value]));
  await interaction.update({ content: "pushing out update...", components: [] });
  await sendNewMod(modData);
  await interaction.message.edit(`updated ${modData.id} (custom settings) :D`);
};

export const interactions = {
  confirmModUpdate,
  editModUpdate,
  modalUpdate: handleModalUpdate,
};
