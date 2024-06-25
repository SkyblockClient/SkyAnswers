import { ApplyOptions } from "@sapphire/decorators";
import { Command, container } from "@sapphire/framework";
import dedent from "dedent";

@ApplyOptions<Command.Options>({
  description: "Bots have feelings too",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
    });
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    return interaction.reply(dedent`
      I may be a bot, but that doesn't mean I don't have feelings.
      Please stop ignoring me. :(

      (I already gave you the solution to your problem.)
    `);
  }
}
