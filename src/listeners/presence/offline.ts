import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { db } from "./recorder.js";
import { Message, MessageReplyOptions, time } from "discord.js";
import { SkyClientOnly } from "../../lib/SkyClientOnly.js";

/** Tells you when the person you're trying to reach is probably asleep */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class MessageListener extends Listener<typeof Events.MessageCreate> {
  @SkyClientOnly()
  public override async run(message: Message) {
    if (!db) return;

    for (const m of message.content.matchAll(/<@([0-9]+)>/g)) {
      const cooldown = cooldowns.get(m[1]);
      if (cooldown && cooldown + 60000 > Date.now()) {
        continue;
      }
      const reply = await check(m[1]);
      if (!reply) return;
      return message.reply(reply);
    }
    return;
  }
}

const cooldowns = new Map();

async function check(id: string): Promise<MessageReplyOptions | undefined> {
  if (!db) return;
  const { data, error } = await db.rpc("get_message_times", {
    author_to_use: id,
  });
  if (error) throw error;

  // TODO: Typings
  const averagePerHour =
    data.reduce((a: any, b: { count: any }) => a + b.count, 0) / 24;
  if (averagePerHour < 20) return;

  const silentThreshold = averagePerHour * 0.1;

  const currentHour = new Date().getUTCHours();
  const getMessages = (hour: number) =>
    // TODO: Typings
    data
      .filter((group: { date_part: number }) => group.date_part == hour)
      .reduce((a: any, b: { count: any }) => a + b.count, 0);
  const currentHourMessages = getMessages(currentHour);

  if (currentHourMessages < silentThreshold) {
    let nextHour = currentHour + 1;
    while (getMessages(nextHour) < silentThreshold) {
      nextHour++;
      if (nextHour > 23) nextHour = 0;
    }
    const nextDate = new Date(0);
    nextDate.setUTCHours(nextHour);

    cooldowns.set(id, Date.now());
    const percent = (
      (currentHourMessages / (averagePerHour * 24)) *
      100
    ).toFixed(1);
    const stamp = time(nextDate.getTime() / 1000, "t");
    return {
      content: `<@${id}> is probably asleep. (they have ${percent}% of their messages in this hour - try again at ${stamp})`,
      allowedMentions: { users: [] },
    };
  }
  return;
}
