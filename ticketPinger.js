/**
 * @param {import("discord.js").Guild} param0
 */
export const run = async (guild) => {
  const allTickets = Array.from(
    guild.channels.cache.filter((c) => ticketMatcher.test(c.name)).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  await Promise.all(
    allTickets.map(async (ticket) => {
      if (ticket.name.startsWith("closed-")) return;
      const ownerId = await getOwner(ticket);
      const owner = guild.members.cache.get(ownerId);
      if (!owner) {
        await ticket.send("<@&931626562539909130> time to close (owner left)");
        return;
      }
      const messages = await ticket.messages.fetch();
      const bump = await getBumpMessage(messages);
      const lastMessage = messages.first();
      if (!bump) return;
      if (Date.now() - bump.createdTimestamp < 1000 * 60 * 60 * 24 * 2) return;
      if (lastMessage.id != bump.id) return;
      await ticket.send("<@&931626562539909130> time to close (stale bump)");
    })
  );
};
const ticketMatcher = /(?:ticket-|closed-)(\d+)/;
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
