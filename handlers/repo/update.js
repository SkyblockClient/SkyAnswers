import JSZip from "jszip";
import fetch from "cross-fetch";
import { createHash } from "crypto";
import { ComponentType, ButtonStyle } from "discord.js";
import { format } from "prettier";

const modsFileEndpoint =
  "https://api.github.com/repos/" +
  (process.env.USER == "ubuntu" ? "SkyblockClient" : "KTibow") +
  "/SkyblockClient-REPO/contents/files/mods.json";
export let activeUpdates = [];
export const sendNewMod = async (modData) => {
  const modsFileResp = await fetch(modsFileEndpoint, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GH_KEY}`,
    },
  });
  const modsFileInfo = await modsFileResp.json();
  const mods = JSON.parse(atob(modsFileInfo.content));

  const updatedMods = mods.map((mod) =>
    (modData.forge_id && mod.forge_id == modData.forge_id) || (modData.id && mod.id == modData.id)
      ? { ...mod, ...modData }
      : mod
  );
  if (JSON.stringify(updatedMods) == JSON.stringify(mods)) throw "Identical files";
  const resp = await fetch(modsFileEndpoint, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GH_KEY}`,
    },
    body: JSON.stringify({
      message: `Update ${modData.forge_id || modData.id} to ${modData.file}`,
      content: btoa(format(JSON.stringify(updatedMods), { parser: "json", tabWidth: 4 })),
      sha: modsFileInfo.sha,
    }),
  });
  if (!resp.ok) {
    console.log(await resp.text());
    throw resp.statusText;
  }
};
export const command = async ({ member, respond, content }) => {
  if (!member.roles.cache.has("799020944487612428") && !member.permissions.has("Administrator")) {
    return await respond({ content: "why do you think you can do this?" });
  }
  const url = content.slice(8);
  const statusMsg = await respond({ content: `downloading <${url}>...` });
  const modResp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36",
    },
  });
  if (!modResp.ok) {
    console.error(await modResp.text());
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
    forge_id: modId,
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
  activeUpdates[statusMsg.id] = modData;
};
export const when = {
  starts: ["-update"],
  desc: "Updates a mod to the latest version supplied",
  input: true,
};
