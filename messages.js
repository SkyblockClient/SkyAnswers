import { MessageActionRow, MessageButton } from "discord.js";

export const collectActions = (message, componentFilter) => {
  const collector = message.createMessageComponentCollector({
    componentType: componentFilter,
    time: 1000 * 60 * 10,
  });
  return new Promise((resolve) => {
    collector.on("collect", (interaction) => {
      interaction.deferUpdate();
      resolve(interaction);
    });
    setTimeout(() => resolve(), 30000);
  });
};
export const chatWelcome = async (ticket) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton().setLabel("Yes").setCustomId("yes").setStyle("SECONDARY"),
    new MessageButton().setLabel("No").setCustomId("no").setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers Support",
        description:
          ":wave: Hey! I'm a support bot, designed to answer your questions automatically. " +
          "Even if I don't fix the problem, the info you share will help our support team to fix it. " +
          "You'll have 10 minutes max to respond to each question. " +
          "Do you want to continue, or not use this bot?",
        color: 0x88ff88,
      },
    ],
    components: [choiceActions],
  });
};
export const chatAskForFAQ = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > What's the problem?",
        description:
          "Type your problem in a sentence or two in a single message, " +
          "and SkyAnswers will search the FAQ for you.",
        color: 0x88ff88,
      },
    ],
  });
};
export const chatQuotaReached = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Quota reached",
        description:
          "The FAQ service that SkyAnswers uses internally has a limit " +
          "of 161 requests per day. Don't worry about it, you did nothing wrong. " +
          "Let's move on to the question solving process.",
        color: 0xff8888,
      },
    ],
  });
};
export const chatNoRelevantFAQ = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > No relevant FAQ",
        description:
          "Sorry, we couldn't find any relevant FAQ for your question. " +
          "Let's move on to the question solving process.",
        color: 0xff8888,
      },
    ],
  });
};
export const chatIsFAQRelevant = async (ticket, question) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton().setLabel("Yes").setCustomId("yes").setStyle("SECONDARY"),
    new MessageButton().setLabel("No").setCustomId("no").setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Is this FAQ relevant?",
        description:
          "We found the following FAQ for your question:\n**" +
          question +
          "**\nIs that your question?",
        color: 0x88ff88,
      },
    ],
    components: [choiceActions],
  });
};
export const chatFAQAnswer = async (ticket, answer) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("My issue is solved")
      .setCustomId("yes")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("Proceed with normal solving")
      .setCustomId("no")
      .setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > FAQ answer",
        description:
          answer +
          "\n\nTry that out. Is it working? " +
          "(These buttons will deactivate in 10 minutes)",
        color: 0x8888ff,
      },
    ],
    components: [choiceActions],
  });
};
