/**
 * @param {import("../../bot.js").MessageData} message
 */
export const command = async (message) => {
  const pins = await message.channel.messages.fetchPinned();
  const openingMessage = pins
    .filter((message) => {
      return (
        message.author.id == "557628352828014614" &&
        message.content.includes("Welcome")
      );
    })
    .first();
  const ticketOwner = openingMessage?.content?.match(/[0-9]+/)?.at(0);
  const seconds2DaysFromNow = Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 2);
  await message.delete();
  await message.channel.send({
    ...(ticketOwner ? { content: `Hey <@${ticketOwner}>:` } : null),
    embeds: [
      {
        title: "Do you still need help?",
        description:
          `***Yes***: Restate your problem clearly. If someone asked you to upload something, do that.
***No, all my problems are solved***: Close the ticket. View the ` +
          (openingMessage
            ? `[pinned message](${openingMessage.url})`
            : "pinned message") +
          ` at the top, and click the :lock: button to close your ticket.
If you do not respond in the next 2 days (<t:${seconds2DaysFromNow}:R>), your ticket will be closed.`,
        color: 0xffff88,
      },
    ],
  });
};
export const when = {
  starts: ["sky bump"],
  desc: "Bumps a ticket to encourage closing",
  input: false,
};
