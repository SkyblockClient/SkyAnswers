let lastTrigger = 0;
/**
 *
 * @param {import("discord.js").Message} message
 * @returns
 */
export const command = async (message) => {
  if (
    message.channel.id != "780181693553704973" && // general
    message.channel.id != "887818760126345246" // trolling
  )
    return;
  if (Math.random() > 0.05 || Date.now() - lastTrigger < 300 * 1000) return;
  lastTrigger = Date.now();
  const messageText = `Message loggers are so dumb. You're seeing this because you have one.
Message loggers are unethical, besides breaking the TOS. They also require extra effort from you.
Please uninstall yours. Using a message logger is just sending a sign that you hate everyone.`;
  const m = await message.channel.send(messageText);
  await m.delete();
};
export const when = {
  all: "messages",
  desc: "Discourages message loggers",
};
