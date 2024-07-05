import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { Message } from "discord.js";
import { isTicket } from "../../lib/ticket.js";
import { expireBumps } from "./maintain.js";

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
