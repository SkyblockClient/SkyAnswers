/**
 * @param {import("../../bot.js").MessageDataPublic} message
 */
export const command = async (message) => {
  const content = message.content.toLowerCase();
  if (content.startsWith("sky mod"))
    await message.reply("ha ha very funny\n(you meant to say `-mod`)");
  if (content.startsWith("sky pack"))
    await message.reply("ha ha very funny\n(you meant to say `-pack`)");
  if (content.startsWith("sky discord"))
    await message.reply("ha ha very funny\n(you meant to say `-discord`)");
  if (content == "sky invalidate")
    await message.reply("ha ha very funny\n(you meant to say `-invalidate`)");
  if (content == "-help")
    await message.reply("ha ha very funny\n(you meant to say `sky help`)");
  if (content == "-pullrepo") await message.reply("it's `-invalidate` now");
  if (content == "-repo") await message.reply("it's `-update [dl url]` now");
};
export const when = {
  all: "messages",
  desc: "Corrects incorrect commands",
  public: true,
};
