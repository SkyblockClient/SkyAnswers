import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  AutocompleteInteraction,
  type ApplicationCommandOptionChoiceData,
} from "discord.js";
import {
  Downloadable,
  getMods,
  getPacks,
  probableMatches,
} from "../../lib/data.js";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class AutocompleteHandler extends InteractionHandler {
  public override async run(
    interaction: AutocompleteInteraction,
    result: ApplicationCommandOptionChoiceData[],
  ) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const { value } = focusedOption;
    let items: Downloadable[];
    switch (focusedOption.name) {
      case "mod":
        items = probableMatches(await getMods(), value);
        break;
      case "pack":
        items = probableMatches(await getPacks(), value);
        break;
      default:
        return this.none();
    }
    return this.some(items.map((v) => ({ name: v.display, value: v.id })));
  }
}
