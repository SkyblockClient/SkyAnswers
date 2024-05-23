import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import {
  DownloadableMod,
  DownloadablePack,
  getDistance,
  getMods,
  queryDownloadable,
} from "../../data.js";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  InteractionReplyOptions,
  hyperlink,
} from "discord.js";
import { repoFilesURL } from "../../const.js";
import { MessageBuilder } from "@sapphire/discord.js-utilities";

@ApplyOptions<Command.Options>({
  description: "Gives info about a mod",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "mod",
          description: "Mod to search for",
          required: true,
          autocomplete: true,
        },
        // {
        // 	type: ApplicationCommandOptionType.String,
        // 	name: 'instructions',
        // 	description: 'Additional instructions to post with the mod',
        // 	required: false,
        // 	autocomplete: 'mod'
        // }
      ],
    });
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const query = interaction.options.getString("mod", true);
    const items = await getMods();
    const item = queryDownloadable(items, query, "mods");
    if (!item) {
      const sortedOptions = items.sort(
        (a, b) => getDistance(a, query) - getDistance(b, query),
      );
      const bestOption = sortedOptions[0];
      const bestDistance = getDistance(bestOption, query);
      return interaction.reply(
        "No mod found" +
          (bestDistance <= 3 ? `, did you mean "${bestOption.id}"?` : ""),
      );
    }
    let bundledIn: string | undefined;
    if (item.hidden) {
      bundledIn = items.find(
        (otherItem) => otherItem.packages?.includes(item.id),
      )?.display;
    }
    return interaction.reply(await getDownloadableMessage(item, bundledIn));
  }
}

const isMod = (downloadable: unknown): downloadable is DownloadableMod =>
  DownloadableMod.safeParse(downloadable).success;
const isPack = (downloadable: unknown): downloadable is DownloadablePack =>
  DownloadablePack.safeParse(downloadable).success;

export async function getDownloadableMessage(
  downloadable: DownloadableMod | DownloadablePack,
  bundledIn?: string,
): Promise<InteractionReplyOptions> {
  const message = new MessageBuilder();
  const embed = new EmbedBuilder({
    color: downloadable.hash
      ? Number("0x" + downloadable.hash.slice(0, 6))
      : undefined,
    title: downloadable.display,
    description: downloadable.description,
    footer: { text: `Created by ${downloadable.creator}` },
  });
  if (downloadable.icon)
    embed.setThumbnail(
      `${repoFilesURL}/icons/${encodeURIComponent(downloadable.icon)}`,
    );
  if (isPack(downloadable) && downloadable.screenshot)
    embed.setImage(downloadable.screenshot);
  if (downloadable.hidden)
    embed.addFields({
      name: "Note",
      value:
        "This item is hidden, so it won't show up in the normal installer. " +
        (bundledIn
          ? `You can get it in the bundle ${bundledIn}.`
          : "It might be internal or outdated."),
    });

  const mods = DownloadableMod.array().parse(await getMods());
  const downloads: string[] = [
    hyperlink(downloadable.file, encodeURI(downloadable.download)),
  ];
  if (isMod(downloadable) && downloadable.packages) {
    for (const pkgName of downloadable.packages) {
      const mod = mods.find((mod) => mod.id == pkgName);
      if (mod) downloads.push(hyperlink(mod.file, encodeURI(mod.download)));
      else downloads.push(pkgName);
    }
  }
  embed.addFields({
    name: downloads.length > 1 ? "Downloads" : "Download",
    value: downloads.join("\n"),
    inline: downloads.length == 1,
  });

  if (isMod(downloadable) && downloadable.command)
    embed.addFields({
      name: "Config Command",
      value: downloadable.command,
      inline: true,
    });

  message.setEmbeds([embed]);
  return message;
}
