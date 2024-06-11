import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { invalidateTrackedData } from "../../lib/data.js";
import { SkyClient } from "../../const.js";

@ApplyOptions<Command.Options>({
  description: "Clears the data (eg mods, autoresponses, etc) caches",
  preconditions: ["notPublic"],
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
    const member = interaction.guild?.members.resolve(interaction.user);
    if (!member) return;

    if (
      !member.roles.cache.has(SkyClient.roles.GitHubKeeper) &&
      !member.permissions.has("Administrator")
    )
      return interaction.reply({
        content: "why do you think you can do this?",
        ephemeral: true,
      });

    invalidateTrackedData();
    return interaction.reply("cleared caches");
  }
}
