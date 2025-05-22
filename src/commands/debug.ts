import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { getTicketOwner, getTicketTop, isTicket } from "../lib/ticket.js";
import { ChannelType, MessageFlags, userMention } from "discord.js";

@ApplyOptions<Subcommand.Options>({
  description: "Debug commands... for debugging... (DEBUG)",
  subcommands: [{ name: "ticket", chatInputRun: "ticketDebug" }],
})
export class UserCommand extends Subcommand {
  registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description) // Needed even though base command isn't displayed to end user
        .addSubcommand((command) =>
          command
            .setName("ticket")
            .setDescription("Get information about this ticket (DEBUG)")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Ticket channel")
                .addChannelTypes(ChannelType.GuildText),
            ),
        ),
    );
  }

  public async ticketDebug(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel =
      interaction.options.getChannel("channel", false, [
        ChannelType.GuildText,
      ]) || interaction.channel;

    if (!isTicket(channel)) return interaction.editReply("not a ticket");

    const owner = await getTicketOwner(channel);
    const ownerMsg = owner ? userMention(owner) : "Not Found";

    const top = await getTicketTop(channel);
    const topMsg = top ? top.url : "Not Found";

    return interaction.editReply({
      content: `Owner: ${ownerMsg}\nTop: ${topMsg}`,
      allowedMentions: { parse: [] },
    });
  }
}
