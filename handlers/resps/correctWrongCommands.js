export const command = async (message) => {
  const content = message.content.toLowerCase();
  if (
    content.startsWith("sky mod") ||
    content.startsWith("sky pack") ||
    content.startsWith("sky discord") ||
    content == "sky invalidate" ||
    content == "-help"
  )
    await message.reply("ha ha very funny\n(you mixed up `sky ` and `-`)");
  if (content == "-pullrepo") await message.reply("it's `-invalidate` now");
  if (content == "-repo") await message.reply("it's `-update [dl url]` now");
};
export const when = {
  all: "messages",
  desc: "Corrects incorrect commands",
  public: true,
};
