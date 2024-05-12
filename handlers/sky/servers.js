/**
 * @param {import("../../bot.js").MessageDataPublic} message
 */
export const command = async ({ client, respond }) => {
  const guilds = client.guilds.cache.map(
    (guild) => `- ${guild.name} (${guild.id})`
  );
  await respond({
    content: `${client.guilds.cache.size} servers:
${guilds.join("\n")}`,
    allowedMentions: { parse: [] },
  });
};
export const when = {
  starts: ["sky servers"],
  desc: "See what servers SkyAnswers got into.",
  input: false,
  public: true,
};
