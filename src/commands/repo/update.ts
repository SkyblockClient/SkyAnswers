import { ApplyOptions } from "@sapphire/decorators";
import { container } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { createHash } from "crypto";
import { ButtonStyle, ComponentType } from "discord.js";
import JSZip from "jszip";
import { Mod, Pack, getJSON, getMods, getPacks } from "../../lib/data.js";
import { checkMember } from "../../lib/update.js";
import { SkyClient, Emojis } from "../../const.js";
import z from "zod";
import { basename } from "node:path/posix";
import {
  PendingUpdatesDB,
  type ModUpdate,
  type PackUpdate,
  type PartialUpdate,
} from "../../lib/db.js";
import { envParseString } from "@skyra/env-utilities";
import { type Nullish } from "@sapphire/utilities";
import { extname } from "path";
import dedent from "dedent";

const ModInfo = z.array(z.object({ modid: z.string() }));

@ApplyOptions<Subcommand.Options>({
  description: "Updates a mod / pack",
  subcommands: [
    { name: "mod", chatInputRun: "updateMod" },
    { name: "pack", chatInputRun: "updatePack" },
  ],
})
export class UserCommand extends Subcommand {
  registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((command) =>
          command
            .setName("mod")
            .setDescription("Updates a mod")
            .addStringOption((option) =>
              option
                .setName("url")
                .setDescription("Download URL")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("forge_id")
                .setDescription(
                  "modid to update, only used if not found in mcmod.info",
                )
                .setRequired(false),
            )
            .addStringOption((option) =>
              option
                .setName("filename")
                .setDescription(
                  "filename for the file, replacing the autodetected name",
                )
                .setRequired(false),
            )
            .addBooleanOption((option) =>
              option.setName("beta").setDescription("Beta").setRequired(false),
            ),
        )
        .addSubcommand((command) =>
          command
            .setName("pack")
            .setDescription("Updates a pack")
            .addStringOption((option) =>
              option
                .setName("url")
                .setDescription("Download URL")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("pack")
                .setDescription("Pack ID")
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption((option) =>
              option
                .setName("filename")
                .setDescription(
                  "filename for the file, replacing the autodetected name",
                )
                .setRequired(false),
            ),
        ),
    );
  }

  public async updateMod(int: Subcommand.ChatInputCommandInteraction) {
    if (!envParseString("GH_KEY", null))
      return int.reply(`Missing GitHub API Key! ${Emojis.BlameWyvest}`);

    const { guild, channel } = int;
    if (!guild || !channel) return;
    const member = int.guild?.members.resolve(int.user);
    if (!member) return;
    const perms = await checkMember(member);
    if (!perms.all && !perms.mods)
      return int.reply({
        content: `${Emojis.YouWhat} you can't update any mods`,
        ephemeral: true,
      });

    if (channel.id != SkyClient.channels.ModUpdating)
      return int.reply({
        content: `💡 this command is only available in <#${SkyClient.channels.ModUpdating}>`,
        ephemeral: true,
      });
    const url = int.options.getString("url", true);
    if (!z.string().url().safeParse(url).success)
      return int.reply("this doesn't look like a URL to me 🤔");

    await int.deferReply();

    const modResp = await fetch(url, {
      headers: { "User-Agent": "github.com/SkyblockClient/SkyAnswers" },
    });
    if (!modResp.ok) {
      container.logger.error(
        `${modResp.statusText} while fetching ${url}`,
        await modResp.text(),
      );
      return int.editReply("Failed to fetch mod. Is the URL correct?");
    }
    const modFile = await modResp.arrayBuffer();

    let modId: string | Nullish;
    try {
      const modZip = await JSZip.loadAsync(modFile);
      const modInfoFile = modZip.file("mcmod.info");
      if (modInfoFile) {
        const modInfoStr = await modInfoFile.async("text");
        const modInfo = ModInfo.parse(JSON.parse(modInfoStr));
        modId = modInfo[0].modid;
      }
    } catch (e) {
      container.logger.error("Failed to read ZIP", e);
      return int.editReply("Failed to read ZIP. Is the URL correct?");
    }
    modId = modId || int.options.getString("forge_id");

    if (!modId) return int.editReply("🫨 this mod doesn't have a mod id");
    if (!perms.all && (perms.mods ? perms.mods[modId] != "update" : false))
      return int.editReply(`🫨 you can't update that mod`);

    const isBeta = int.options.getBoolean("beta") || false;
    const data: ModUpdate = {
      type: "mod",
      id: modId,
      url,
      file: decodeURIComponent(
        int.options.getString("filename") || basename(url),
      ),
      hash: createHash("md5").update(new Uint8Array(modFile)).digest("hex"),
      beta: isBeta,
      approvers: [],
    };

    const modsRef = Mod.array().parse(await getMods());
    const mods = isBeta
      ? Mod.array().parse(await getJSON("mods_beta"))
      : modsRef;

    const existingMod =
      mods.find((mod) => mod.forge_id == modId) ||
      modsRef.find((mod) => mod.forge_id == modId);
    if (!existingMod) return int.editReply("🤔 that mod doesn't exist");

    if (
      existingMod.url == data.url &&
      existingMod.file == data.file &&
      existingMod.hash == data.hash
    )
      return int.editReply("🤔 nothing to change");

    if (!extname(data.file)) return int.editReply("🤯 file extension required");
    if (extname(existingMod.file) != extname(data.file))
      return int.editReply(
        `🤯 file extension changed! (\`${extname(existingMod.file)}\` -> \`${extname(data.file)}\`)`,
      );

    const { id } = await int.fetchReply();
    await PendingUpdatesDB.update((pending) => {
      pending[id] = {
        ...data,
      };
    });

    return retMessage(int, data);
  }

  public async updatePack(int: Subcommand.ChatInputCommandInteraction) {
    if (!envParseString("GH_KEY", null))
      return int.reply(`Missing GitHub API Key! ${Emojis.BlameWyvest}`);

    const { guild, channel } = int;
    if (!guild || !channel) return;
    const member = int.guild?.members.resolve(int.user);
    if (!member) return;
    const perms = await checkMember(member);
    if (!perms.all && !perms.packs)
      return int.reply({
        content: `${Emojis.YouWhat} you can't update any packs`,
        ephemeral: true,
      });

    if (channel.id != SkyClient.channels.ModUpdating)
      return int.reply({
        content: `💡 this command is only available in <#${SkyClient.channels.ModUpdating}>`,
        ephemeral: true,
      });
    const url = int.options.getString("url", true);
    if (!z.string().url().safeParse(url).success)
      return int.reply("this doesn't look like a URL to me 🤔");

    await int.deferReply();

    const modResp = await fetch(url, {
      headers: { "User-Agent": "github.com/SkyblockClient/SkyAnswers" },
    });
    if (!modResp.ok) {
      container.logger.error(
        `${modResp.statusText} while fetching ${url}`,
        await modResp.text(),
      );
      return int.editReply("Failed to fetch pack. Is the URL correct?");
    }
    const modFile = await modResp.arrayBuffer();

    try {
      const modZip = await JSZip.loadAsync(modFile);
      const modInfoFile = modZip.file("pack.mcmeta");
      if (!modInfoFile) throw new Error();
    } catch (e) {
      container.logger.error("Failed to read ZIP", e);
      return int.editReply("Failed to read ZIP. Is the URL correct?");
    }

    const packId = int.options.getString("pack", true);

    if (!perms.all && (perms.packs ? perms.packs[packId] != "update" : false))
      return int.editReply(`🫨 you can't update that pack`);

    const data: PackUpdate = {
      type: "pack",
      id: packId,
      url,
      file: decodeURIComponent(
        int.options.getString("filename") || basename(url),
      ),
      hash: createHash("md5").update(new Uint8Array(modFile)).digest("hex"),
      approvers: [],
    };

    const packs = Pack.array().parse(await getPacks());

    const existingPack = packs.find((pack) => pack.id == packId);
    if (!existingPack) return int.editReply("🤔 that pack doesn't exist");

    if (
      existingPack.url == data.url &&
      existingPack.file == data.file &&
      existingPack.hash == data.hash
    )
      return int.editReply("🤔 nothing to change");

    if (!extname(data.file)) return int.editReply("🤯 file extension required");
    if (extname(existingPack.file) != extname(data.file))
      return int.editReply(
        `🤯 file extension changed! (\`${extname(existingPack.file)}\` -> \`${extname(data.file)}\`)`,
      );

    const { id } = await int.fetchReply();
    await PendingUpdatesDB.update((pending) => {
      pending[id] = data;
    });

    return retMessage(int, data);
  }
}

function retMessage(
  int: Subcommand.ChatInputCommandInteraction,
  data: PartialUpdate,
) {
  return int.editReply({
    content: "👀 does this look alright?",
    embeds: [
      {
        description: dedent`
          id: ${data.id}
          url: ${data.url}
          file: ${data.file}
          md5: ${data.hash}
        `,
      },
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: "updateCheck1",
            label: "Continue",
            style: ButtonStyle.Success,
          },
        ],
      },
    ],
  });
}
