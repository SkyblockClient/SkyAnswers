/**
 * @param {import("../../bot.js").MessageData} message
 */
export const command = async (message) => {
  if (message.stickers.has("1019337107292049471"))
    await message.guild.members.cache
      .get("794377681331945524")
      .send("someone blamed you\n" + message.url);
};
export const when = {
  all: "messages",
  desc: "Tells kti when someone sends the Blame Kti sticker",
};
