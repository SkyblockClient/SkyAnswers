const { MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
export const collectActions = (message, componentFilter) => {
  const collector = message.createMessageComponentCollector({
    componentType: componentFilter,
    time: 30000,
  });
  return new Promise((resolve, reject) => {
    collector.on("collect", (interaction) => {
      interaction.deferUpdate();
      resolve(interaction);
    });
  });
};
export const chatWelcome = async (channel) => {
  return await channel.send({
    embeds: [
      {
        title: "SkyAnswers Support",
        description:
          ":wave: Hey! I'm a support bot, designed to answer your questions automatically. " +
          "Even if I don't fix the problem, the info you share will help the humans to fix it. " +
          "You'll have 30 seconds after each message until the actions deactivate.",
        color: 0x88ff88,
      },
    ],
  });
};
export const askCategory = async (baseMessage) => {
  /* - Something's stopping me from playing
- Something in a mod isn't working
- I want to know how to do something with a mod
- I'm having trouble setting up Skyclient */
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Something's stopping me from playing")
      .setCustomId("stopping")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("Something in a mod isn't working")
      .setCustomId("modNotWorking")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("I want to know something related to a mod")
      .setCustomId("modHelp")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("I'm having trouble setting up Skyclient")
      .setCustomId("skyclientSetup")
      .setStyle("SECONDARY")
  );
  await baseMessage.reply({
    embeds: [
      {
        title: "SkyAnswers Support | What's the problem?",
        description: "Please select the category of the problem.",
        color: 0x88ff88,
      },
    ],
    components: [choiceActions],
    fetchReply: true,
  });
};
/*export const askIsCrashing = async (channel) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton().setLabel("Yes").setCustomId("yes").setStyle("SECONDARY"),
    new MessageButton().setLabel("No").setCustomId("no").setStyle("SECONDARY"),
    new MessageButton().setLabel("Restart").setCustomId("restart").setStyle("DANGER")
  );
  return await channel.send({
    embeds: [
      {
        title: "SkyAnswers Support - #1",
        description: "Is your question related to crashing at any point?",
        color: 0x8888ff,
      },
    ],
    components: [choiceActions],
  });
};
export const askWhenCrashing = async (message) => {
  const restartAction = new MessageActionRow().addComponents(
    new MessageButton().setLabel("Restart").setCustomId("restart").setStyle("DANGER")
  );
  const choiceActions = new MessageActionRow().addComponents(
    new MessageSelectMenu().setCustomId("crashType").addOptions([
      {
        label: "When I start Minecraft",
        description: "Before the main menu loads",
        value: "start",
      },
      {
        label: "When I join Hypixel",
        description: "The first time you launch Minecraft and log on to Hypixel",
        value: "join",
      },
      {
        label: "Some other time",
        description: "None of the above make sense",
        value: "other",
      },
    ])
  );
  return message.reply({
    embeds: [
      {
        title: "SkyAnswers Support - #2",
        description: "When does Minecraft crash?",
        color: 0x8888ff,
      },
    ],
    components: [choiceActions, restartAction],
    fetchReply: true,
  });
};
*/
