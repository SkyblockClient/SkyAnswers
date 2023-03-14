import { ChannelType } from "discord.js";

export const command = async (message) => {
  if (message.channel.type != ChannelType.DM) return;
  if (message.author.id == "884534013241462806") return await message.reply("no");
  if (message.contents == "frog")
    await message.reply(`You have been infected. You must now change your status to 'DM me the word frog'. The infection shall spread silently.
The only rules are 1: It lasts for only 3 weeks and 2: Do not spoil the game for others by telling people what saying frog does`);
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
