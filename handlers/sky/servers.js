import { ChannelType } from "discord.js";

export const command = async ({ client, respond }) => {
  const channels = client.guilds.cache.map((guild) =>
    guild.channels.cache.filter((channel) => channel.type == ChannelType.GuildText).first()
  );
  const invites = await Promise.all(
    channels.map(async (ch) => {
      try {
        const invite = await ch.createInvite();
        return "discord.gg/" + invite.code;
      } catch (e) {}
    })
  );
  await respond({ content: invites.filter((inv) => inv).join("\n") });
};
export const when = {
  starts: ["sky servers"],
  desc: "Feeling bored? Find some servers with the wise choice of using SkyAnswers.",
  input: false,
  public: true,
};
