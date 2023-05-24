import { ChannelType } from "discord.js";

export const command = async (message) => {
  if (message.channel.type != ChannelType.DM) return;
  if (message.author.id == "884534013241462806")
    return await message.reply("no");
  const memberLogs = message.client.channels.cache.get("934968221923168266");
  if (!memberLogs) return;
  const { content, author } = message;
  await memberLogs.send({
    content: `some dude (<@${author.id}>) just dmed me
\`\`\`
${content}
\`\`\``.slice(0, 1999),
    allowedMentions: { parse: [] },
  });
};
export const when = {
  all: "messages",
  desc: "Notes DMs",
  public: true,
};
