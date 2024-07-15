import { ApplyOptions } from "@sapphire/decorators";
import { Command, container } from "@sapphire/framework";
import { createHash } from "crypto";
import {
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import JSZip from "jszip";
import { Mod, getJSON, getMods } from "../../lib/data.js";
import { checkMember } from "../../lib/update.js";
import { SkyClient, Emojis } from "../../const.js";
import z from "zod";
import { basename } from "@std/url";
import { PendingUpdatesDB } from "../../lib/db.js";
import { envParseString } from "@skyra/env-utilities";
import { Nullish } from "@sapphire/utilities";

const ModInfo = z.array(z.object({ modid: z.string() }));

@ApplyOptions<Command.Options>({
  description: "Updates a mod to the latest version supplied",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "url",
          description: "Download URL",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "beta",
          description: "Beta",
          required: false,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "forge_id",
          description: "modid to update, only used if not found in mcmod.info",
          required: false,
        },
      ],
    });
  }

  public override async chatInputRun(int: Command.ChatInputCommandInteraction) {
    if (!envParseString("GH_KEY", null))
      return int.reply(`Missing GitHub API Key! ${Emojis.BlameWyvest}`);

    const { guild, channel } = int;
    if (!guild || !channel) return;
    const member = int.guild?.members.resolve(int.user);
    if (!member) return;
    const perms = await checkMember(member);
    if (!perms.all && !perms.perms) {
      if (member.permissions.has("Administrator"))
        return int.reply({
          content: "💡 assign yourself Github Keeper",
          ephemeral: true,
        });
      return int.reply({
        content: `${Emojis.YouWhat} you can't update any mods`,
        ephemeral: true,
      });
    }

    const isProper =
      guild.id != SkyClient.id || channel.id == SkyClient.channels.ModUpdating;
    if (!isProper)
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
      return await int.editReply("Failed to fetch mod. Is the URL correct?");
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
      return await int.editReply("Failed to read ZIP. Is the URL correct?");
    }
    modId = modId || int.options.getString("forge_id");

    if (!modId) return await int.editReply("🫨 this mod doesn't have a mod id");
    if (!perms.all && (perms.perms ? perms.perms[modId] != "update" : false))
      return await int.editReply(`🫨 you can't update that mod`);

    //const file = decodeURI(url).split('/').pop().split('?')[0];
    const data = {
      forge_id: modId,
      url,
      file: decodeURIComponent(basename(url)),
      hash: createHash("md5").update(new Uint8Array(modFile)).digest("hex"),
    };
    const isBeta = int.options.getBoolean("beta") || false;

    const modsRef = Mod.array().parse(await getMods());
    const mods = isBeta
      ? Mod.array().parse(await getJSON("mods_beta"))
      : modsRef;

    if (!modsRef.find((mod) => mod.forge_id == modId))
      return await int.editReply("🤔 that mod doesn't exist");

    const existingMod = mods.find((mod) => mod.forge_id == modId);

    if (
      existingMod &&
      existingMod.url == data.url &&
      existingMod.file == data.file &&
      existingMod.hash == data.hash
    )
      return await int.editReply("🤔 nothing to change");

    const { id } = await int.fetchReply();
    await PendingUpdatesDB.update((pending) => {
      pending[id] = {
        ...data,
        initiator: member.id,
        beta: isBeta,
      };
    });

    return await int.editReply({
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
  }
}
