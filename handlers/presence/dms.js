import { ChannelType } from "discord.js";

export const command = async (message) => {
  if (message.channel.type != ChannelType.DM) return;
  const memberLogs = message.client.channels.cache.get("797866972858941451");
  if (!memberLogs) return;
  const { content, author } = message;
  await memberLogs.send({
    content: `some dude (<@${author.id}>) just dmed me
\`\`\`
${content}
\`\`\``,
    allowedMentions: { parse: [] },
  });
};
export const when = {
  all: "messages",
  desc: "Notes DMs",
  public: true,
};
