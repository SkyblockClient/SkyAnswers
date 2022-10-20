import { hyperlink } from "discord.js";
import { getTrackedData, queryDownloadable, search as searchQuery } from "./data.js";
/**
 * @param {string} name
 * @param {string} content
 * @param {function} func
 */
export const handleCommand = async (name, content, func) => {
  if (content.startsWith(name)) await func(content.slice(name.length + 1));
};
/**
 * @param {import("discord.js").TextChannel} channel
 */
export const bump = async (channel) => {
  const pins = await channel.messages.fetchPinned();
  const openingMessage = pins
    .filter((message) => {
      return message.author.id == "557628352828014614" && message.content.includes("Welcome");
    })
    .first();
  const ticketOwner = openingMessage?.content?.match(/[0-9]+/)?.at(0);
  const seconds3DaysFromNow = Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 3);
  return await channel.send({
    ...(ticketOwner ? { content: `Hey <@${ticketOwner}>:` } : null),
    embeds: [
      {
        title: "Do you still need help?",
        description:
          `***Yes***: Restate your problem clearly. If someone asked you to upload something, do that.
***No, all my problems are solved***: Close the ticket. View the ` +
          (openingMessage ? `[pinned message](${openingMessage.url})` : "pinned message") +
          ` at the top, and click the :lock: button to close your ticket.
If you do not respond in the next 3 days (<t:${seconds3DaysFromNow}:R>), your ticket will be closed.`,
        color: 0xffff88,
      },
    ],
  });
};
/**
 * @param {string} query
 */
export const search = async (query) => {
  const answer = await searchQuery(query);
  if (!answer) {
    return {
      embeds: [
        {
          title: "Nothing relevant in the FAQ found",
          color: 0xff8888,
        },
      ],
    };
  }
  return {
    embeds: [
      {
        title: `FAQ: ${answer.questions[0]}`,
        description: answer.answer,
        color: 0x88ff88,
      },
    ],
  };
};
/**
 * @param {import("discord.js").TextChannel} channel
 */
export const help = async (channel) => {
  await channel.send(`Passive functionalities:
- sending the blame kti sticker will notify kti
- updating kti will notify kti
- mentioning kti during sleep hours will reply with a notice
- opening a ticket will start the support process
Commands:
- sky bump: bumps a ticket
- sky search [query]: looks up the query in the knowledge base
- sky help / ping me: this`);
};

const getDownloadableEmbed = (downloadable) => ({
  ...(downloadable.screenshot ? { image: { url: downloadable.screenshot } } : {}),
  color: Number("0x" + downloadable.hash.slice(0, 6)),
  title: downloadable.display,
  description: downloadable.description,
  fields: [
    ...(downloadable.command ? [{ name: "Command", value: downloadable.command }] : []),
    { name: "Download", value: hyperlink(downloadable.file, downloadable.download) },
  ],
  footer: { text: `Created by ${downloadable.creator}` },
  thumbnail: {
    url: `https://raw.githubusercontent.com/nacrt/SkyblockClient-REPO/main/files/icons/${encodeURIComponent(
      downloadable.icon
    )}`,
  },
});
/**
 * @param {import("discord.js").Message} message
 * @param string id
 */
export const findMod = async (message, id) => {
  const mods = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/mods.json"
  );
  const mod = await queryDownloadable(mods, id, "mods");
  if (!mod) {
    await message.reply(`No mod found for "${id}"`);
    return;
  }
  await message.reply({
    embeds: [getDownloadableEmbed(mod)],
  });
};
/**
 * @param {import("discord.js").Message} message
 * @param string id
 */
export const findPack = async (message, id) => {
  const packs = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/packs.json"
  );
  const pack = await queryDownloadable(packs, id, "packs");
  if (!pack) {
    await message.reply(`No pack found for "${id}"`);
    return;
  }
  await message.reply({
    embeds: [getDownloadableEmbed(pack)],
  });
};
