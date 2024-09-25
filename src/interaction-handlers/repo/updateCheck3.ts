import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
  container,
} from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import { format } from "prettier";
import { checkMember } from "../../lib/update.js";
import { Emojis, isDevUser } from "../../const.js";
import { notSkyClient } from "../../preconditions/notPublic.js";
import { Mod, Pack, invalidateTrackedData } from "../../lib/data.js";
import {
  PendingUpdatesDB,
  type ModUpdate,
  type PackUpdate,
} from "../../lib/db.js";
import { envParseString } from "@skyra/env-utilities";
import {
  commitFiles,
  readGHContent,
  type FileToCommit,
} from "../../lib/GHAPI.ts";

const owner = "SkyBlockClient";
const repo = "SkyblockClient-REPO";
const branch = "main";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
  public async run(interaction: ButtonInteraction) {
    if (!envParseString("GH_KEY", null))
      return interaction.reply(`Missing GitHub API Key! ${Emojis.BlameWyvest}`);
    if (notSkyClient(interaction.guildId)) return;

    const pendingUpdates = PendingUpdatesDB.data;
    const data = pendingUpdates[interaction.message.id];
    if (!data)
      return interaction.reply({
        content: "no update found",
        ephemeral: true,
      });
    if (data.initiator == interaction.user.id && !isDevUser)
      return interaction.reply({
        content: "you need someone else to approve this update",
        ephemeral: true,
      });

    const member = interaction.guild?.members.resolve(interaction.user);
    if (!member) return;
    const perms = await checkMember(member);
    const approved =
      perms.all ||
      (data.type == "mod" && perms.mods && data.forge_id in perms.mods) ||
      (data.type == "pack" && perms.packs && data.packId in perms.packs);
    if (!approved)
      return interaction.reply({
        content: "you can't approve this update",
        ephemeral: true,
      });

    const changes: FileToCommit[] = [];

    if (data.url.startsWith("https://cdn.discordapp.com/")) {
      await interaction.update({
        content: "one second we need to download then upload the file",
        components: [],
      });

      let fileData: ArrayBuffer;
      try {
        const fileResp = await fetch(data.url, {
          headers: { "User-Agent": "github.com/SkyblockClient/SkyAnswers" },
        });
        if (!fileResp.ok)
          throw new Error(`${fileResp.statusText} while fetching ${data.url}`);
        fileData = await fileResp.arrayBuffer();
      } catch (e) {
        container.logger.error("Failed to download file", e);
        await interaction.message.edit("failed to download file");
        throw e;
      }
      // if (!modData) throw new Error("this shouldn't happen");

      const path = `files/${data.type}s/${data.file}`;
      changes.push({ path, content: fileData });
      data.url = `https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/${path}`;
    }

    await interaction.message.edit({
      content: "one second just need to scream commands at github",
      components: [],
    });

    if (data.type == "mod") await updateMod(data, changes);
    else await updatePack(data, changes);

    await PendingUpdatesDB.update((data) => {
      delete data[interaction.message.id];
    });
    invalidateTrackedData();

    return interaction.message.edit({
      content: `✅ pushed it out`,
      components: [],
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== "updateCheck3") return this.none();
    return this.some();
  }
}

async function updateMod(data: ModUpdate, changes: FileToCommit[]) {
  let mods = JSON.parse(
    await readGHContent(`${owner}/${repo}`, "files/mods.json"),
  ) as Mod[];
  if (!isModList(mods)) throw new Error("failed to parse mods.json");

  let foundMods = 0;
  mods = mods.map((mod) => {
    if (mod.forge_id != data.forge_id) return mod;
    mod.url = data.url;
    mod.file = data.file;
    mod.hash = data.hash;
    foundMods++;
    return mod;
  });
  if (foundMods == 0) throw new Error("mod not found");

  if (data.beta) {
    const betaMods = JSON.parse(
      await readGHContent(`${owner}/${repo}`, "files/mods_beta.json"),
    ) as Mod[];
    if (!isModList(betaMods)) throw new Error("failed to parse mods_beta.json");

    const updated = mods.filter((mod) => mod.forge_id == data.forge_id);
    for (const mod of updated) {
      const index = betaMods.findIndex((m) => m.id == mod.id);
      if (index == -1) betaMods.push(mod);
      else betaMods[index] = mod;
    }

    changes.push({
      path: "files/mods_beta.json",
      content: await format(JSON.stringify(betaMods), {
        parser: "json",
        tabWidth: 4,
      }),
    });
  } else
    changes.push({
      path: "files/mods.json",
      content: await format(JSON.stringify(mods), {
        parser: "json",
        tabWidth: 4,
      }),
    });

  await commitFiles(
    owner,
    repo,
    branch,
    `Update mod ${data.forge_id} to ${data.file}`,
    changes,
  );
}

async function updatePack(data: PackUpdate, changes: FileToCommit[]) {
  let packs = JSON.parse(
    await readGHContent(`${owner}/${repo}`, "files/packs.json"),
  ) as Mod[];
  if (!isPackList(packs)) throw new Error("failed to parse packs.json");

  let found = 0;
  packs = packs.map((pack) => {
    if (pack.id != data.packId) return pack;
    pack.url = data.url;
    pack.file = data.file;
    pack.hash = data.hash;
    found++;
    return pack;
  });
  if (found == 0) throw new Error("pack not found");

  changes.push({
    path: "files/packs.json",
    content: await format(JSON.stringify(packs), {
      parser: "json",
      tabWidth: 4,
    }),
  });

  await commitFiles(
    owner,
    repo,
    branch,
    `Update pack ${data.packId} to ${data.file}`,
    changes,
  );
}

function isModList(obj: unknown): obj is Mod[] {
  return Mod.array().safeParse(obj).success;
}
function isPackList(obj: unknown): obj is Pack[] {
  return Pack.array().safeParse(obj).success;
}
