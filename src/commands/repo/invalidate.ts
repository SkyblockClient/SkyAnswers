import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { invalidateTrackedData } from "../../lib/data.js";
import { Polyfrost, SkyClient, shrug } from "../../const.js";

@ApplyOptions<Command.Options>({
  description: "Clears the data (eg mods, autoresponses, etc) caches",
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
    const { client, user } = interaction;

    const scMember = client.guilds.resolve(SkyClient.id)?.members.resolve(user);
    const pfMember = client.guilds.resolve(Polyfrost.id)?.members.resolve(user);

    const canDo =
      scMember?.roles.cache.has(SkyClient.roles.GitHubKeeper) ||
      scMember?.permissions.has("Administrator") ||
      pfMember?.permissions.has("Administrator") ||
      false;

    if (!canDo)
      return interaction.reply({
        content: `Nothing has happened,
Permission denied, it seems.
Welp, at least you tried.
(A haiku by ChatGPT)`,
        ephemeral: true,
      });

    invalidateTrackedData();
    return interaction.reply(`cache cleared. no haiku for you. ${shrug}`);
  }
}
