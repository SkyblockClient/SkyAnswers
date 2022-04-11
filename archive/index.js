// Require the necessary discord.js classes
const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");
const { chatWelcome, askCategory } = require("./messages");

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Ready!");
});

// Respond to stuff
client.on("channelCreate", (channel) => {
  if (!channel.name.startsWith("ticket-")) return;
  console.log(`Intercepted ticket: ${channel.name}`);
  const myPerms = channel.permissionsFor(channel.guild.me);
  if (myPerms.has("SEND_MESSAGES")) {
    startHelp(channel);
  } else {
    console.log("Skipping because no permissions");
  }
});

const startHelp = async (channel) => {
  console.log(`Starting help in ${channel.name}`);
  const welcomeMessage = chatWelcome(channel);
  const categoryMessage = askCategory(welcomeMessage);
  const response = await collectActions(categoryMessage, "BUTTON");
  if (response.customId == "restart") {
    response.reply("Okay, restarting...");
    startHelp(channel);
  } else if (response.customId == "yes") {
    const crashTypeQuestionMessage = askWhenCrashing(crashQuestionMessage);
  } else if (response.customId == "no") {
    const categoryAction = new MessageActionRow().addComponents(
      new MessageSelectMenu().setCustomId("helpTopic").addOptions(
        {
          label: "Something's stopping me from playing",
          value: "stopping",
        },
        {
          label: "Something in a mod isn't working",
          value: "modNotWorking",
        },
        {
          label: "I want to know how to do something with a mod",
          value: "modHelp",
        },
        {
          label: "I'm having trouble setting up Skyclient",
          value: "skyclientSetup",
        }
      )
    );
    const restartAction = new MessageActionRow().addComponents(
      new MessageButton().setLabel("Restart").setCustomId("restart").setStyle("DANGER")
    );
    const helpTopicQuestionMessage = await crashQuestionMessage.reply({
      embeds: [WHAT_TOPIC_QUESTION_EMBED],
      components: [categoryAction, restartAction],
      fetchReply: true,
    });
  }
};

// Login to Discord with your client's token
client.login(token);
