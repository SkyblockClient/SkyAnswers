import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  AutocompleteInteraction,
  type ApplicationCommandOptionChoiceData,
} from "discord.js";
import { getPacks, probableMatches } from "../../lib/data.js";

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
    switch (focusedOption.name) {
      case "pack": {
        const packs = await getPacks();
        const items = probableMatches(packs, value).map((v) => ({
          name: v.display.substring(0, 25),
          value: v.id,
        }));
        return this.some(items);
      }
      default:
        return this.none();
    }
  }
}
