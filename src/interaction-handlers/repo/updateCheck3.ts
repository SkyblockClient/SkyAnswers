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
import { Mod, invalidateTrackedData } from "../../lib/data.js";
import { PendingUpdatesDB } from "../../lib/db.js";
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
    const approved = perms.all || (perms.perms && data.forge_id in perms.perms);
    if (!approved) {
      await interaction.reply({
        content: "you can't approve this update",
        ephemeral: true,
      });
      return;
    }

    await interaction.update({
      content: data.url.startsWith("https://cdn.discordapp.com/")
        ? `hold on, we're downloading some stuff`
        : `hold on, we're downloading the repo`,
      components: [],
    });

    const changes: FileToCommit[] = [];

    if (data.url.startsWith("https://cdn.discordapp.com/")) {
      let modData: ArrayBuffer | undefined;
      try {
        const modResp = await fetch(data.url, {
          headers: { "User-Agent": "github.com/SkyblockClient/SkyAnswers" },
        });
        if (!modResp.ok)
          throw new Error(`${modResp.statusText} while fetching ${data.url}`);
        modData = await modResp.arrayBuffer();
      } catch (e) {
        container.logger.error("Failed to download mod", e);
        await interaction.message.edit("failed to download mod");
        throw e;
      }
      // if (!modData) throw new Error("this shouldn't happen");

      changes.push({
        path: `files/mods/${data.file}`,
        content: modData,
      });
      data.url = `https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/mods/${data.file}`;
    }

    await interaction.message.edit("pushing it out...");

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
      if (!isModList(betaMods))
        throw new Error("failed to parse mods_beta.json");

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
        path: `files/mods.json`,
        content: await format(JSON.stringify(mods), {
          parser: "json",
          tabWidth: 4,
        }),
      });

    await commitFiles(
      owner,
      repo,
      branch,
      `Update ${data.forge_id} to ${data.file}`,
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
    if (interaction.customId !== "updateCheck3") return this.none();
    return this.some();
  }
}

function isModList(obj: unknown): obj is Mod[] {
  return Mod.array().safeParse(obj).success;
}
