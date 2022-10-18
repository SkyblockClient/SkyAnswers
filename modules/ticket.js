import {
  ButtonStyle,
  ComponentType,
  OverwriteType,
  PermissionFlagsBits,
  TextInputStyle,
} from "discord.js";
import { search } from "./commands.js";

const ticketChooser = {
  content: "What is your ticket about? You must click on one to continue.",
  components: [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          customId: "crash",
          label: "I'm crashing",
          style: ButtonStyle.Primary,
        },
        {
          type: ComponentType.Button,
          customId: "install",
          label: "I need help with the installer",
          style: ButtonStyle.Primary,
        },
        {
          type: ComponentType.Button,
          customId: "mods",
          label: "I need help with mods",
          style: ButtonStyle.Primary,
        },
        {
          type: ComponentType.Button,
          customId: "other",
          label: "Something else (meta)",
          style: ButtonStyle.Secondary,
        },
      ],
    },
  ],
};
const faqMessage = {
  content:
    "Tell us your problem. I'll search it in the FAQ, tell support what it was, and unlock the channel for discussion.",
  components: [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          customId: "search",
          label: "Search",
          style: ButtonStyle.Primary,
        },
      ],
    },
  ],
};
const faqModal = {
  title: "Tell us your problem",
  customId: "modalSearch",
  components: [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.TextInput,
          label: "Provide a short description of your problem",
          customId: "problem",
          style: TextInputStyle.Short,
        },
      ],
    },
  ],
};
const crashMessage = {
  content: "In order to help us understand why you crash, what do you see when you crash?",
  components: [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          customId: "crashTypeCP",
          label: 'Skyclient says "Minecraft has crashed!"',
          style: ButtonStyle.Primary,
        },
        {
          type: ComponentType.Button,
          customId: "crashTypeLauncher",
          label: 'The launcher says "Game crashed"',
          style: ButtonStyle.Primary,
        },
        {
          type: ComponentType.Button,
          customId: "crashTypeOther",
          label: "Something else (like the game closing)",
          style: ButtonStyle.Primary,
        },
      ],
    },
  ],
};
const launcherLogChooser = {
  content: "What do you see when you crash?",
  components: [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          customId: "launcherCrashReport",
          label: 'There\'s a "View Crash Report" button',
          style: ButtonStyle.Primary,
        },
        {
          type: ComponentType.Button,
          customId: "launcherLog",
          label: 'There isn\'t a "View Crash Report" button',
          style: ButtonStyle.Primary,
        },
      ],
    },
  ],
};

/**
 * @param {import("discord.js").Interaction} interaction
 */
const sendFaqModal = async (interaction) => {
  await interaction.showModal(faqModal);
};
/**
 * @param {import("discord.js").Interaction} interaction
 */
const answerFaqModal = async (interaction) => {
  const question = interaction.fields.getTextInputValue("problem");
  await interaction.update({
    ...(await search(question, interaction.channel)),
    content: `User's question: ${question}`,
    components: [],
  });
  await unlockChannel(interaction.channel);
};

/**
 * @param {import("discord.js").TextChannel} channel
 */
const startCrashFlow = async (channel) => {
  await channel.send(crashMessage);
};
/**
 * @param {import("discord.js").Interaction} interaction
 */
const sendLogInstructions = async (interaction) => {
  if (interaction.customId == "crashTypeCP") {
    await interaction.update({ content: "User crashed w/ CrashPatch", components: [] });
    await interaction.channel.send(
      'Click the button that says "Copy crash report" and paste it here.'
    );
  } else if (interaction.customId == "crashTypeLauncher") {
    await interaction.update({ content: "User crashed into the launcher", components: [] });
    await interaction.channel.send(launcherLogChooser);
  } else {
    await interaction.update({ content: "User crashed otherwise", components: [] });
    await interaction.channel.send("Describe how you crashed so we can help you.");
  }
  if (interaction.customId != "crashTypeLauncher") await unlockChannel(interaction.channel);
};
/**
 * @param {import("discord.js").Interaction} interaction
 */
const sendLogFromLauncherInstructions = async (interaction) => {
  await interaction.update({
    embeds: [
      {
        title: "Upload your log",
        description:
          `1. Open your SkyClient folder. [See this video.](https://youtu.be/BHIM2htfMk8)
2. ` +
          (interaction.customId == "launcherCrashReport"
            ? "Go to the `crash-reports` folder and upload the most recent file here."
            : "Go to the `logs` folder and upload the file called `latest.log`."),
        color: 0x88ff88,
      },
    ],
    content: "",
    components: [],
  });
  await unlockChannel(interaction.channel);
};

/**
 * @param {import("discord.js").TextChannel} channel
 */
export const unlockChannel = async (channel) => {
  const perms = channel.permissionOverwrites.cache.values();
  const creator = Array.from(perms).find(
    (perm) =>
      perm.type == OverwriteType.Member &&
      perm.allow.has(PermissionFlagsBits.ViewChannel) &&
      perm.deny.has(PermissionFlagsBits.SendMessages)
  );
  if (creator) await channel.permissionOverwrites.edit(creator.id, { SendMessages: true });
  else console.warn("Could not unlock channel", perms);
};
/**
 * @param {import("discord.js").Integration} interaction
 */
const respondToTicketType = async (interaction) => {
  await interaction.update({
    content:
      "User-chosen category: " +
      {
        crash: "Crashing",
        install: "Help with installer",
        mods: "Help with mods",
        other: "Other",
      }[interaction.customId],
    components: [],
  });
  if (interaction.customId == "crash") {
    await startCrashFlow(interaction.channel);
  } else {
    interaction.channel.send(faqMessage);
  }
};
/**
 * @param {import("discord.js").TextChannel} channel
 */
export const handleNewTicket = async (channel) => {
  const perms = Array.from(channel.permissionOverwrites.cache.values());
  const creator = perms.find(
    (perm) => perm.type == OverwriteType.Member && perm.allow.equals(3072n) && perm.deny.equals(0n)
  );
  await channel.send(ticketChooser);
  if (creator) await channel.permissionOverwrites.edit(creator.id, { SendMessages: false });
  else console.warn("Could not lock channel", perms);
};

export const interactions = {
  crash: respondToTicketType,
  install: respondToTicketType,
  mods: respondToTicketType,
  other: respondToTicketType,
  search: sendFaqModal,
  modalSearch: answerFaqModal,
  crashTypeCP: sendLogInstructions,
  crashTypeLauncher: sendLogInstructions,
  crashTypeOther: sendLogInstructions,
  launcherCrashReport: sendLogFromLauncherInstructions,
  launcherLog: sendLogFromLauncherInstructions,
};
