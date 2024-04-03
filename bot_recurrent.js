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
      const action = await (async () => {
        if (ticket.name.startsWith("closed")) return "archive";

        const ownerId = await getOwner(ticket);
        const owner = guild.members.cache.get(ownerId);
        if (!owner) return "close-ownerless";

        const messages = await ticket.messages.fetch();
        const bump = getBumpMessage(messages);
        const lastMessage =
          getLastMessage(messages, ownerId) ||
          getLastMessage(messages, "444871677176709141");

        if (bump) {
          if (
            lastMessage &&
            lastMessage.createdTimestamp > bump.createdTimestamp
          ) {
            if (
              Date.now() - lastMessage.createdTimestamp >
              1000 * 60 * 60 * 24 * 2
            )
              return "bump-stale1";
            return "none1";
          }
          if (Date.now() - bump.createdTimestamp > 1000 * 60 * 60 * 24 * 2)
            return "close-bumped";
          return "none2";
        } else {
          if (
            lastMessage &&
            Date.now() - lastMessage.createdTimestamp > 1000 * 60 * 60 * 24 * 2
          )
            return "bump-stale2";
          return "none3";
        }
      })();

      const friendly = {
        archive: "**ARCHIVE**",
        "close-ownerless": "**CLOSE** (no owner)",
        "close-bumped": "**CLOSE** (dead)",
        "bump-stale1": "**bump** (restale)",
        "bump-stale2": "**bump** (stale)",
        // none1: "none but will restale soon",
        // none2: "none but will close soon",
        // none3: "none but will stale soon",
      }[action];
      if (friendly)
        table.push({
          ticket,
          message: `<#${ticket.id}> ${friendly}`,
        });
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
