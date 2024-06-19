import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { Message } from "discord.js";

/** Corrects incorrect commands */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public override run(message: Message<true>) {
    const me = message.client.user.toString();
    const content = message.content.toLowerCase();
    if (content.startsWith(`${me} why`)) return message.reply("¯\\_(ツ)_/¯");
    return;
  }
}
