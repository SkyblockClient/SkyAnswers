import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { isSupportTeam, isTicket, setTicketOpen } from "../../lib/ticket.js";

@ApplyOptions<Command.Options>({
  description: "Makes the person who made a ticket have send message perms",
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
    const { channel } = interaction;
    if (!isSupportTeam(interaction.member))
      return interaction.reply({
        content: "❔",
        ephemeral: true,
      });
    if (!isTicket(channel))
      return interaction.reply({
        content: "not a ticket lol",
        ephemeral: true,
      });

    await setTicketOpen(channel, true);
    return interaction.reply({ content: "ticket opened (in theory)" });
  }
}
