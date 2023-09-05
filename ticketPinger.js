/**
 * @param {import("discord.js").Guild} guild
 */
export const run = async (guild) => {
  const allTickets = /** @type {import("discord.js").TextChannel[]} */ (
    Array.from(
      guild.channels.cache.filter((c) => ticketMatcher.test(c.name)).values()
    )
  );
  allTickets.sort((a, b) => a.name.localeCompare(b.name));
  await Promise.all(
    allTickets.map(async (ticket) => {
      const ownerId = await getOwner(ticket);
      const owner = guild.members.cache.get(ownerId);
      if (!owner) {
        await ticket.send("<@&931626562539909130> time to close (owner left)");
        return;
      }
      const messages = await ticket.messages.fetch();
      const bump = getBumpMessage(messages);
      const lastMessage = getLastMessage(messages, ownerId);
      if (!bump) return;
      if (Date.now() - bump.createdTimestamp < 1000 * 60 * 60 * 24 * 2) return;
      if (lastMessage && lastMessage.createdTimestamp > bump.createdTimestamp)
        return;
      await ticket.send("<@&931626562539909130> time to close (stale bump)");
    })
  );
};
const ticketMatcher = /ticket-(\d+)/;
const getOwner = async (ticket) => {
  const pins = await ticket.messages.fetchPinned();
  const openingMessage = pins
    .filter((message) => {
      return (
        message.author.id == "557628352828014614" &&
        message.content.includes("Welcome")
      );
    })
    .first();
  const ticketOwner = openingMessage?.content?.match(/[0-9]+/)?.at(0);
  return ticketOwner;
};
const getBumpMessage = (messages) => {
  const bumpMessage = messages
    .filter((message) =>
      message.embeds.some((embed) => embed.title == "Do you still need help?")
    )
    .first();
  return bumpMessage;
};
const getLastMessage = (messages, ownerId) => {
  const bumpMessage = messages
    .filter((message) => message.author.id == ownerId)
    .first();
  return bumpMessage;
};
