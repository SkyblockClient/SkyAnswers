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

  /**
   * @type {{
   *   ticket: import("discord.js").TextChannel,
   *   message: string
   * }[]}
   */
  const table = [];
  await Promise.all(
    allTickets.map(async (ticket) => {
      if (ticket.name.startsWith("closed")) {
        const messages = await ticket.messages.fetch();
        const close = await getCloseMessage(messages);
        table.push({
          ticket,
          message:
            "**Archive** " +
            `<#${ticket.id}> - closed ` +
            (close
              ? `<t:${Math.floor(close.createdTimestamp / 1000)}:R>`
              : "UNKNOWN"),
        });
      } else {
        const ownerId = await getOwner(ticket);
        const owner = guild.members.cache.get(ownerId);
        if (!owner) {
          await ticket.send(
            "<@&931626562539909130> time to close (owner left)"
          );
          table.push({
            ticket,
            message: `**Ownerless** <#${ticket.id}> (<@${ownerId}> left)`,
          });
          return;
        }

        const messages = await ticket.messages.fetch();
        const bump = getBumpMessage(messages);
        const lastMessage = getLastMessage(messages, ownerId);
        if (bump) {
          if (Date.now() - bump.createdTimestamp < 1000 * 60 * 60 * 24 * 2)
            return;
          if (
            lastMessage &&
            lastMessage.createdTimestamp > bump.createdTimestamp
          )
            return;
          await ticket.send(
            "<@&931626562539909130> time to close (stale bump)"
          );
          table.push({
            ticket,
            message:
              "**Owner abandonment** " +
              `<#${ticket.id}> (bumped <t:${Math.floor(
                bump.createdTimestamp / 1000
              )}:R>)`,
          });
        } else {
          const isStale =
            lastMessage &&
            Date.now() - lastMessage.createdTimestamp > 1000 * 60 * 60 * 24 * 2;
          if (isStale) {
            table.push({
              ticket,
              message:
                "**Stale** " +
                `<#${ticket.id}> (last message <t:${Math.floor(
                  lastMessage.createdTimestamp / 1000
                )}:R>)`,
            });
          }
        }
      }
    })
  );

  table.sort((a, b) => {
    const aId = a.ticket.name.split("-")[1];
    const bId = b.ticket.name.split("-")[1];
    return Number(aId) - Number(bId);
  });

  const ticketChannel = /** @type {import("discord.js").TextChannel} */ (
    guild.channels.cache.get("1222344626325688330")
  );
  if (ticketChannel) {
    const messages = await ticketChannel.messages.fetch();
    let sticky = messages.first();
    if (!sticky || sticky.author.id != guild.client.user.id) {
      sticky = await ticketChannel.send("sticky");
    }

    await sticky.edit(
      table.length == 0
        ? "No action needed."
        : table.map(({ message }) => message).join("\n")
    );
  }
};

const ticketMatcher = /(?:ticket|closed)-(\d+)/;
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
const getCloseMessage = (messages) => {
  const closeMessage = messages
    .filter(
      (message) =>
        message.author.id == "557628352828014614" &&
        message.embeds.some((embed) =>
          embed.description.includes("Ticket Closed by")
        )
    )
    .first();
  return closeMessage;
};
