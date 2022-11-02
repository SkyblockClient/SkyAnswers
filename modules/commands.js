import { getTrackedData, search as searchQuery } from "./data.js";
import { interactions as repoInteractions } from "./repo.js";
import { interactions as ticketInteractions } from "./ticket.js";

export const handleCommand = async (name, content, func) => {
  if (Array.isArray(name)) {
    await Promise.all(name.map(async (n) => await handleCommand(n, content, func)));
    return;
  }
  const prefix = name + " ";
  if (content.startsWith(prefix)) await func(content.slice(prefix.length));
};
export const interactions = {
  ...repoInteractions,
  ...ticketInteractions,
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
- messages will eventually be used to track when people are awake
Commands:
- sky bump: bumps a ticket
- sky unlock: tries to give send message perms to everyone in a ticket
- sky search [query]: looks up the query in the knowledge base
- sky help / ping me: this
- -mod [id/name]: tells you about a mod
- -pack [id/name]: tells you about a resource pack
- -mods: lists the mods
- -packs: lists the resource packs
- -discord [id/name]: gets the link to a discord server we have
- -invalidate: clears data caches
- -update [url]: updates a mod`);
};

/**
 * @param {string} message
 */
export const findAutoresp = async (message) => {
  const options = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/botautoresponse.json"
  );
  const matches = options
    .map((option) => {
      if (option.unclebot) return message == option.triggers[0][0] && option.response;

      const matcher = new RegExp(
        option.triggers
          .map((part) => {
            const escapeForGroup = (str) => str.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
            return `(?:${part.map((trig) => escapeForGroup(trig)).join("|")})`;
          })
          .join("[^]*")
      );
      if (matcher.test(message)) return option.response;
    })
    .filter((resp) => resp);
  return matches;
};
