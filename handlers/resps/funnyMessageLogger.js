let lastTrigger = 0;

/**
 * @param {import("../../bot.js").MessageData} message
 */
export const command = async (message) => {
  if (
    message.channel.id != "780181693553704973" && // general
    message.channel.id != "887818760126345246" // trolling
  )
    return;
  if (Math.random() > 0.0001 || Date.now() - lastTrigger < 300 * 1000) return;
  lastTrigger = Date.now();
  const messageLoggers = [
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
  const messageText =
    messageLoggers[Math.floor(Math.random() * messageLoggers.length)];
  const m = await message.channel.send(messageText);
  await m.delete();
};
export const when = {
  all: "messages",
  desc: "Discourages message loggers",
};
