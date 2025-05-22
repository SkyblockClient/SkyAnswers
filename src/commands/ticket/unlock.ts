import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { isSupportTeam, isTicket, setTicketOpen } from "../../lib/ticket.js";
import { MessageFlags } from "discord.js";

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
        flags: MessageFlags.Ephemeral,
        content: "❔",
      });
    if (!isTicket(channel))
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "not a ticket lol",
      });

    await setTicketOpen(channel, true);
    return interaction.reply({ content: "ticket opened (in theory)" });
  }
}
