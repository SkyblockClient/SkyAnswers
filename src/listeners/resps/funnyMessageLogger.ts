import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { SkyClient } from "../../const.js";
import { Message } from "discord.js";
import { pickRandom } from "@sapphire/utilities";
import { Time } from "@sapphire/time-utilities";

const loggerMsgs = [
  `There once was a logger of text,
  Whose users were feeling perplexed,
  For it's unethical ways,
  And the extra effort it pays,
  Uninstall it now, what's the pretext?`,
  `Oh message logger, thou art so uncouth,
  Unethical and breaking TOS, forsooth!
  The extra effort required is a pain,
  Uninstall now, and let it not remain.
  Sending a sign of hate, oh what a shame,
  Remove it, and be no longer to blame.`,
  `Ladies and gentlemen, it is my pleasure to introduce a topic of great importance: message loggers. These tools, while seemingly innocuous, are in fact unethical and a breach of terms of service. Furthermore, their use requires extra effort and sends a message of disdain for others. It is my sincere hope that all users of such tools will uninstall them immediately and refrain from using them in the future.`,
  `Message loggers: when you like roasting others about their messages so much, you need to keep a record.`,
];
let lastTrigger = 0;

/** Discourages message loggers */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public override async run(message: Message<true>) {
    if (
      message.channel.id != SkyClient.channels.General && // general
      message.channel.id != SkyClient.channels.Trolling // trolling
    )
      return;
    if (Math.random() > 0.0001 || Date.now() - lastTrigger < Time.Minute * 5)
      return;
    lastTrigger = Date.now();
    const text = pickRandom(loggerMsgs).replaceAll(/^\s+/gm, "");
    const m = await message.channel.send(text);
    await m.delete();
  }
}
