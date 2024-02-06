import { createHash } from "crypto";
import { ButtonStyle, ComponentType } from "discord.js";
import JSZip from "jszip";
import { getTrackedData } from "../../data.js";
import { checkMember, pendingUpdates } from "./_update.js";

/**
 * @param {import("../../bot.js").MessageData} message
 */
export const command = async ({ member, respond, content, channel, guild,  }) => {
  const perms = await checkMember(member);
  if (!perms.all && !perms.perms) {
    if (member.permissions.has("Administrator")) {
      await respond({
        content: "💡 assign yourself Github Keeper",
      });
      return;
    }
    await respond({
      content: "<:youwhat:889306727953104936> you can't update any mods",
    });
    return;
  }

  const isBeta = content.startsWith("-bupdate");

  const isProper =
    guild.id != "780181693100982273" || channel.id == "1198710827327434852";
  if (!isProper) {
    await respond({
      content: "💡 this command is only available in <#1198710827327434852>",
    });
    return;
  }

  const msg = await respond({ content: "👀 loading this mod..." });

  const url = content.split(" ").slice(1).join(" ");
  const modResp = await fetch(url, {
    headers: {
      "User-Agent": "github.com/SkyblockClient/SkyAnswers",
    },
  });
  if (!modResp.ok) {
    console.error(await modResp.text());
    throw new Error(`${modResp.statusText} while fetching ${url}`);
  }
  const modFile = await modResp.arrayBuffer();

  const modZip = await JSZip.loadAsync(modFile);
  const modInfoFile = modZip.file("mcmod.info");
  /** @type {string} */
  let modId;
  if (modInfoFile) {
    const modInfoStr = await modInfoFile.async("text");
    const modInfo = JSON.parse(modInfoStr);
    modId = modInfo[0].modid;
  }

  if (!modId) {
    await msg.edit("🫨 this mod doesn't have a mod id");
    return;
  }
  if (!perms.all && (perms.perms ? perms.perms[modId] != "update" : false)) {
    await msg.edit(`🫨 you can't update that mod`);
    return;
  }

  const data = {
    forge_id: modId,
    url,
    file: decodeURI(url).split("/").pop().split("?")[0],
    hash: createHash("md5").update(new Uint8Array(modFile)).digest("hex"),
  };
  const mods = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/" + (isBeta ? "mods_beta.json" : "mods.json")
  );
  const existingMod = mods.find((mod) => mod.forge_id == modId);
  if (!existingMod) {
    await msg.edit("🤔 that mod doesn't exist");
    return;
  }
  if (
    existingMod.url == data.url &&
    existingMod.file == data.file &&
    existingMod.hash == data.hash
  ) {
    await msg.edit("🤔 nothing to change");
    return;
  }

  pendingUpdates[msg.id] = { ...data, initiator: member.id, type: isBeta ? "beta" : "normal" };
  await msg.edit({
    content: "👀 does this look alright?",
    embeds: [
      {
        description: `forge_id: ${data.forge_id}
url: ${data.url}
file: ${data.file}
md5: ${data.hash}`,
      },
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: "updateCheck1",
            label: "Start double-check",
            style: ButtonStyle.Success,
          },
        ],
      },
    ],
  });
};
export const when = {
  starts: ["-update", "-bupdate"],
  desc: "Updates a mod to the latest version supplied",
  input: true,
};
