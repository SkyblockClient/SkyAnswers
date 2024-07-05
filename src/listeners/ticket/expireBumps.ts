import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { Message } from "discord.js";
import { isTicket } from "../../lib/ticket.js";
import { expireBumps } from "./maintain.js";
import { Time } from "@sapphire/time-utilities";
import { sleep } from "@sapphire/utilities";

/** Provides info and recommendations for crashes */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public override async run(message: Message<true>) {
    if (!isTicket(message.channel)) return;
    await sleep(Time.Second);
    await expireBumps(message.channel);
  }
}
