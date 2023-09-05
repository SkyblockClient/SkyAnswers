import { getTrackedData, queryDownloadable } from "../../data.js";
export const getDiscordEmbed = (item) => {
  const message = {
    content: "discord.gg/" + item.code,
    embeds: [
      {
        color: 0x8ff03f,
        title: item.fancyname,
      },
    ],
  };
  if (item.icon) {
    message.embeds[0].thumbnail = {
      url:
        "https://raw.githubusercontent.com/nacrt/SkyblockClient-REPO/main/files/discords/" +
        encodeURIComponent(item.icon),
    };
  }
  if (item.description) {
    message.embeds[0].description = item.description;
  }
  return message;
};

/**
 * @param {import("../../bot.js").MessageDataPublic} message
 * @param {string} query
 */
export const command = async ({ respond }, query) => {
  const items = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/discords.json"
  );
  const item = await queryDownloadable(items, query);
  if (!item) {
    return await respond({ content: `No discord found for "${query}"` });
  }
  await respond(getDiscordEmbed(item));
};
export const when = {
  starts: ["-discord"],
  desc: "Gives the link to a discord",
  input: true,
  public: true,
};
