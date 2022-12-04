/**
 * @param {import("discord.js").Message} param0
 */
export const command = async ({ respond, guild }) => {
  const allTickets = Array.from(
    guild.channels.cache.filter((c) => ticketMatcher.test(c.name)).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  const ticketTable = await Promise.all(
    allTickets.map(async (ticket) => {
      const closed = ticket.name.startsWith("closed-");
      if (closed) {
        const messages = await ticket.messages.fetch();
        const close = await getCloseMessage(messages);
        const closeIsOld = close && Date.now() - close.createdTimestamp > 1000 * 60 * 60 * 24 * 3;
        console.log(ticket.name, close, closeIsOld);
        return (
          (closeIsOld ? "ARCHIVE: " : "") +
          `<#${ticket.id}> - closed ` +
          (close ? `<t:${Math.floor(close.createdTimestamp / 1000)}:R>` : "UNKNOWN")
        );
      } else {
        const ownerId = await getOwner(ticket);
        const owner = guild.members.cache.get(ownerId);
        if (!owner) return `NO OWNER: <#${ticket.id}> (<@${ownerId}> has left)`;
        const messages = await ticket.messages.fetch();
        const bump = await getBumpMessage(messages);
        const lastMessage = messages.first();
        if (bump) {
          const bumpIsOld = Date.now() - bump.createdTimestamp > 1000 * 60 * 60 * 24 * 3;
          return (
            (bumpIsOld ? "OLD BUMP: " : "") +
            `<#${ticket.id}> - ` +
            `bumped <t:${Math.floor(bump.createdTimestamp / 1000)}:R>` +
            (lastMessage.id != bump.id ? " (response)" : "")
          );
        }
        const messageIsOld = Date.now() - lastMessage.createdTimestamp > 1000 * 60 * 60 * 24 * 3;
        return (
          (messageIsOld ? "STALE: " : "") +
          `<#${ticket.id}> - last message <t:${Math.floor(lastMessage.createdTimestamp / 1000)}:R>`
        );
      }
    })
  );
  const chunkedTickets = ticketTable.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 15);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
  for (const tickets of chunkedTickets) await respond({ content: tickets.join("\n") });
};
const ticketMatcher = /(?:ticket-|closed-)(\d+)/;
const getOwner = async (ticket) => {
  const pins = await ticket.messages.fetchPinned();
  const openingMessage = pins
    .filter((message) => {
      return message.author.id == "557628352828014614" && message.content.includes("Welcome");
    })
    .first();
  const ticketOwner = openingMessage?.content?.match(/[0-9]+/)?.at(0);
  return ticketOwner;
};
const getCloseMessage = (messages) => {
  const closeMessage = messages
    .filter(
      (message) =>
        message.author.id == "557628352828014614" &&
        message.embeds.some((embed) => embed.description.includes("Ticket Closed by"))
    )
    .first();
  return closeMessage;
};
const getBumpMessage = (messages) => {
  const bumpMessage = messages
    .filter((message) => message.embeds.some((embed) => embed.title == "Do you still need help?"))
    .first();
  return bumpMessage;
};

export const when = {
  starts: ["sky tickets"],
  desc: "Gets data about the current tickets",
  input: false,
};
