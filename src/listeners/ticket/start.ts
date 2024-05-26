import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { ComponentType, ButtonStyle, GuildChannel } from "discord.js";
import { isTicket, setTicketOpen } from "../../lib/ticket.js";
import { notSkyClient } from "../../preconditions/notPublic.js";
import { sleep } from "@sapphire/utilities";

/** Requires the user to choose a category for their ticket */
@ApplyOptions<Listener.Options>({
  event: Events.ChannelCreate,
})
export class UserEvent extends Listener<typeof Events.ChannelCreate> {
  public override async run(channel: GuildChannel) {
    if (!isTicket(channel)) return;
    // TODO: Adapt for Polyforst
    if (notSkyClient(channel.guildId)) return;

    await sleep(1000);
    await channel.send({
      content: "What is your ticket about? You must click on one to continue.",
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              customId: "ticketCategorize|crash",
              label: "I'm crashing",
              style: ButtonStyle.Primary,
            },
            {
              type: ComponentType.Button,
              customId: "ticketCategorize|install",
              label: "I need help with the installer",
              style: ButtonStyle.Primary,
            },
            {
              type: ComponentType.Button,
              customId: "ticketCategorize|mods",
              label: "I need help with mods",
              style: ButtonStyle.Primary,
            },
            {
              type: ComponentType.Button,
              customId: "ticketCategorize|other",
              label: "Something else (meta)",
              style: ButtonStyle.Secondary,
            },
          ],
        },
      ],
    });
    await setTicketOpen(channel, false);
  }
}
