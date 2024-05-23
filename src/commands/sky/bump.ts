import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { hyperlink, time } from "discord.js";
import { notSkyClient } from "../../preconditions/notPublic.js";
import { getOwnerPin, getTicketOwner } from "../../lib/ticket.js";
import { MessageBuilder } from "@sapphire/discord.js-utilities";

@ApplyOptions<Command.Options>({
  description: "Bumps a ticket to encourage closing",
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
    if (notSkyClient(interaction.guildId)) return;
    if (!interaction.channel) return;

    const pinMsg = await getOwnerPin(interaction.channel);
    const owner = await getTicketOwner(interaction.channel);

    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);
    const twoDaysStamp = time(twoDays, "R");

    const pinnedMsg = pinMsg
      ? hyperlink("pinned message", pinMsg.url)
      : "pinned message";
    const message = new MessageBuilder({
      embeds: [
        {
          title: "Do you still need help?",
          description: `***Yes***: Restate your problem clearly. If someone asked you to upload something, do that.
***No, all my problems are solved***: Close the ticket. View the ${pinnedMsg} at the top, and click the :lock: button to close your ticket.
If you do not respond ${twoDaysStamp}, your ticket will be closed.`,
          color: 0xffff88,
        },
      ],
    });
    if (owner) message.setContent(`Hey <@${owner}>:`);
    return interaction.reply(message);
  }
}
