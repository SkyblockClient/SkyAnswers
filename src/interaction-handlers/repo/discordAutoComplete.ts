import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  AutocompleteInteraction,
  type ApplicationCommandOptionChoiceData,
} from "discord.js";
import { Discords, getJSON, probableMatches } from "../../lib/data.js";
import * as v from "valibot";

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
      case "discord": {
        const items: ApplicationCommandOptionChoiceData[] = probableMatches(
          v.parse(Discords, await getJSON("discords")),
          value,
        ).map((v) => ({
          name: v.fancyname || v.id,
          value: v.id,
        }));
        return this.some(items);
      }
      default:
        return this.none();
    }
  }
}
