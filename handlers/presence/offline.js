import { db } from "./recorder.js";

const cooldowns = new Map();
/**
 * @param {import("../../bot.js").MessageData} message
 */
export const command = async ({ content, respond }) => {
  if (!db) return;

  for (const m of content.matchAll(/<@([0-9]+)>/g)) {
    const cooldown = cooldowns.get(m[1]);
    if (cooldown && cooldown + 60000 > Date.now()) {
      continue;
    }
    await check(m[1], { respond });
  }
};
/**
 * @param {string} id
 * @param {{respond: (input: import("discord.js").MessageReplyOptions) => Promise<import("discord.js").Message>}} options
 */
const check = async (id, { respond }) => {
  const { data, error } = await db.rpc("get_message_times", {
    author_to_use: id,
  });
  if (error) throw error;

  const averagePerHour = data.reduce((a, b) => a + b.count, 0) / 24;
  if (averagePerHour < 20) return;

  const silentThreshold = averagePerHour * 0.1;

  const currentHour = new Date().getUTCHours();
  const getMessages = (hour) =>
    data
      .filter((group) => group.date_part == hour)
      .reduce((a, b) => a + b.count, 0);
  const currentHourMessages = getMessages(currentHour);

  if (currentHourMessages < silentThreshold) {
    let nextHour = currentHour + 1;
    while (getMessages(nextHour) < silentThreshold) {
      nextHour++;
      if (nextHour > 23) nextHour = 0;
    }
    const nextDate = new Date(0);
    nextDate.setUTCHours(nextHour);

    await respond({
      content: `<@${id}> is probably asleep. (they have ${(
        (currentHourMessages / (averagePerHour * 24)) *
        100
      ).toFixed(1)}% of their messages in this hour - try again at <t:${
        nextDate.getTime() / 1000
      }:t>)`,
      allowedMentions: { users: [] },
    });
    cooldowns.set(id, Date.now());
  }
};

export const when = {
  all: "messages",
  desc: "Tells you when the person you're trying to reach is probably asleep",
};
