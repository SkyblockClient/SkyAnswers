import { ChannelType } from "discord.js";

/**
 * @param {import("../../bot.js").MessageDataPublic} message
 */
export const command = async (message) => {
  if (message.channel.type != ChannelType.DM) return;

  const verboseBotLogs = /** @type {import("discord.js").TextChannel} */ (
    message.client.channels.cache.get("934968221923168266")
  );
  if (!verboseBotLogs) return;

  const { content, author } = message;
  await verboseBotLogs.send({
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
