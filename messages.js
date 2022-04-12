import { MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js";

export const collectActions = (message, componentFilter) => {
  const collector = message.createMessageComponentCollector({
    componentType: componentFilter,
    time: 1000 * 60 * 10,
  });
  return new Promise((resolve) => {
    let hasResponse = false;
    collector.on("collect", (interaction) => {
      interaction.deferUpdate();
      hasResponse = true;
      resolve(interaction);
    });
    setTimeout(() => {
      if (hasResponse) return;
      if (!message.channel) return;
      message.reply("I didn't get any response in time.");
      resolve({ customId: "timeout" });
    }, 1000 * 60 * 10);
  });
};
export const chatWelcome = async (ticket) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Get Automated Help")
      .setCustomId("yes")
      .setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers Support",
        description:
          ":wave: Hey! I'm a support bot.\n" +
          "I'll try to find a solution, but if I can't, what you share will help us.",
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
          "Say your problem in a short single message, " +
          "and SkyAnswers will search the FAQ. or say " +
          "`skip` to skip this step.",
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
          "The FAQ part of SkyAnswers reached the max " +
          "of 161 uses per day. Don't worry, you did nothing wrong. " +
          "Let's move on to the solving process.",
        color: 0xff8888,
      },
    ],
  });
};
export const chatNoRelevantFAQ = async (ticket, phrasing) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > No relevant FAQ",
        description: phrasing + " Let's move on to the solving process.",
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
          "\n\nTry that, does it work? " +
          "(These buttons will deactivate in 10 minutes)",
        color: 0x8888ff,
      },
    ],
    components: [choiceActions],
  });
};
export const chatAskHelpCategory = async (ticket) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageSelectMenu({
      options: [
        {
          label: "Something's stopping/crashing/hindering me from playing",
          value: "stopping",
        },
        { label: "I'm having trouble setting up Skyclient", value: "setup" },
        { label: "Something in a mod isn't working", value: "modError" },
        { label: "I want to know how to do something with a mod", value: "modHelp" },
      ],
      customId: "helpCategory",
    })
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > What category do you need help with?",
        description:
          "Click on the dropdown, and choose the category that matches the most.",
        color: 0x88ff88,
      },
    ],
    components: [choiceActions],
  });
};

export const chatAskIfCrashing = async (ticket) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton().setLabel("Yes").setCustomId("yes").setStyle("SECONDARY"),
    new MessageButton().setLabel("No").setCustomId("no").setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "Example #1 (don't worry about the text)",
        image: {
          url: "https://cdn.discordapp.com/attachments/796546551878516766/963071809803145276/unknown.png",
        },
      },
      {
        title: "Example #2 (don't worry about the text)",
        image: {
          url: "https://cdn.discordapp.com/attachments/796546551878516766/963073992531542056/unknown.png",
        },
      },
      {
        title: "SkyAnswers > Are you crashing?",
        description:
          "Is Skyclient crashing? This could mean that the Minecraft launcher " +
          "says the game crashed, or Minecraft says " +
          '"Minecraft has crashed!".',
        color: 0x88ff88,
      },
    ],
    components: [choiceActions],
  });
};
export const chatAskIfCrashpatch = async (ticket) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton().setLabel("Yes").setCustomId("yes").setStyle("SECONDARY"),
    new MessageButton().setLabel("No").setCustomId("no").setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Do you have CrashPatch?",
        description: "When you crashed, did you see a screen kinda like this?",
        color: 0x88ff88,
        image: {
          url: "https://cdn.discordapp.com/attachments/796546551878516766/963071809803145276/unknown.png",
        },
      },
    ],
    components: [choiceActions],
  });
};
export const chatAskUseSolution = async (ticket) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Yes, the solution works")
      .setCustomId("yesDone")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("Yes, but it's not working")
      .setCustomId("yesNotDone")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("No, I don't see a solution")
      .setCustomId("no")
      .setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Does it have a solution?",
        description:
          "Do you see some steps to fix the problem? " + "If so, follow them.",
        color: 0x88ff88,
      },
    ],
    components: [choiceActions],
  });
};
export const chatAskForErrorCode = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Do you have an error code?",
        description: "Do you see an error code? If so, tell us here. " /* +
          "In 15 seconds, we'll go to the next step."*/,
        color: 0x88ff88,
      },
    ],
  });
};
export const chatAskForLogs = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Send your crash report.",
        description: `Do you have a crash report? If so, send it here.
Here's how to do that:
1. Find your Minecraft folder. [Here's a video guide (don't enter your mods folder).](https://www.youtube.com/watch?v=E6lwqIo0-Ms)
2. Enter your logs folder.
3. Upload the \`latest.log\` file. (You can either copy and paste it into Discord, or drag it into the chat.)
`,
        // In 15 seconds, we'll go to the next step.
        color: 0x88ff88,
      },
    ],
  });
};
export const chatAskWhenCrashing = async (ticket) => {
  const choiceActions = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("When I launch Minecraft")
      .setCustomId("launch")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("When I join Hypixel")
      .setCustomId("login")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setLabel("Another time")
      .setCustomId("other")
      .setStyle("SECONDARY")
  );
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > When did you crash?",
        description:
          "Click the button that says when you crashed. " +
          "If you want, you can elaborate in chat.",
        color: 0x88ff88,
      },
    ],
    components: [choiceActions],
  });
};
export const chatAskThanos = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Narrow down the mod.",
        description: `If you don't know what mod is crashing, we can find out with the Thanos method.
Don't worry, we're just seeing if you crash with half of your mods.
So here's what you would do:
1. Select half of your mods.
2. Place them somewhere else.
3. Launch Minecraft and see if you still crash.
  - If you still crash, remove another half, and repeat.
  - If you don't crash, add back half of the mods you removed, and repeat.

Then, tell us what mod makes the difference between crashing and not crashing.`,
        color: 0x88ff88,
      },
    ],
  });
};

export const chatAskLauncherInfo = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Tell us more so we can help you setup Skyclient.",
        description:
          "Say what OS you're on, what type of Skyclient installer you're using " +
          "(exe/jar/web), and what Minecraft launcher you're using.",
        color: 0x88ff88,
      },
    ],
  });
};
export const chatAskModInfo = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Tell us more about the mod that isn't working.",
        description:
          "Say the name of the mod you're having trouble with, " +
          "and what you wanted to do with it.",
        color: 0x88ff88,
      },
    ],
  });
};
export const chatReferToGuides = async (ticket) => {
  return await ticket.send({
    embeds: [
      {
        title: "SkyAnswers > Guides to help you with your mods",
        description:
          "If you want to view some info about what different mods do, " +
          "[check out the guides](https://github.com/nacrt/SkyblockClient-REPO/tree/main/files/guides).",
        color: 0x88ff88,
      },
    ],
  });
};
