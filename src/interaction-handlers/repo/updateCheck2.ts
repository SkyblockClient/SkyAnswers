import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
  container,
} from "@sapphire/framework";
import { unorderedList, userMention, type ButtonInteraction } from "discord.js";
import { format } from "prettier";
import { checkMember } from "../../lib/update.js";
import { Emojis } from "../../const.js";
import { notSkyClient } from "../../preconditions/notPublic.js";
import {
  Mod,
  Mods,
  Pack,
  Packs,
  invalidateTrackedData,
} from "../../lib/data.js";
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
import dedent from "dedent";
import * as v from "valibot";

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
        content: "update not found. this shouldn't happen!",
        ephemeral: true,
      });
    if (data.approvers.map(({ id }) => id).includes(interaction.user.id))
      return interaction.reply({
        content: "You already approved this update",
        ephemeral: true,
      });

    const member = interaction.guild?.members.resolve(interaction.user);
    if (!member) return;
    const perms = await checkMember(member);
    const approved =
      perms.all ||
      (data.type == "mod" && perms.mods && data.id in perms.mods) ||
      (data.type == "pack" && perms.packs && data.id in perms.packs);
    if (!approved)
      return interaction.reply({
        content: "You can't approve this update",
        ephemeral: true,
      });

    const approver = { name: member.user.tag, id: member.user.id };
    const approvers = [...data.approvers, approver];
    await PendingUpdatesDB.update((db) => {
      db[interaction.message.id].approvers.push(approver);
    });

    await interaction.update({
      embeds: [
        interaction.message.embeds[0],
        {
          title: "Approvers",
          description: unorderedList(
            approvers.map(({ id }) => `${userMention(id)} (${id})`),
          ),
        },
      ],
    });
    if (data.approvers.length < 3) return;

    await interaction.message.edit({
      content: "one second",
      components: [],
    });

    if (data.pingMsg) {
      const msg = await interaction.channel?.messages.fetch(data.pingMsg);
      if (msg) await msg.delete();
    }

    const changes: FileToCommit[] = [];

    if (data.url.startsWith("https://cdn.discordapp.com/")) {
      await interaction.update({
        content: "one second we need to download then upload the file",
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
    });

    const itemName =
      data.type == "mod"
        ? await updateMod(data, changes)
        : await updatePack(data, changes);
    const displayName = `${itemName} (\`${data.id}\`)`;

    await commitFiles(
      owner,
      repo,
      branch,
      dedent`
        Update ${data.type} ${displayName}
        Approved by:
        ${unorderedList(data.approvers.map(({ name, id }) => `${name} (${id})`))}
      `,
      changes,
    );

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
    if (interaction.customId !== "updateCheck2") return this.none();
    return this.some();
  }
}

async function updateMod(data: ModUpdate, changes: FileToCommit[]) {
  let mods = JSON.parse(
    await readGHContent(`${owner}/${repo}`, "files/mods.json"),
  ) as Mod[];
  if (!isModList(mods)) throw new Error("failed to parse mods.json");

  let retName = "";
  mods = mods.map((mod) => {
    if (mod.forge_id != data.id) return mod;
    mod.url = data.url;
    mod.file = data.file;
    mod.hash = data.hash;
    retName = retName || mod.display;
    return mod;
  });
  if (!retName) throw new Error("mod not found");

  if (data.beta) {
    const betaMods = JSON.parse(
      await readGHContent(`${owner}/${repo}`, "files/mods_beta.json"),
    ) as Mod[];
    if (!isModList(betaMods)) throw new Error("failed to parse mods_beta.json");

    const updated = mods.filter((mod) => mod.forge_id == data.id);
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

  return retName;
}

async function updatePack(data: PackUpdate, changes: FileToCommit[]) {
  let packs = JSON.parse(
    await readGHContent(`${owner}/${repo}`, "files/packs.json"),
  ) as Mod[];
  if (!isPackList(packs)) throw new Error("failed to parse packs.json");

  let retName = "";
  packs = packs.map((pack) => {
    if (pack.id != data.id) return pack;
    pack.url = data.url;
    pack.file = data.file;
    pack.hash = data.hash;
    retName = retName || pack.display;
    return pack;
  });
  if (!retName) throw new Error("pack not found");

  changes.push({
    path: "files/packs.json",
    content: await format(JSON.stringify(packs), {
      parser: "json",
      tabWidth: 4,
    }),
  });

  return retName;
}

function isModList(obj: unknown): obj is Mod[] {
  return v.safeParse(Mods, obj).success;
}
function isPackList(obj: unknown): obj is Pack[] {
  return v.safeParse(Packs, obj).success;
}
