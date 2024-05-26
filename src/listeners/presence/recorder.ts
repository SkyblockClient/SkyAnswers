import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, container } from "@sapphire/framework";
import { createClient } from "@supabase/supabase-js";
import { Message } from "discord.js";
import { SkyClientOnly } from "../../lib/SkyClientOnly.js";
import { envParseString } from "@skyra/env-utilities";

export const db =
  envParseString("SB_KEY", null) &&
  createClient(
    "https://fkjmuugisxgmrklcfyaj.supabase.co",
    envParseString("SB_KEY"),
  );

/** Notes message times to figure out when people are online */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class MessageListener extends Listener<typeof Events.MessageCreate> {
  @SkyClientOnly()
  public override async run(message: Message) {
    if (!message.member) return;
    if (!db) {
      container.logger.warn("you should set up the db");
      return;
    }

    const { error } = await db.from("messages").insert({
      id: message.id,
      time: new Date(message.createdTimestamp),
      status: message.member.presence?.status,
      author: message.member.id,
    });
    if (error) throw error;
  }
}
