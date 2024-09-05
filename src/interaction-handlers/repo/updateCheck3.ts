import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
  container,
} from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import fs from "fs/promises";
import { add, clone, commit, push } from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import { format } from "prettier";
import { checkMember } from "../../lib/update.js";
import { Emojis, isDevUser } from "../../const.js";
import { notSkyClient } from "../../preconditions/notPublic.js";
import { tmpdir } from "os";
import { join } from "path";
import { Mod, invalidateTrackedData } from "../../lib/data.js";
import { PendingUpdatesDB } from "../../lib/db.js";
import { envParseString } from "@skyra/env-utilities";

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

    const tmp = await fs.mkdtemp(join(tmpdir(), "skyanswers-"));

    const tasks = [];
    tasks.push(
      clone({
        fs,
        http,
        url: `https://github.com/SkyblockClient/SkyblockClient-REPO`,
        dir: tmp,
        depth: 1,
        singleBranch: true,
      }),
    );
    if (data.url.startsWith("https://cdn.discordapp.com/")) {
      let modData: ArrayBuffer | undefined;
      tasks.push(
        (async () => {
          try {
            const modResp = await fetch(data.url, {
              headers: { "User-Agent": "github.com/SkyblockClient/SkyAnswers" },
            });
            if (!modResp.ok)
              throw new Error(
                `${modResp.statusText} while fetching ${data.url}`,
              );
            modData = await modResp.arrayBuffer();
          } catch (e) {
            container.logger.error("Failed to download mod", e);
            await interaction.message.edit("failed to download mod");
            throw e;
          }
        })(),
      );
      await Promise.all(tasks);
      if (!modData) throw new Error("this shouldn't happen");

      await Bun.write(`${tmp}/files/mods/${data.file}`, modData);
      data.url = `https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files/mods/${data.file}`;
    } else {
      await Promise.all(tasks);
    }

    await interaction.message.edit("pushing it out...");

    let mods = (await Bun.file(`${tmp}/files/mods.json`).json()) as Mod[];
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
      const betaMods = (await Bun.file(
        `${tmp}/files/mods_beta.json`,
      ).json()) as Mod[];
      if (!isModList(betaMods))
        throw new Error("failed to parse mods_beta.json");

      const updated = mods.filter((mod) => mod.forge_id == data.forge_id);
      for (const mod of updated) {
        const index = betaMods.findIndex((m) => m.id == mod.id);
        if (index == -1) betaMods.push(mod);
        else betaMods[index] = mod;
      }

      await Bun.write(
        `${tmp}/files/mods_beta.json`,
        await format(JSON.stringify(betaMods), { parser: "json", tabWidth: 4 }),
      );
    } else {
      await Bun.write(
        `${tmp}/files/mods.json`,
        await format(JSON.stringify(mods), { parser: "json", tabWidth: 4 }),
      );
    }

    await add({
      fs,
      dir: tmp,
      filepath: ".",
    });
    await commit({
      fs,
      dir: tmp,
      author: {
        name: "SkyClient-repo-bot",
        email: "SkyClient-repo-bot@users.noreply.github.com",
      },
      message: `Update ${data.forge_id} to ${data.file}`,
    });
    await push({
      fs,
      http,
      dir: tmp,
      onAuth: () => ({ username: envParseString("GH_KEY") }),
    });

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
