import { ChannelType } from "discord.js";

export const command = async (message) => {
  if (message.channel.type != ChannelType.DM) return;
  const staffChat = message.client.channels.cache.get("796895966414110751");
  if (!staffChat) return;
  const { content, author } = message;
  await staffChat.send({
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
