import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import {
  getDistance,
  getDownloadableMessage,
  getMods,
  probableMatches,
  queryData,
} from "../../lib/data.js";
import { ApplicationCommandOptionType } from "discord.js";

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
    const item = queryData(items, query);
    if (!item) {
      const bestOption = probableMatches(items, query)[0];
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
