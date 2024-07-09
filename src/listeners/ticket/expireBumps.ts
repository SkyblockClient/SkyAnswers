import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { Colors, Message, TextChannel } from "discord.js";
import { isBumpMessage, isStaffPing, isTicket } from "../../lib/ticket.js";
import { SupportTeams, Users } from "../../const.js";

/** Provides info and recommendations for crashes */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public override async run(message: Message<true>) {
    if (!isTicket(message.channel)) return;
    await expireBumps(message.channel);
  }
}

export async function expireBumps(ticket: TextChannel) {
  try {
    const support = SupportTeams[ticket.guildId];
    if (!support) return;

    const messages = await ticket.messages.fetch();
    const lastMsg = messages
      .filter((message) => message.author.id != Users.TicketTool)
      .filter((message) => !isStaffPing(message))
      .first();
    const bumps = messages.filter(isBumpMessage);
    if (!lastMsg) return;

    for (const bump of bumps.values()) {
      if (lastMsg.id == bump.id) continue;

      await bump.edit({
        content: "",
        embeds: [
          {
            title: "Bump Expired",
            color: Colors.Red,
          },
        ],
        // components: [buildDeleteBtnRow()],
      });
    }
  } catch {
    /* empty */
  }
}
